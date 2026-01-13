import { useRef } from 'react';

interface ChannelAddInputProps {
  newChannelId: string;
  onChannelIdChange: (value: string) => void;
  onCreateChannel: () => void;
  onOpenImageModal: () => void;
}

export default function ChannelAddInput({
  newChannelId,
  onChannelIdChange,
  onCreateChannel,
  onOpenImageModal,
}: ChannelAddInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 숫자만 허용하고 최대 4자리로 제한
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    onChannelIdChange(numericValue);
  };

  const handleCreateChannel = () => {
    onCreateChannel();
    // 채널 추가 후 입력창에 포커스 유지
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="channel-add-input">
      <input
        ref={inputRef}
        type="text"
        placeholder="채널 ID (4자리 숫자)"
        value={newChannelId}
        onChange={handleInputChange}
        className="channel-input-small"
        onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
        maxLength={4}
        inputMode="numeric"
        pattern="[0-9]*"
      />
      <button onClick={handleCreateChannel} className="btn-primary">추가</button>
      <button onClick={onOpenImageModal} className="btn-add-channel">
        이미지로 추가
      </button>
    </div>
  );
}
