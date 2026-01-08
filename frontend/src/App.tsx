import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

interface ChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'USER_LIST' | 'BOT';
  content: string;
  sender: string;
  users?: string[];
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
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
              </div>
              <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type === 'JOIN' ? 'system' : ''} ${msg.type === 'BOT' ? 'bot' : ''}`}>
                  {msg.type === 'JOIN' ? (
                    <span className="system-message">{msg.content}</span>
                  ) : msg.type === 'BOT' ? (
                    <>
                      <span className="bot-sender">🤖 {msg.sender}:</span>
                      <span className="bot-content">{msg.content}</span>
                    </>
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

