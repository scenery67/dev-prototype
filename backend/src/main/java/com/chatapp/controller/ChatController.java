package com.chatapp.controller;

import com.chatapp.dto.ChatMessage;
import com.chatapp.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

/**
 * 채팅 컨트롤러
 * WebSocket 메시지 매핑 및 라우팅만 담당
 * 비즈니스 로직은 Service 레이어에서 처리
 */
@Controller
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * 메시지 전송 처리
     * 클라이언트가 /app/chat.sendMessage로 메시지를 보내면 호출됨
     */
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(ChatMessage message) {
        // Service 레이어에서 비즈니스 로직 처리
        return chatService.processMessage(message);
    }

    /**
     * 사용자 입장 처리
     * 클라이언트가 /app/chat.addUser로 메시지를 보내면 호출됨
     */
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        // 웹소켓 고유 세션 ID 추출
        // 웹소켓 연결 = 세션
        String sessionId = headerAccessor.getSessionId(); 
        
        // Service 레이어에서 비즈니스 로직 처리
        return chatService.addUser(message, sessionId);
    }
}

