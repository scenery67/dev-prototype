import { BOSS_TYPES } from '../constants/boss';

interface BossTabsProps {
  selectedBossType: string;
  onBossTypeChange: (bossType: string) => void;
}

export default function BossTabs({ selectedBossType, onBossTypeChange }: BossTabsProps) {
  return (
    <div className="boss-tabs-section">
      <div className="boss-tabs">
        {BOSS_TYPES.map((bossType) => (
          <button
            key={bossType}
            className={`boss-tab ${selectedBossType === bossType ? 'active' : ''}`}
            onClick={() => onBossTypeChange(bossType)}
          >
            {bossType}
          </button>
        ))}
      </div>
    </div>
  );
}
