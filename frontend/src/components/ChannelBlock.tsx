import { useRef, useEffect, useState } from 'react';
import { ChannelState, StatusColor } from '../types';
import { STATUS_COLORS, DRAGON_TYPES } from '../constants/boss';
import HydraSection from './HydraSection';

interface ChannelBlockProps {
  channelId: string;
  channelState: ChannelState;
  statusColor: string;
  isEditing: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  selectedBossType: string;
  memoInput: string;
  onMemoInputChange: (value: string) => void;
  onStartMemoEdit: () => void;
  onSaveMemo: () => void;
  onCancelMemoEdit: () => void;
  onStatusChange: (status: string) => void;
  onDragonColorChange?: (dragonType: string, color: string) => void;
  onHydraTimeUpdate?: (hydraType: string, caughtTime: string, spawnTime: number) => void;
  hydraSpawnSettings?: { 수룡: number; 화룡: number };
  onToggleSelection: () => void;
}

export default function ChannelBlock({
  channelId,
  channelState,
  statusColor,
  isEditing,
  isSelected,
  isSelectionMode,
  selectedBossType,
  memoInput,
  onMemoInputChange,
  onStartMemoEdit,
  onSaveMemo,
  onCancelMemoEdit,
  onStatusChange,
  onDragonColorChange,
  onHydraTimeUpdate,
  hydraSpawnSettings,
  onToggleSelection,
}: ChannelBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedDragonType, setSelectedDragonType] = useState<string | null>(null);
  const hasStatus = channelState.status !== undefined && channelState.status !== null;
  const isDragonBoss = selectedBossType === '용';
  const isHydraBoss = selectedBossType === '수화룡';
  
  // 메모 편집 모드로 전환될 때 자동으로 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // 텍스트 끝으로 커서 이동
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);
  
  // 용 레이드일 때는 채널 테두리 색상 변경 안 함
  let borderColor = '#e0e0e0';
  if (!isDragonBoss) {
    // 해골왕/수화룡일 때만 테두리 색상 적용
    borderColor = statusColor !== '#ffffff' ? statusColor : '#e0e0e0';
    if (channelState.status === 'yellow') {
      borderColor = '#fdd835'; // 밝은 노란색 테두리
    }
  }

  const handleBlockClick = (e: React.MouseEvent) => {
    // 메모 영역이나 상태 버튼 클릭은 무시
    const target = e.target as HTMLElement;
    if (target.closest('.channel-memo-display') || 
        target.closest('.channel-memo-edit') ||
        target.closest('.channel-status-buttons') ||
        target.closest('.channel-dragon-buttons')) {
      return;
    }
    
    if (isSelectionMode) {
      onToggleSelection();
    }
  };

  const handleDragonTypeClick = (dragonType: string) => {
    if (isSelectionMode) return;
    setSelectedDragonType(dragonType);
  };

  const handleColorClick = (colorName: string) => {
    if (isSelectionMode) return;
    
    if (isDragonBoss && selectedDragonType && onDragonColorChange) {
      // 용 레이드: 선택된 용 타입에 색상 적용
      // 회색 버튼 클릭 시 색상 초기화
      if (colorName === 'gray') {
        onDragonColorChange(selectedDragonType, '');
      } else {
        onDragonColorChange(selectedDragonType, colorName);
      }
    } else {
      // 해골왕/수화룡: 일반 상태 변경
      // 회색 버튼 클릭 시 상태 초기화
      if (colorName === 'gray') {
        onStatusChange('');
      } else {
        onStatusChange(colorName);
      }
    }
  };

  // 용 레이드일 때 각 용 타입의 색상 가져오기
  const getDragonColor = (dragonType: string): string | undefined => {
    return channelState.dragonColors?.[dragonType];
  };

  return (
    <div
      className={`channel-block ${hasStatus ? 'has-status' : ''} ${channelState.status === 'yellow' ? 'yellow-status' : ''} ${isSelected ? 'selected' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
      style={{
        borderColor: isSelected ? '#667eea' : borderColor,
        borderWidth: isSelected ? '3px' : (hasStatus ? '3px' : '2px'),
        cursor: isSelectionMode ? 'pointer' : 'default',
      }}
      onClick={handleBlockClick}
    >
      {isSelectionMode && (
        <div className="channel-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="channel-number">
        채널 {channelId}
      </div>
      
      {/* 메모 및 상태 버튼 (수화룡이 아닐 때만) */}
      {!isHydraBoss && (
        <>
          {/* 메모 입력 */}
          {isEditing ? (
            <div className="channel-memo-edit">
              <textarea
                ref={textareaRef}
                value={memoInput}
                onChange={(e) => onMemoInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSaveMemo();
                  }
                  // Shift+Enter는 기본 동작(줄바꿈) 유지
                }}
                className="channel-memo-textarea"
                placeholder="메모(Enter: 저장, Shift+Enter: 줄바꿈)"
              />
              <div className="channel-memo-buttons">
                <button onClick={onSaveMemo} className="btn-save-small">저장</button>
                <button onClick={onCancelMemoEdit} className="btn-cancel-small">취소</button>
              </div>
            </div>
          ) : (
            <div
              className={`channel-memo-display ${isSelectionMode ? 'disabled' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelectionMode) {
                  onStartMemoEdit();
                }
              }}
            >
              {channelState.memo ? (
                <span style={{ whiteSpace: 'pre-wrap' }}>{channelState.memo}</span>
              ) : (
                '메모(Enter: 저장, Shift+Enter: 줄바꿈)'
              )}
            </div>
          )}

          {/* 용 타입 버튼들 (용 레이드일 때만) */}
          {isDragonBoss && (
            <div className="channel-dragon-buttons">
              {DRAGON_TYPES.map((dragonType: string) => {
                const dragonColor = getDragonColor(dragonType);
                const isSelected = selectedDragonType === dragonType;
                const colorObj = dragonColor ? STATUS_COLORS.find(c => c.name === dragonColor) : null;
                
                return (
                  <button
                    key={dragonType}
                    className={`dragon-type-btn ${isSelected ? 'selected' : ''}`}
                    style={{
                      backgroundColor: colorObj?.value || '#f5f5f5',
                      borderColor: isSelected ? '#333' : 'rgba(0, 0, 0, 0.2)',
                      borderWidth: isSelected ? '2px' : '1px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDragonTypeClick(dragonType);
                    }}
                    title={dragonType}
                  >
                    {dragonType}
                  </button>
                );
              })}
            </div>
          )}

          {/* 상태 버튼들 */}
          <div className="channel-status-buttons">
            {STATUS_COLORS.map((color: StatusColor) => {
              // 용 레이드일 때는 선택된 용 타입의 색상과 비교
              let isActive = false;
              if (isDragonBoss && selectedDragonType) {
                const dragonColor = getDragonColor(selectedDragonType);
                isActive = dragonColor === color.name;
              } else {
                isActive = channelState.status === color.name;
              }
              
              return (
                <button
                  key={color.name}
                  className={`status-btn status-btn-${color.name} ${isActive ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: color.value,
                    borderColor: isActive ? '#333' : 'rgba(0, 0, 0, 0.2)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorClick(color.name);
                  }}
                  title={color.label}
                >
                  {isActive && (
                    <svg 
                      width="14" 
                      height="14" 
                      viewBox="0 0 16 16" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="check-icon"
                    >
                      <path 
                        d="M13.5 4L6 11.5L2.5 8" 
                        stroke="#fff" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 수화룡 섹션 (수화룡 레이드일 때만) */}
      {isHydraBoss && (
        <div className="hydra-sections">
          <HydraSection
            hydraType="수룡"
            hydraState={channelState.hydraStates?.['수룡']}
            spawnMinutes={hydraSpawnSettings?.수룡 ?? 35}
            onTimeUpdate={(hydraType: string, caughtTime: string, spawnTime: number) => {
              if (onHydraTimeUpdate) {
                onHydraTimeUpdate(hydraType, caughtTime, spawnTime);
              }
            }}
            isSelectionMode={isSelectionMode}
          />
          <HydraSection
            hydraType="화룡"
            hydraState={channelState.hydraStates?.['화룡']}
            spawnMinutes={hydraSpawnSettings?.화룡 ?? 37}
            onTimeUpdate={(hydraType: string, caughtTime: string, spawnTime: number) => {
              if (onHydraTimeUpdate) {
                onHydraTimeUpdate(hydraType, caughtTime, spawnTime);
              }
            }}
            isSelectionMode={isSelectionMode}
          />
        </div>
      )}
    </div>
  );
}
