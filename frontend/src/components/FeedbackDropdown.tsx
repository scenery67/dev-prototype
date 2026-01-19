import { useState, useRef, useEffect } from 'react';
import './FeedbackDropdown.css';

interface FeedbackDropdownProps {
  isConnected?: boolean;
}

export default function FeedbackDropdown({}: FeedbackDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      alert('문의 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = import.meta.env.DEV 
        ? 'http://localhost:8080' 
        : (import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:8080`);

      const response = await fetch(`${backendUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname.trim() || '',
          email: email.trim() || '',
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('문의사항이 전송되었습니다. 감사합니다!');
        setNickname('');
        setEmail('');
        setMessage('');
        setIsOpen(false);
      } else {
        // 백엔드에서 보낸 에러 메시지 사용
        const errorMessage = data.message || '문의사항 전송에 실패했습니다. 다시 시도해주세요.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('피드백 전송 오류:', error);
      // 네트워크 에러나 JSON 파싱 에러 등
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        alert('문의사항 전송에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-dropdown-container" ref={dropdownRef}>
      <button
        className="feedback-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <svg
          className="feedback-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
        피드백/문의사항
      </button>
      
      {isOpen && (
        <div className="feedback-dropdown">
          <div className="feedback-header">
            <h3>피드백/문의사항</h3>
            <button
              className="feedback-close"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-field">
              <label htmlFor="feedback-nickname">닉네임 (선택사항)</label>
              <input
                id="feedback-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
              />
            </div>
            
            <div className="feedback-field">
              <label htmlFor="feedback-email">이메일 (선택사항)</label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
              />
            </div>
            
            <div className="feedback-field">
              <label htmlFor="feedback-message">문의 내용 *</label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="피드백이나 문의사항을 입력해주세요"
                rows={6}
                required
              />
            </div>
            
            <div className="feedback-actions">
              <button
                type="button"
                className="feedback-cancel"
                onClick={() => setIsOpen(false)}
              >
                취소
              </button>
              <button
                type="submit"
                className="feedback-submit"
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? (
                  '전송 중...'
                ) : (
                  <>
                    <svg
                      className="discord-icon"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Discord로 전송
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
