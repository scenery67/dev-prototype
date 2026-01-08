import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

interface ChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'USER_LIST' | 'SET_KEEP_ALIVE';
  content: string;
  sender: string;
  users?: string[];
  keepAliveMinutes?: number;
  remainingMinutes?: number;
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const connect = () => {
    if (!username.trim()) {
      alert('사용자 이름을 입력해주세요.');
      return;
    }

    // 동적으로 WebSocket URL 결정
    // 개발 환경: Vite proxy 사용 (상대 경로)
    // 프로덕션: 환경 변수 또는 window.location 사용
    const getWebSocketUrl = () => {
      if (import.meta.env.DEV) {
        // 개발 환경: Vite proxy를 통해 연결
        return '/ws';
      } else {
        // 프로덕션: 환경 변수 또는 현재 호스트 사용
        const backendUrl = import.meta.env.VITE_WS_URL || `http://${window.location.hostname}:8080`;
        return `${backendUrl}/ws`;
      }
    };

    const client = new Client({
      webSocketFactory: () => new SockJS(getWebSocketUrl()) as any,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe('/topic/public', (message) => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          
          // 접속자 목록 업데이트 메시지 처리
          if (chatMessage.type === 'USER_LIST' && chatMessage.users) {
            setActiveUsers(chatMessage.users);
          } else if (chatMessage.type === 'SET_KEEP_ALIVE') {
            // 유지 시간 설정 메시지 처리
            console.log('SET_KEEP_ALIVE 메시지 수신:', chatMessage);
            if (chatMessage.remainingMinutes !== undefined && chatMessage.remainingMinutes !== null) {
              console.log('남은 시간 설정:', chatMessage.remainingMinutes);
              setRemainingMinutes(chatMessage.remainingMinutes);
            } else if (chatMessage.keepAliveMinutes !== undefined) {
              // remainingMinutes가 없으면 keepAliveMinutes를 사용
              console.log('유지 시간 설정 (fallback):', chatMessage.keepAliveMinutes);
              setRemainingMinutes(chatMessage.keepAliveMinutes);
            }
            setMessages((prev) => [...prev, chatMessage]);
          } else {
            // 일반 메시지는 채팅 메시지로 추가
            setMessages((prev) => [...prev, chatMessage]);
          }
        });

        client.publish({
          destination: '/app/chat.addUser',
          body: JSON.stringify({
            sender: username,
            type: 'JOIN',
            content: `${username}님이 채팅방에 참여했습니다.`,
          }),
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });

    client.activate();
    setStompClient(client);
  };

  const disconnect = () => {
    if (stompClient) {
      stompClient.deactivate();
      setStompClient(null);
      setIsConnected(false);
      setMessages([]);
    }
  };

  const sendMessage = () => {
    if (stompClient && inputMessage.trim()) {
      stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify({
          sender: username,
          type: 'CHAT',
          content: inputMessage,
        }),
      });
      setInputMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const setKeepAlive = (minutes: number) => {
    if (stompClient && minutes > 0) {
      stompClient.publish({
        destination: '/app/chat.setKeepAlive',
        body: JSON.stringify({
          type: 'SET_KEEP_ALIVE',
          keepAliveMinutes: minutes,
        }),
      });
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <h1>WebSocket Chat</h1>
          {!isConnected ? (
            <div className="login-form">
              <input
                type="text"
                placeholder="사용자 이름을 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && connect()}
                disabled={isConnected}
              />
              <button onClick={connect}>연결</button>
            </div>
          ) : (
            <div className="connection-info">
              <span className="status connected">연결됨</span>
              <span className="username">{username}</span>
              <button onClick={disconnect}>연결 끊기</button>
            </div>
          )}
        </div>

        {isConnected && (
          <>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div className="users-sidebar">
                <h3>접속자 ({activeUsers.length})</h3>
                <ul className="users-list">
                  {activeUsers.map((user, index) => (
                    <li key={index} className={user === username ? 'current-user' : ''}>
                      {user === username ? '👤 ' : '👥 '}
                      {user}
                    </li>
                  ))}
                </ul>
                
                <div className="keep-alive-section">
                  <h4>채팅방 유지 시간</h4>
                  {remainingMinutes !== null && remainingMinutes > 0 && (
                    <div className="keep-alive-countdown">
                      <span className="countdown-label">남은 시간:</span>
                      <span className="countdown-time">
                        {Math.floor(remainingMinutes / 60)}시간 {Math.floor(remainingMinutes % 60)}분 {Math.floor((remainingMinutes % 1) * 60)}초
                      </span>
                    </div>
                  )}
                  <div className="keep-alive-input">
                    <input
                      type="number"
                      placeholder="분"
                      min="1"
                      id="keepAliveInput"
                      style={{ width: '60px', padding: '5px', marginRight: '5px' }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('keepAliveInput') as HTMLInputElement;
                        const minutes = parseInt(input.value);
                        if (minutes > 0) {
                          setKeepAlive(minutes);
                          input.value = '';
                        }
                      }}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      설정
                    </button>
                  </div>
                  <div className="keep-alive-buttons">
                    <button onClick={() => setKeepAlive(60)}>+1시간</button>
                    <button onClick={() => setKeepAlive(120)}>+2시간</button>
                    <button onClick={() => setKeepAlive(180)}>+3시간</button>
                  </div>
                </div>
              </div>
              <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type === 'JOIN' ? 'system' : ''}`}>
                  {msg.type === 'JOIN' ? (
                    <span className="system-message">{msg.content}</span>
                  ) : (
                    <>
                      <span className="sender">{msg.sender}:</span>
                      <span className="content">{msg.content}</span>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="input-container">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button onClick={sendMessage}>전송</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

