import { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

interface ImageAddModalProps {
  isOpen: boolean;
  existingChannels: string[];
  onClose: () => void;
  onAddChannels: (channels: string[]) => void;
}

export default function ImageAddModal({
  isOpen,
  existingChannels,
  onClose,
  onAddChannels,
}: ImageAddModalProps) {
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [recognizedChannels, setRecognizedChannels] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 이미지 붙여넣기 처리
  const handleImagePaste = async (e: ClipboardEvent) => {
    if (!isOpen) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const imageDataUrl = event.target?.result as string;
            setPastedImage(imageDataUrl);
            setIsProcessing(true);
            
            try {
              // Tesseract.js로 OCR 수행 (숫자 인식 최적화)
              const worker = await createWorker('eng');
              
              // OCR 설정: 숫자만 인식하도록 최적화
              await worker.setParameters({
                tessedit_char_whitelist: '0123456789', // 숫자만 인식
                tessedit_pageseg_mode: 6 as any, // 단일 블록으로 인식
              });
              
              const { data: { text } } = await worker.recognize(imageDataUrl);
              await worker.terminate();

              console.log('OCR 인식 결과:', text); // 디버깅용

              // 4자리 숫자 패턴 추출 (채널 번호는 항상 4자리로 표시됨: 0001, 0012, 0123, 1234)
              // 앞에 0이 붙은 경우도 포함하여 4자리 숫자를 모두 찾음
              const channelNumberPattern = /\b\d{4}\b/g;
              const matches = text.match(channelNumberPattern);
              
              if (!matches || matches.length === 0) {
                alert('이미지에서 채널 번호를 찾을 수 없습니다.\nOCR 결과: ' + text.substring(0, 100));
                return;
              }

              // 중복 제거 및 숫자로 변환 (앞의 0 제거)
              // 예: "0001" -> 1, "0012" -> 12, "0123" -> 123, "1234" -> 1234
              // 인식된 순서를 유지하기 위해 Set 대신 배열로 중복 제거
              const seen = new Set<number>();
              const channelNumbers: number[] = [];
              
              for (const match of matches) {
                const num = parseInt(match, 10);
                if (num >= 1 && num <= 9999 && !seen.has(num)) {
                  seen.add(num);
                  channelNumbers.push(num);
                }
              }

              if (channelNumbers.length === 0) {
                alert('유효한 채널 번호를 찾을 수 없습니다.');
                return;
              }

              // 4자리 형식으로 변환 (앞에 0 추가) - 인식된 순서 유지
              const channels = channelNumbers.map(num => num.toString().padStart(4, '0'));
              
              // 기존 채널과 중복 제거
              const newChannels = channels.filter(ch => !existingChannels.includes(ch));
              
              setRecognizedChannels(newChannels);
            } catch (error) {
              console.error('OCR 오류:', error);
              alert('이미지 인식 중 오류가 발생했습니다.');
            } finally {
              setIsProcessing(false);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // 모달에서 이미지 붙여넣기 이벤트 리스너
  useEffect(() => {
    if (isOpen) {
      const handlePaste = (e: ClipboardEvent) => handleImagePaste(e);
      window.addEventListener('paste', handlePaste);
      return () => {
        window.removeEventListener('paste', handlePaste);
      };
    }
  }, [isOpen]);

  // 모달 닫을 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setPastedImage(null);
      setRecognizedChannels([]);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (recognizedChannels.length > 0) {
      onAddChannels(recognizedChannels);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        <div className="modal-header">
          <h2>채널 추가</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-instructions">
            <p>스크린샷을 클립보드에 복사한 후 Ctrl+V를 눌러 붙여넣으세요</p>
          </div>

          {/* 예시 이미지 */}
          <div className="example-image-container">
            <p className="example-label">예시 이미지 (이런 형태의 스크린샷을 붙여넣으세요)</p>
            <div className="example-image-placeholder">
              <img 
                src="/channel-example.png" 
                alt="채널 예시 이미지" 
                className="example-image"
              />
            </div>
          </div>

          {/* 붙여넣은 이미지 표시 */}
          {pastedImage && (
            <div className="pasted-image-container">
              <p className="pasted-image-label">붙여넣은 이미지:</p>
              <img src={pastedImage} alt="붙여넣은 이미지" className="pasted-image" />
              {isProcessing && (
                <div className="processing-overlay">
                  <div className="processing-spinner"></div>
                  <p>이미지 인식 중...</p>
                </div>
              )}
            </div>
          )}

          {/* 인식된 채널 목록 */}
          {recognizedChannels.length > 0 && (
            <div className="recognized-channels">
              <p className="recognized-label">인식된 채널 목록 ({recognizedChannels.length}개):</p>
              <div className="recognized-channels-list">
                {recognizedChannels.map((channelId) => (
                  <div key={channelId} className="recognized-channel-item">
                    채널 {channelId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recognizedChannels.length === 0 && !isProcessing && pastedImage && (
            <div className="no-channels-found">
              <p>이미지에서 채널 번호를 찾을 수 없습니다.</p>
              <p>4자리 숫자(0001-9999)가 포함된 이미지를 붙여넣어주세요.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel-modal">취소</button>
          <button 
            onClick={handleConfirm} 
            className="btn-confirm-modal"
            disabled={recognizedChannels.length === 0 || isProcessing}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
