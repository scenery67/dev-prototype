import { useState, useEffect } from 'react';
import { ChannelState } from '../types';

interface HydraImminentSpawnProps {
  channels: string[];
  channelStates: Record<string, ChannelState>; // selectedBossType에 해당하는 채널 상태들
  selectedBossType: string;
}

interface ImminentSpawn {
  channelId: string;
  hydraType: '수룡' | '화룡';
  remainingSeconds: number;
}

export default function HydraImminentSpawn({
  channels,
  channelStates,
  selectedBossType,
}: HydraImminentSpawnProps) {
  const [spawns, setSpawns] = useState<ImminentSpawn[]>([]);

  useEffect(() => {
    if (selectedBossType !== '수화룡') {
      setSpawns([]);
      return;
    }

    const updateSpawns = () => {
      const now = Date.now();
      const newSpawns: ImminentSpawn[] = [];

      channels.forEach((channelId) => {
        const channelState = channelStates[channelId];
        if (!channelState?.hydraStates) return;

        (['수룡', '화룡'] as const).forEach((hydraType) => {
          const hydraState = channelState.hydraStates?.[hydraType];
          if (!hydraState?.spawnTime) return;

          const diff = hydraState.spawnTime - now;
          const remainingSeconds = Math.floor(diff / 1000);

          // 5분 전(-300초)부터 10분 후(600초)까지 표시
          if (remainingSeconds >= -600 && remainingSeconds <= 300) {
            newSpawns.push({
              channelId,
              hydraType,
              remainingSeconds,
            });
          }
        });
      });

      // 남은 시간 순으로 정렬 (가까운 순)
      newSpawns.sort((a, b) => a.remainingSeconds - b.remainingSeconds);
      setSpawns(newSpawns);
    };

    updateSpawns();
    const interval = setInterval(updateSpawns, 1000);

    return () => clearInterval(interval);
  }, [channels, channelStates, selectedBossType]);

  if (selectedBossType !== '수화룡' || spawns.length === 0) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 0) {
      const absSeconds = Math.abs(seconds);
      const minutes = Math.floor(absSeconds / 60);
      const secs = absSeconds % 60;
      return `+${minutes}분 ${secs}초`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}분 ${secs}초`;
  };

  return (
    <div className="hydra-imminent-spawn-section">
      <h3>젠 임박 채널</h3>
      <div className="hydra-imminent-spawn-grid">
        {spawns.map((spawn, index) => (
          <div 
            key={`${spawn.channelId}-${spawn.hydraType}-${index}`} 
            className={`hydra-imminent-spawn-card ${spawn.remainingSeconds < 0 ? 'spawned' : ''} ${spawn.remainingSeconds <= 300 && spawn.remainingSeconds >= -600 ? 'imminent' : ''}`}
          >
            <div className="imminent-card-header">
              <span className="imminent-channel">{spawn.channelId}</span>
              <span className={`imminent-hydra-type ${spawn.hydraType === '수룡' ? 'water' : 'fire'}`}>
                {spawn.hydraType}
              </span>
            </div>
            <div className={`imminent-time ${spawn.remainingSeconds < 0 ? 'past' : spawn.remainingSeconds <= 300 ? 'upcoming' : ''}`}>
              {formatTime(spawn.remainingSeconds)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
