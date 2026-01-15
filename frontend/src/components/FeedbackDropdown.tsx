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

      if (response.ok) {
        alert('문의사항이 전송되었습니다. 감사합니다!');
        setNickname('');
        setEmail('');
        setMessage('');
        setIsOpen(false);
      } else {
        throw new Error('전송 실패');
      }
    } catch (error) {
      console.error('피드백 전송 오류:', error);
      alert('문의사항 전송에 실패했습니다. 다시 시도해주세요.');
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
                {isSubmitting ? '전송 중...' : '문의하기'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
