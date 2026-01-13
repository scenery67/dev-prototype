import { useRef, useEffect } from 'react';
import { ChannelState, StatusColor } from '../types';
import { STATUS_COLORS } from '../constants/boss';

interface ChannelBlockProps {
  channelId: string;
  channelState: ChannelState;
  statusColor: string;
  isEditing: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  memoInput: string;
  onMemoInputChange: (value: string) => void;
  onStartMemoEdit: () => void;
  onSaveMemo: () => void;
  onCancelMemoEdit: () => void;
  onStatusChange: (status: string) => void;
  onToggleSelection: () => void;
}

export default function ChannelBlock({
  channelId,
  channelState,
  statusColor,
  isEditing,
  isSelected,
  isSelectionMode,
  memoInput,
  onMemoInputChange,
  onStartMemoEdit,
  onSaveMemo,
  onCancelMemoEdit,
  onStatusChange,
  onToggleSelection,
}: ChannelBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasStatus = channelState.status !== undefined && channelState.status !== null;
  
  // 메모 편집 모드로 전환될 때 자동으로 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // 텍스트 끝으로 커서 이동
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);
  
  // 노란색일 때 테두리 색상 조정
  let borderColor = statusColor !== '#ffffff' ? statusColor : '#e0e0e0';
  if (channelState.status === 'yellow') {
    borderColor = '#fdd835'; // 밝은 노란색 테두리
  }

  const handleBlockClick = (e: React.MouseEvent) => {
    // 메모 영역이나 상태 버튼 클릭은 무시
    const target = e.target as HTMLElement;
    if (target.closest('.channel-memo-display') || 
        target.closest('.channel-memo-edit') ||
        target.closest('.channel-status-buttons')) {
      return;
    }
    
    if (isSelectionMode) {
      onToggleSelection();
    }
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
      
      {/* 상태 버튼들 */}
      <div className="channel-status-buttons">
        {STATUS_COLORS.map((color: StatusColor) => {
          const isActive = channelState.status === color.name;
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
                if (!isSelectionMode) {
                  onStatusChange(color.name);
                }
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
    </div>
  );
}
