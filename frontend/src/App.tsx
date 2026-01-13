import { useState } from 'react';
import { ChannelState } from './types';
import { STATUS_COLORS } from './constants/boss';
import { useWebSocket } from './hooks/useWebSocket';
import BossTabs from './components/BossTabs';
import StatusLegend from './components/StatusLegend';
import ChannelSettingsSection from './components/ChannelSettingsSection';
import ChannelBlock from './components/ChannelBlock';
import ImageAddModal from './components/ImageAddModal';
import './App.css';

function App() {
  // 보스 탭
  const [selectedBossType, setSelectedBossType] = useState<string>('용');
  
  // WebSocket 연결 및 상태 관리
  const {
    isConnected,
    stompClient,
    bossChannels,
    channelStates,
  } = useWebSocket(selectedBossType);
  
  // 채널 추가
  const [newChannelId, setNewChannelId] = useState('');
  
  // 메모 편집 상태
  const [editingMemo, setEditingMemo] = useState<{
    channelId: string;
  } | null>(null);
  const [memoInput, setMemoInput] = useState('');
  
  // 채널 선택 상태
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // 이미지 추가 모달 상태
  const [showImageModal, setShowImageModal] = useState(false);

  const createChannel = () => {
    if (!stompClient || !newChannelId.trim()) {
      alert('채널 ID를 입력해주세요.');
      return;
    }
    
    const channelId = newChannelId.trim();
    
    stompClient.publish({
      destination: '/app/boss/channel.create',
      body: JSON.stringify({
        channelId,
        type: 'CHANNEL_CREATE',
      }),
    });
    
    setNewChannelId('');
  };

  const handleChannelStatus = (channelId: string, status: string) => {
    if (!stompClient || !selectedBossType || isSelectionMode) return;
    
    stompClient.publish({
      destination: `/app/boss/channel.status`,
      body: JSON.stringify({
        bossType: selectedBossType,
        channelId,
        status,
        type: 'CHANNEL_STATUS',
      }),
    });
  };

  const handleDragonColor = (channelId: string, dragonType: string, color: string): void => {
    if (!stompClient || !selectedBossType || isSelectionMode) return;
    
    stompClient.publish({
      destination: `/app/boss/dragon.color`,
      body: JSON.stringify({
        bossType: selectedBossType,
        channelId,
        dragonType,
        color,
        type: 'BOSS_COLOR',
      }),
    });
  };

  const handleHydraTimeUpdate = (channelId: string, hydraType: string, caughtTime: string, spawnTime: number): void => {
    if (!stompClient || !selectedBossType || isSelectionMode) return;
    
    stompClient.publish({
      destination: `/app/boss/hydra.time`,
      body: JSON.stringify({
        bossType: selectedBossType,
        channelId,
        hydraType,
        caughtTime,
        spawnTime,
        type: 'HYDRA_TIME',
      }),
    });
  };

  // 수화룡 젠 시간 설정 (채널별로 관리, 기본값: 수룡 35분, 화룡 37분)
  const getHydraSpawnSettings = (channelId: string): { 수룡: number; 화룡: number } => {
    // TODO: 서버에서 설정을 가져오도록 수정 필요
    // 현재는 기본값 반환
    return {
      수룡: 35,
      화룡: 37,
    };
  };

  const startMemoEdit = (channelId: string) => {
    if (isSelectionMode) return;
    const currentMemo = channelStates[selectedBossType]?.[channelId]?.memo || '';
    setEditingMemo({ channelId });
    setMemoInput(currentMemo);
  };

  const saveMemo = () => {
    if (!stompClient || !editingMemo || !selectedBossType) return;
    
    stompClient.publish({
      destination: `/app/boss/channel.memo`,
      body: JSON.stringify({
        bossType: selectedBossType,
        channelId: editingMemo.channelId,
        memo: memoInput,
        type: 'CHANNEL_MEMO',
      }),
    });
    
    setEditingMemo(null);
    setMemoInput('');
  };

  const cancelMemoEdit = () => {
    setEditingMemo(null);
    setMemoInput('');
  };

  // 채널 선택/해제
  const toggleChannelSelection = (channelId: string) => {
    if (!isSelectionMode) return;
    
    setSelectedChannels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  };

  // 선택 모드 토글
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedChannels(new Set());
    }
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    const allChannels = getCurrentBossChannels();
    if (selectedChannels.size === allChannels.length) {
      setSelectedChannels(new Set());
    } else {
      setSelectedChannels(new Set(allChannels));
    }
  };

  // 선택된 채널들 삭제
  const deleteSelectedChannels = () => {
    if (!stompClient || selectedChannels.size === 0) return;
    if (!confirm(`선택한 ${selectedChannels.size}개의 채널을 삭제하시겠습니까?`)) return;
    
    selectedChannels.forEach(channelId => {
      stompClient.publish({
        destination: '/app/boss/channel.delete',
        body: JSON.stringify({
          channelId,
          type: 'CHANNEL_DELETE',
        }),
      });
    });
    
    setSelectedChannels(new Set());
    setIsSelectionMode(false);
  };

  const getChannelState = (channelId: string): ChannelState => {
    return channelStates[selectedBossType]?.[channelId] || {};
  };

  const getChannelStatusColor = (channelId: string): string => {
    const state = getChannelState(channelId);
    if (state.status) {
      const colorObj = STATUS_COLORS.find(c => c.name === state.status);
      return colorObj?.value || '#ffffff';
    }
    return '#ffffff';
  };

  const getCurrentBossChannels = (): string[] => {
    const firstBossType = Object.keys(bossChannels)[0];
    const channels = firstBossType ? (bossChannels[firstBossType] || []) : [];
    // 채널명(숫자) 순서로 정렬
    return [...channels].sort((a, b) => {
      const numA = parseInt(a, 10) || 0;
      const numB = parseInt(b, 10) || 0;
      return numA - numB;
    });
  };

  const handleAddChannels = (channels: string[]) => {
    if (!stompClient || channels.length === 0) return;
    
    channels.forEach(channelId => {
      stompClient.publish({
        destination: '/app/boss/channel.create',
        body: JSON.stringify({
          channelId,
          type: 'CHANNEL_CREATE',
        }),
      });
    });
  };

  if (!isConnected) {
    return (
      <div className="app">
        <div className="loading-container">
          <h2>연결 중...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="boss-raid-container">
        {/* 헤더 */}
        <div className="boss-raid-header">
          <h1>{selectedBossType} 레이드</h1>
          <div className="connection-status">연결됨</div>
        </div>

        {/* 보스 탭 */}
        <BossTabs 
          selectedBossType={selectedBossType} 
          onBossTypeChange={setSelectedBossType} 
        />

        {/* 채널 설정 섹션 */}
        <ChannelSettingsSection
          newChannelId={newChannelId}
          onChannelIdChange={setNewChannelId}
          onCreateChannel={createChannel}
          onOpenImageModal={() => setShowImageModal(true)}
          isSelectionMode={isSelectionMode}
          selectedCount={selectedChannels.size}
          totalCount={getCurrentBossChannels().length}
          onToggleSelectionMode={toggleSelectionMode}
          onToggleSelectAll={toggleSelectAll}
          onDeleteSelected={deleteSelectedChannels}
          selectedBossType={selectedBossType}
          stompClient={stompClient}
        />

        {/* 채널 목록 섹션 */}
        <div className="channel-list-section">
          <div className="channel-list-header">
            <h2>채널 목록</h2>
            <div className="channel-list-header-right">
              <StatusLegend />
            </div>
          </div>

          {/* 채널 그리드 */}
          <div className="channel-grid">
            {getCurrentBossChannels().map((channelId) => {
              const channelState = getChannelState(channelId);
              const statusColor = getChannelStatusColor(channelId);
              const isEditing = editingMemo?.channelId === channelId;
              const isSelected = selectedChannels.has(channelId);
              
              return (
                <ChannelBlock
                  key={channelId}
                  channelId={channelId}
                  channelState={channelState}
                  statusColor={statusColor}
                  isEditing={isEditing}
                  isSelected={isSelected}
                  isSelectionMode={isSelectionMode}
                  selectedBossType={selectedBossType}
                  memoInput={memoInput}
                  onMemoInputChange={setMemoInput}
                  onStartMemoEdit={() => startMemoEdit(channelId)}
                  onSaveMemo={saveMemo}
                  onCancelMemoEdit={cancelMemoEdit}
                  onStatusChange={(status) => handleChannelStatus(channelId, status)}
                  onDragonColorChange={(dragonType: string, color: string) => handleDragonColor(channelId, dragonType, color)}
                  onHydraTimeUpdate={(hydraType: string, caughtTime: string, spawnTime: number) => handleHydraTimeUpdate(channelId, hydraType, caughtTime, spawnTime)}
                  hydraSpawnSettings={getHydraSpawnSettings(channelId)}
                  onToggleSelection={() => toggleChannelSelection(channelId)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 이미지 추가 모달 */}
      <ImageAddModal
        isOpen={showImageModal}
        existingChannels={getCurrentBossChannels()}
        onClose={() => setShowImageModal(false)}
        onAddChannels={handleAddChannels}
      />
    </div>
  );
}

export default App;
