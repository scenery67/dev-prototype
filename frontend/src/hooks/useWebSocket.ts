import { useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BossRaidMessage, ChannelState } from '../types';

interface UseWebSocketReturn {
  isConnected: boolean;
  stompClient: Client | null;
  bossChannels: { [bossType: string]: string[] };
  channelStates: { [bossType: string]: { [channelId: string]: ChannelState } };
  setBossChannels: React.Dispatch<React.SetStateAction<{ [bossType: string]: string[] }>>;
  setChannelStates: React.Dispatch<React.SetStateAction<{ [bossType: string]: { [channelId: string]: ChannelState } }>>;
}

export function useWebSocket(selectedBossType: string): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [bossChannels, setBossChannels] = useState<{ [bossType: string]: string[] }>({});
  const [channelStates, setChannelStates] = useState<{
    [bossType: string]: { [channelId: string]: ChannelState };
  }>({});

  useEffect(() => {
    const getWebSocketUrl = () => {
      if (import.meta.env.DEV) {
        return '/ws';
      } else {
        const backendUrl = import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:8080`;
        return `${backendUrl}/ws`;
      }
    };

    const client = new Client({
      webSocketFactory: () => new SockJS(getWebSocketUrl()) as any,
      onConnect: (frame) => {
        setIsConnected(true);
        console.log('WebSocket connected, frame:', frame);
        
        // 채널 목록 구독
        client.subscribe('/topic/boss-raid/channels', (message) => {
          const data: BossRaidMessage = JSON.parse(message.body);
          if (data.type === 'CHANNEL_LIST' && data.bossChannels) {
            // Set을 배열로 변환
            const converted: { [bossType: string]: string[] } = {};
            Object.entries(data.bossChannels).forEach(([bossType, channels]) => {
              converted[bossType] = Array.isArray(channels) ? channels : Object.keys(channels);
            });
            setBossChannels(converted);
          }
        });
        
        // 개인 큐 구독 (초기 동기화)
        // Spring의 convertAndSendToUser는 /user/{username}/queue/boss-state로 변환
        // 세션 ID를 사용자 이름으로 사용하는 경우 /user/{sessionId}/queue/boss-state가 됨
        // 하지만 프론트엔드에서는 /user/queue/boss-state로 구독하면 Spring이 자동으로 매칭
        client.subscribe('/user/queue/boss-state', (message) => {
          console.log('Message received on /user/queue/boss-state:', message);
          const data: BossRaidMessage = JSON.parse(message.body);
          console.log('STATE_SYNC received:', JSON.stringify(data, null, 2));
          if (data.type === 'STATE_SYNC') {
            if (data.fullState) {
              // 보스별 채널 상태 설정 (status, memo 포함)
              const fullState = data.fullState as { [bossType: string]: { [channelId: string]: ChannelState } };
              console.log('Full state received:', fullState);
              // 깊은 복사하여 상태 설정
              const normalizedState: { [bossType: string]: { [channelId: string]: ChannelState } } = {};
              Object.entries(fullState).forEach(([bossType, channels]) => {
                normalizedState[bossType] = {};
                      Object.entries(channels).forEach(([channelId, state]) => {
                        console.log(`Processing ${bossType}/${channelId}:`, state);
                        
                        // dragonColors 처리: 빈 객체가 아닌 경우에만 포함
                        let dragonColors: { [dragonType: string]: string } | undefined = undefined;
                        if (state?.dragonColors) {
                          const colors = state.dragonColors;
                          if (colors && typeof colors === 'object' && Object.keys(colors).length > 0) {
                            dragonColors = { ...colors };
                            console.log(`  -> dragonColors set for ${bossType}/${channelId}:`, dragonColors);
                          }
                        }
                        
                        // hydraStates 처리: spawnMinutes가 있거나 실제 데이터가 있는 경우 포함
                        let hydraStates: { [hydraType: string]: any } | undefined = undefined;
                        if (state?.hydraStates && Object.keys(state.hydraStates).length > 0) {
                          hydraStates = {};
                          Object.entries(state.hydraStates).forEach(([type, hydraState]) => {
                            if (hydraState) {
                              // spawnMinutes가 있거나 caughtTime/spawnTime이 있으면 포함
                              if (hydraState.spawnMinutes || hydraState.caughtTime || hydraState.spawnTime) {
                                hydraStates![type] = {
                                  caughtTime: hydraState.caughtTime || undefined,
                                  spawnTime: hydraState.spawnTime || undefined,
                                  spawnMinutes: hydraState.spawnMinutes || undefined,
                                };
                              }
                            }
                          });
                          if (Object.keys(hydraStates).length === 0) {
                            hydraStates = undefined;
                          }
                        }
                        
                        normalizedState[bossType][channelId] = {
                          status: state?.status || undefined,
                          memo: state?.memo || undefined,
                          dragonColors,
                          hydraStates,
                        };
                      });
              });
              console.log('Normalized state:', normalizedState);
              setChannelStates(normalizedState);
            }
            if (data.bossChannels) {
              // Set을 배열로 변환
              const converted: { [bossType: string]: string[] } = {};
              Object.entries(data.bossChannels).forEach(([bossType, channels]) => {
                converted[bossType] = Array.isArray(channels) ? channels : Object.keys(channels);
              });
              setBossChannels(converted);
            }
          }
        });
        
        // 전체 상태 요청
        client.publish({
          destination: '/app/boss/sync',
          body: JSON.stringify({}),
        });
        
        // 채널 목록 요청
        client.publish({
          destination: '/app/boss/channel.list',
          body: JSON.stringify({}),
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);

  // 보스 타입 변경 시 상태 재동기화
  useEffect(() => {
    if (!stompClient || !isConnected || !selectedBossType) return;
    
    // 보스 타입이 변경될 때마다 전체 상태를 다시 동기화
    // 이렇게 하면 전환 중에 온 메시지들도 반영됨
    stompClient.publish({
      destination: '/app/boss/sync',
      body: JSON.stringify({}),
    });
  }, [stompClient, isConnected, selectedBossType]);

  // 모든 보스 타입에 대해 채널 상태 구독 (구독 해제하지 않음)
  useEffect(() => {
    if (!stompClient || !isConnected) return;

    const subscriptions: any[] = [];
    const bossTypes = ['용', '해골왕', '수화룡'];
    
    // 모든 보스 타입에 대해 구독
    bossTypes.forEach((bossType) => {
      const subscription = stompClient.subscribe(
        `/topic/boss-raid/channel-state/${bossType}`,
        (message) => {
          const data: BossRaidMessage = JSON.parse(message.body);
          if (data.type === 'STATE_CHANGE' && data.channelId && data.bossType) {
            // data.bossType을 사용하여 해당 보스 타입의 상태 업데이트
            const targetBossType = data.bossType;
            setChannelStates(prev => {
              const newStates = { ...prev };
              if (!newStates[targetBossType]) {
                newStates[targetBossType] = {};
              }
              const prevState = prev[targetBossType]?.[data.channelId!] || {};
            const newState = {
              status: data.status !== undefined ? data.status : prevState.status,
              memo: data.memo !== undefined ? data.memo : prevState.memo,
              dragonColors: prevState.dragonColors || {},
              hydraStates: prevState.hydraStates || {},
            };
            
            // 용 색상 업데이트
            if (data.dragonType) {
              // 초기화인 경우 (color가 null이거나 빈 문자열)
              if (!data.color || data.color === '') {
                const updatedDragonColors = { ...newState.dragonColors };
                delete updatedDragonColors[data.dragonType];
                newState.dragonColors = updatedDragonColors;
              } else {
                // 일반 업데이트
                newState.dragonColors = {
                  ...newState.dragonColors,
                  [data.dragonType]: data.color,
                };
              }
            }
            
            // 수화룡 시간 업데이트
            if (data.hydraType) {
              // 초기화인 경우 (caughtTime과 spawnTime이 모두 null)
              if (data.caughtTime === null && data.spawnTime === null) {
                const updatedHydraStates = { ...newState.hydraStates };
                delete updatedHydraStates[data.hydraType];
                newState.hydraStates = updatedHydraStates;
              } else if (data.caughtTime && data.spawnTime) {
                // 일반 업데이트
                newState.hydraStates = {
                  ...newState.hydraStates,
                  [data.hydraType]: {
                    caughtTime: data.caughtTime,
                    spawnTime: data.spawnTime,
                    spawnMinutes: data.spawnMinutes || newState.hydraStates[data.hydraType]?.spawnMinutes,
                  },
                };
              }
            }
            
              newStates[targetBossType][data.channelId!] = newState;
              return newStates;
            });
          }
        }
      );
      subscriptions.push(subscription);
    });

    return () => {
      // 모든 구독 해제
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [stompClient, isConnected]);

  return {
    isConnected,
    stompClient,
    bossChannels,
    channelStates,
    setBossChannels,
    setChannelStates,
  };
}
