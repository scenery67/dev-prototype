import { useState, useEffect } from 'react';
import { ChannelState } from '../types';

interface HydraSpawnAlertProps {
  channels: string[];
  channelStates: Record<string, ChannelState>;
  selectedBossType: string;
}

interface SpawnAlert {
  channelId: string;
  hydraType: '수룡' | '화룡';
  remainingSeconds: number;
}

export default function HydraSpawnAlert({
  channels,
  channelStates,
  selectedBossType,
}: HydraSpawnAlertProps) {
  const [alerts, setAlerts] = useState<SpawnAlert[]>([]);

  useEffect(() => {
    if (selectedBossType !== '수화룡') {
      setAlerts([]);
      return;
    }

    const updateAlerts = () => {
      const now = Date.now();
      const newAlerts: SpawnAlert[] = [];

      channels.forEach((channelId) => {
        const channelState = channelStates[channelId];
        if (!channelState?.hydraStates) return;

        (['수룡', '화룡'] as const).forEach((hydraType) => {
          const hydraState = channelState.hydraStates[hydraType];
          if (!hydraState?.spawnTime) return;

          const diff = hydraState.spawnTime - now;
          const remainingSeconds = Math.floor(diff / 1000);

          // 5분 전(-300초)부터 10분 후(600초)까지 표시
          if (remainingSeconds >= -600 && remainingSeconds <= 300) {
            newAlerts.push({
              channelId,
              hydraType,
              remainingSeconds,
            });
          }
        });
      });

      // 남은 시간 순으로 정렬 (가까운 순)
      newAlerts.sort((a, b) => a.remainingSeconds - b.remainingSeconds);
      setAlerts(newAlerts);
    };

    updateAlerts();
    const interval = setInterval(updateAlerts, 1000);

    return () => clearInterval(interval);
  }, [channels, channelStates, selectedBossType]);

  if (selectedBossType !== '수화룡' || alerts.length === 0) {
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
    <div className="hydra-spawn-alert-section">
      <h3>젠 예상</h3>
      <div className="hydra-spawn-alert-list">
        {alerts.map((alert, index) => (
          <div key={`${alert.channelId}-${alert.hydraType}-${index}`} className="hydra-spawn-alert-item">
            <span className="alert-channel">채널 {alert.channelId}</span>
            <span className="alert-hydra-type">{alert.hydraType}</span>
            <span className={`alert-time ${alert.remainingSeconds < 0 ? 'alert-past' : 'alert-upcoming'}`}>
              {formatTime(alert.remainingSeconds)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
