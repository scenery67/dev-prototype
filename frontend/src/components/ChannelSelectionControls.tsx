interface ChannelSelectionControlsProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectionMode: () => void;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
}

export default function ChannelSelectionControls({
  isSelectionMode,
  selectedCount,
  totalCount,
  onToggleSelectionMode,
  onToggleSelectAll,
  onDeleteSelected,
}: ChannelSelectionControlsProps) {
  if (isSelectionMode) {
    return (
      <div className="channel-selection-controls">
        <div className="selection-info">
          <div className="selection-left">
            <span className="selected-count">{selectedCount}개 선택됨</span>
            <button onClick={onToggleSelectAll} className="btn-select-all">
              {selectedCount === totalCount ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <div className="selection-right">
            <button 
              onClick={onDeleteSelected} 
              className="btn-delete-selected" 
              disabled={selectedCount === 0}
            >
              선택 삭제
            </button>
            <button onClick={onToggleSelectionMode} className="btn-cancel-selection">
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="channel-action-buttons">
      <button onClick={onToggleSelectionMode} className="btn-selection-mode">
        채널 선택 모드
      </button>
    </div>
  );
}
