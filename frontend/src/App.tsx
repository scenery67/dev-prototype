import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';

interface ChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'USER_LIST';
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

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws') as any,
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

