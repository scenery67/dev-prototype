import { useState, useEffect, useRef } from 'react';
import { HydraState } from '../types';

interface HydraSectionProps {
  hydraType: '수룡' | '화룡';
  hydraState: HydraState | undefined;
  spawnMinutes: number; // 기본 젠 시간
  onTimeUpdate: (hydraType: string, caughtTime: string, spawnTime: number) => void;
  isSelectionMode: boolean;
}

export default function HydraSection({
  hydraType,
  hydraState,
  spawnMinutes: defaultSpawnMinutes,
  onTimeUpdate,
  isSelectionMode,
}: HydraSectionProps) {
  const [timeInput, setTimeInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');

  const spawnMinutes = hydraState?.spawnMinutes ?? defaultSpawnMinutes;

  // 카운트다운 타이머
  useEffect(() => {
    if (!hydraState?.spawnTime) {
      setRemainingTime('');
      return;
    }

    const updateRemainingTime = () => {
      const now = Date.now();
      const spawnTime = hydraState.spawnTime!;
      const diff = spawnTime - now;

      if (diff <= 0) {
        setRemainingTime('젠됨');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${minutes}분 ${seconds}초`);
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [hydraState?.spawnTime]);

  // input에 포커스 주기 (컴포넌트 마운트 시)
  useEffect(() => {
    if (inputRef.current && !isSelectionMode) {
      inputRef.current.focus();
    }
  }, [isSelectionMode]);

  const handleCaught = () => {
    if (isSelectionMode) return;
    const now = new Date();
    const caughtTime = now.toISOString();
    const spawnTime = now.getTime() + spawnMinutes * 60 * 1000;
    onTimeUpdate(hydraType, caughtTime, spawnTime);
  };

  const handle5MinBefore = () => {
    if (isSelectionMode) return;
    const now = new Date();
    const caughtTime = now.toISOString();
    const spawnTime = now.getTime() + (spawnMinutes - 5) * 60 * 1000;
    onTimeUpdate(hydraType, caughtTime, spawnTime);
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
    if (value.length <= 4) {
      setTimeInput(value);
    }
  };

  const handleSaveTime = () => {
    if (isSelectionMode || !timeInput || timeInput.length !== 4) return;

    const hours = parseInt(timeInput.substring(0, 2), 10);
    const minutes = parseInt(timeInput.substring(2, 4), 10);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      alert('올바른 시간을 입력해주세요. (예: 2205)');
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const caughtDateTime = new Date(today);
    caughtDateTime.setHours(hours, minutes, 0, 0);

    // 입력한 시간이 현재 시간보다 이전이면 내일로 설정
    if (caughtDateTime <= now) {
      caughtDateTime.setDate(caughtDateTime.getDate() + 1);
    }

    // 잡힌 시간을 ISO 문자열로 저장
    const caughtTime = caughtDateTime.toISOString();
    
    // 젠 예정 시간 계산 (잡힌 시간 + 젠 시간(분))
    const spawnDateTime = new Date(caughtDateTime);
    spawnDateTime.setMinutes(spawnDateTime.getMinutes() + spawnMinutes);
    const spawnTime = spawnDateTime.getTime();

    onTimeUpdate(hydraType, caughtTime, spawnTime);

    setTimeInput('');
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}${minutes}`;
  };

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="hydra-section">
      <div className="hydra-section-header">
        <h4>{hydraType}</h4>
        {hydraState?.spawnMinutes && (
          <span className="hydra-spawn-minutes">({hydraState.spawnMinutes}분)</span>
        )}
      </div>

      <>
        {/* 첫 줄: 잡힘, 5분전 버튼 */}
        <div className="hydra-buttons">
          <button
            className="btn-hydra-caught"
            onClick={handleCaught}
            disabled={isSelectionMode}
          >
            잡힘
          </button>
          <button
            className="btn-hydra-5min"
            onClick={handle5MinBefore}
            disabled={isSelectionMode}
          >
            5분전
          </button>
        </div>

        {/* 두 번째 줄: 시간 입력창과 저장 버튼 */}
        <div className="hydra-time-input-row">
          <input
            ref={inputRef}
            type="text"
            value={timeInput}
            onChange={handleTimeInputChange}
            placeholder="2205"
            maxLength={4}
            className="hydra-time-input"
            disabled={isSelectionMode}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveTime();
              }
            }}
          />
          <button
            onClick={handleSaveTime}
            className="btn-save-small"
            disabled={isSelectionMode || !timeInput || timeInput.length !== 4}
          >
            저장
          </button>
        </div>

        {hydraState?.caughtTime && hydraState?.spawnTime && (
          <div className="hydra-time-info">
            <div className="hydra-time-row">
              <span className="hydra-time-label">잡힌 시간:</span>
              <span className="hydra-time-value">{formatDateTime(hydraState.caughtTime)}</span>
            </div>
            <div className="hydra-time-row">
              <span className="hydra-time-label">젠 예정:</span>
              <span className="hydra-time-value">{formatTime(hydraState.spawnTime)}</span>
            </div>
            {remainingTime && (
              <div className="hydra-time-row">
                <span className="hydra-time-label">남은 시간:</span>
                <span className={`hydra-time-value ${remainingTime === '젠됨' ? 'spawned' : ''}`}>
                  {remainingTime}
                </span>
              </div>
            )}
          </div>
        )}
      </>
    </div>
  );
}
