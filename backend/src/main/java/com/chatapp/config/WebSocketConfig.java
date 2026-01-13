package com.chatapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket 설정 클래스
 * STOMP 프로토콜을 사용한 실시간 양방향 통신을 위한 설정
 */
@Configuration
@EnableWebSocketMessageBroker // STOMP 메시징을 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * 메시지 브로커 설정
     * 클라이언트와 서버 간 메시지 라우팅 경로를 정의
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 서버에서 클라이언트로 메시지를 브로드캐스트할 경로 설정
        // 클라이언트는 /topic으로 시작하는 경로를 구독하여 메시지를 수신
        // /user prefix도 활성화하여 개인 큐 사용 가능
        config.enableSimpleBroker("/topic", "/queue", "/user");
        
        // 클라이언트에서 서버로 메시지를 전송할 때 사용하는 경로 접두사 설정
        // 클라이언트는 /app으로 시작하는 경로로 메시지를 전송
        config.setApplicationDestinationPrefixes("/app");
        
        // 사용자별 메시지 전송을 위한 prefix 설정
        config.setUserDestinationPrefix("/user");
    }

    /**
     * STOMP 엔드포인트 등록
     * 클라이언트가 WebSocket 연결을 맺을 수 있는 엔드포인트를 설정
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트를 /ws로 설정
        registry.addEndpoint("/ws")
                // CORS 설정: 모든 Origin 허용 (개발 환경용, 프로덕션에서는 특정 도메인만 허용 권장)
                .setAllowedOriginPatterns("*")
                // SockJS 사용: WebSocket을 지원하지 않는 브라우저를 위한 폴백 제공
                .withSockJS();
    }
}

