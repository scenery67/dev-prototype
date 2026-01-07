package com.chatapp.controller;

import com.chatapp.dto.ChatMessage;
import com.chatapp.event.WebSocketEventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final WebSocketEventListener webSocketEventListener;

    public ChatController(WebSocketEventListener webSocketEventListener) {
        this.webSocketEventListener = webSocketEventListener;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(ChatMessage message) {
        return message;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        // 세션 ID와 사용자 이름을 연결
        String sessionId = headerAccessor.getSessionId();
        String username = message.getSender();
        
        // 접속자 목록에 추가
        webSocketEventListener.addUser(sessionId, username);
        
        // 입장 메시지 설정
        message.setType(ChatMessage.MessageType.JOIN);
        return message;
    }
}

