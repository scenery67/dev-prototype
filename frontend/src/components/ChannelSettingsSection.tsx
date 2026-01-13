import { useState } from 'react';
import ChannelAddInput from './ChannelAddInput';
import ChannelSelectionControls from './ChannelSelectionControls';
import HydraSpawnSettings from './HydraSpawnSettings';

interface ChannelSettingsSectionProps {
  newChannelId: string;
  onChannelIdChange: (value: string) => void;
  onCreateChannel: () => void;
  onOpenImageModal: () => void;
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectionMode: () => void;
  onToggleSelectAll: () => void;
  onDeleteSelected: () => void;
  selectedBossType: string;
  stompClient: any;
}

export default function ChannelSettingsSection({
  newChannelId,
  onChannelIdChange,
  onCreateChannel,
  onOpenImageModal,
  isSelectionMode,
  selectedCount,
  totalCount,
  onToggleSelectionMode,
  onToggleSelectAll,
  onDeleteSelected,
  selectedBossType,
  stompClient,
}: ChannelSettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasNoChannels = totalCount === 0;
  const shouldBlinkSection = hasNoChannels && !isExpanded;
  const shouldBlinkAddArea = hasNoChannels && isExpanded;

  return (
    <div className={`channel-settings-section ${shouldBlinkSection ? 'blink-border' : ''}`}>
      <div className="channel-settings-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>채널 설정</h3>
        <span className="channel-settings-toggle">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="channel-settings-content">
          {/* 왼쪽: 채널 추가 영역 */}
          <div className={`channel-add-area ${shouldBlinkAddArea ? 'blink-border' : ''}`}>
            <h4>채널 추가</h4>
            <ChannelAddInput
              newChannelId={newChannelId}
              onChannelIdChange={onChannelIdChange}
              onCreateChannel={onCreateChannel}
              onOpenImageModal={onOpenImageModal}
            />
          </div>

          {/* 오른쪽: 채널 삭제 영역 */}
          <div className="channel-delete-area">
            <h4>채널 삭제</h4>
            <ChannelSelectionControls
              isSelectionMode={isSelectionMode}
              selectedCount={selectedCount}
              totalCount={totalCount}
              onToggleSelectionMode={onToggleSelectionMode}
              onToggleSelectAll={onToggleSelectAll}
              onDeleteSelected={onDeleteSelected}
            />
          </div>
        </div>
      )}

      {/* 수화룡 젠 시간 설정 (수화룡 레이드일 때만) */}
      {selectedBossType === '수화룡' && (
        <div className="hydra-spawn-settings-section">
          <HydraSpawnSettings
            onSpawnSettingsUpdate={(hydraType, spawnMinutes) => {
              // 설정 업데이트 처리
            }}
            stompClient={stompClient}
          />
        </div>
      )}
    </div>
  );
}
