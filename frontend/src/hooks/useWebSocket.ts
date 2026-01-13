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
      onConnect: () => {
        setIsConnected(true);
        
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
        client.subscribe('/user/queue/boss-state', (message) => {
          const data: BossRaidMessage = JSON.parse(message.body);
          if (data.type === 'STATE_SYNC') {
            if (data.fullState) {
              // 보스별 채널 상태 설정 (status, memo 포함)
              const fullState = data.fullState as { [bossType: string]: { [channelId: string]: ChannelState } };
              // 깊은 복사하여 상태 설정
              const normalizedState: { [bossType: string]: { [channelId: string]: ChannelState } } = {};
              Object.entries(fullState).forEach(([bossType, channels]) => {
                normalizedState[bossType] = {};
                      Object.entries(channels).forEach(([channelId, state]) => {
                        normalizedState[bossType][channelId] = {
                          status: state?.status || undefined,
                          memo: state?.memo || undefined,
                          dragonColors: state?.dragonColors || undefined,
                        };
                      });
              });
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

  // 보스별 채널 상태 구독
  useEffect(() => {
    if (!stompClient || !isConnected || !selectedBossType) return;

        const subscription = stompClient.subscribe(
      `/topic/boss-raid/channel-state/${selectedBossType}`,
      (message) => {
        const data: BossRaidMessage = JSON.parse(message.body);
        if (data.type === 'STATE_CHANGE' && data.channelId) {
          setChannelStates(prev => {
            const newStates = { ...prev };
            if (!newStates[selectedBossType]) {
              newStates[selectedBossType] = {};
            }
            const prevState = prev[selectedBossType]?.[data.channelId!] || {};
            const newState = {
              status: data.status !== undefined ? data.status : prevState.status,
              memo: data.memo !== undefined ? data.memo : prevState.memo,
              dragonColors: prevState.dragonColors || {},
            };
            
            // 용 색상 업데이트
            if (data.dragonType && data.color) {
              newState.dragonColors = {
                ...newState.dragonColors,
                [data.dragonType]: data.color,
              };
            }
            
            newStates[selectedBossType][data.channelId!] = newState;
            return newStates;
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [stompClient, isConnected, selectedBossType]);

  return {
    isConnected,
    stompClient,
    bossChannels,
    channelStates,
    setBossChannels,
    setChannelStates,
  };
}
