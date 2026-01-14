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
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const [shouldShowRed, setShouldShowRed] = useState(false);
  const [shouldBlink, setShouldBlink] = useState(false);

  const spawnMinutes = hydraState?.spawnMinutes ?? defaultSpawnMinutes;

  // 카운트다운 타이머 및 하이라이트 체크
  useEffect(() => {
    if (!hydraState?.spawnTime) {
      setRemainingTime('');
      setShouldHighlight(false);
      setShouldShowRed(false);
      setShouldBlink(false);
      return;
    }

    const updateRemainingTime = () => {
      const now = Date.now();
      const spawnTime = hydraState.spawnTime!;
      const diff = spawnTime - now;
      const diffSeconds = Math.floor(diff / 1000);

      // 5분 전(-300초)부터 10분 후(600초)까지 하이라이트
      setShouldHighlight(diffSeconds >= -600 && diffSeconds <= 300);

      // 5분 전부터 빨간색 표시
      setShouldShowRed(diffSeconds <= 300);

      // 젠 됨 이후 10분까지 점멸
      setShouldBlink(diffSeconds < 0 && diffSeconds >= -600);

      if (diff <= 0) {
        // 젠된 후 경과 시간 표시
        const absDiff = Math.abs(diff);
        const minutes = Math.floor(absDiff / 60000);
        const seconds = Math.floor((absDiff % 60000) / 1000);
        setRemainingTime(`젠됨 (+${minutes}분 ${seconds}초)`);
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
    // 로컬 시간으로 정확하게 설정 (입력한 시간을 그대로 사용)
    const caughtDateTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );

    // 잡힌 시간을 ISO 문자열로 저장 (handleCaught와 동일한 방식)
    const caughtTime = caughtDateTime.toISOString();
    
    // 젠 예정 시간 계산 (handleCaught와 동일한 방식: timestamp에 분을 더함)
    const caughtTimeStamp = caughtDateTime.getTime();
    const spawnTime = caughtTimeStamp + spawnMinutes * 60 * 1000;

    onTimeUpdate(hydraType, caughtTime, spawnTime);

    setTimeInput('');
  };

  const handleReset = () => {
    if (isSelectionMode) return;
    // 빈 값으로 업데이트하여 리셋
    onTimeUpdate(hydraType, '', 0);
  };

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeWithColon = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={`hydra-section ${shouldHighlight || shouldBlink ? 'hydra-section-alert' : ''} ${shouldBlink ? 'hydra-section-blink' : ''} hydra-section-${hydraType === '수룡' ? 'water' : 'fire'}`}>
      <div className="hydra-section-header">
        <div className="hydra-section-header-left">
          <h4>{hydraType}</h4>
          {hydraState?.spawnMinutes && (
            <span className="hydra-spawn-minutes">({hydraState.spawnMinutes}분)</span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="btn-hydra-reset"
          disabled={isSelectionMode || !hydraState?.spawnTime}
          title="시간 데이터 초기화"
        >
          초기화
        </button>
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
            placeholder="시분 입력 (예: 1210)"
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

        <div className="hydra-time-info">
          <div className="hydra-time-row">
            <span className="hydra-time-label">잡힌 시간:</span>
            <span className="hydra-time-value">
              {hydraState?.caughtTime ? formatDateTime(hydraState.caughtTime) : '-'}
            </span>
          </div>
          <div className="hydra-time-row">
            <span className="hydra-time-label">젠 예정:</span>
            <span className="hydra-time-value">
              {hydraState?.spawnTime ? formatTimeWithColon(hydraState.spawnTime) : '-'}
            </span>
          </div>
          <div className="hydra-time-row">
            <span className="hydra-time-label">남은 시간:</span>
            <span className={`hydra-time-value ${shouldShowRed ? 'spawned' : ''} ${shouldBlink ? 'spawned-blink' : ''}`}>
              {remainingTime || '-'}
            </span>
          </div>
        </div>
      </>
    </div>
  );
}
