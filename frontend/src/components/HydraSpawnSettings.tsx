import { useState } from 'react';

interface HydraSpawnSettingsProps {
  onSpawnSettingsUpdate: (hydraType: string, spawnMinutes: number) => void;
  stompClient: any;
}

export default function HydraSpawnSettings({
  onSpawnSettingsUpdate,
  stompClient,
}: HydraSpawnSettingsProps) {
  const [suSpawnMinutes, setSuSpawnMinutes] = useState(35);
  const [hwaSpawnMinutes, setHwaSpawnMinutes] = useState(37);

  const handleSave = (hydraType: string, minutes: number) => {
    if (!stompClient) return;
    
    // 모든 채널에 대해 설정 업데이트
    // TODO: 특정 채널에만 적용하도록 수정 필요
    stompClient.publish({
      destination: '/app/boss/hydra.spawn-settings',
      body: JSON.stringify({
        channelId: 'all', // 모든 채널에 적용 (임시)
        hydraType,
        spawnMinutes: minutes,
        type: 'HYDRA_SPAWN_SETTINGS',
      }),
    });
    
    onSpawnSettingsUpdate(hydraType, minutes);
  };

  return (
    <div className="hydra-spawn-settings">
      <h4>수화룡 젠 시간 설정</h4>
      <div className="hydra-spawn-settings-content">
        <div className="hydra-spawn-setting-item">
          <label>수룡:</label>
          <input
            type="number"
            min="1"
            max="120"
            value={suSpawnMinutes}
            onChange={(e) => setSuSpawnMinutes(parseInt(e.target.value, 10) || 35)}
            className="hydra-spawn-input"
          />
          <span>분</span>
          <button
            onClick={() => handleSave('수룡', suSpawnMinutes)}
            className="btn-save-small"
          >
            저장
          </button>
        </div>
        <div className="hydra-spawn-setting-item">
          <label>화룡:</label>
          <input
            type="number"
            min="1"
            max="120"
            value={hwaSpawnMinutes}
            onChange={(e) => setHwaSpawnMinutes(parseInt(e.target.value, 10) || 37)}
            className="hydra-spawn-input"
          />
          <span>분</span>
          <button
            onClick={() => handleSave('화룡', hwaSpawnMinutes)}
            className="btn-save-small"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
