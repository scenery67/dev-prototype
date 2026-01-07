package com.chatapp.service;

import com.chatapp.dto.ChatMessage;
import com.chatapp.event.WebSocketEventListener;
import org.springframework.stereotype.Service;

/**
 * 채팅 서비스
 * 채팅 관련 비즈니스 로직을 처리
 */
@Service
public class ChatService {

    private final WebSocketEventListener webSocketEventListener;

    public ChatService(WebSocketEventListener webSocketEventListener) {
        this.webSocketEventListener = webSocketEventListener;
    }

    /**
     * 메시지 전송 처리
     * @param message 전송할 메시지
     * @return 처리된 메시지
     */
    public ChatMessage processMessage(ChatMessage message) {
        // 메시지 검증 등 비즈니스 로직 처리 가능
        // 예: 금지어 필터링, 메시지 포맷팅 등
        return message;
    }

    /**
     * 사용자 입장 처리
     * @param message 입장 메시지
     * @param sessionId 세션 ID
     * @return 처리된 입장 메시지
     */
    public ChatMessage addUser(ChatMessage message, String sessionId) {
        String username = message.getSender();
        
        // 접속자 목록에 추가
        webSocketEventListener.addUser(sessionId, username);
        
        // 입장 메시지 설정
        message.setType(ChatMessage.MessageType.JOIN);
        
        return message;
    }
}

