# WebSocket Chat Application

웹소켓을 이용한 실시간 채팅 애플리케이션입니다.

## 기술 스택

- **백엔드**: Spring Boot 3.3.4, WebSocket (STOMP)
- **프론트엔드**: React 18, TypeScript, Vite
- **통신**: SockJS, STOMP

## 프로젝트 구조

```
websocket-chat/
├── backend/          # Spring Boot 백엔드
│   ├── src/
│   │   └── main/
│   │       ├── java/com/chatapp/
│   │       └── resources/
│   ├── build.gradle
│   └── settings.gradle
└── frontend/         # React 프론트엔드
    ├── src/
    ├── package.json
    └── vite.config.ts
```

## 실행 방법

### 백엔드 실행

```bash
cd backend
./gradlew bootRun
```

백엔드는 `http://localhost:8080`에서 실행됩니다.

### 프론트엔드 실행

```bash
cd frontend
yarn install
yarn dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## 기능

- 실시간 채팅 메시지 전송 및 수신
- 사용자 입장 알림
- WebSocket을 통한 양방향 통신

## 개발 환경

- Java 21
- Node.js (최신 LTS 버전 권장)
- Gradle 8.9

