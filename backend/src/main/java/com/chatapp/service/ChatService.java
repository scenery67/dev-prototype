package com.chatapp.service;

import com.chatapp.dto.ChatMessage;
import com.chatapp.event.WebSocketEventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * 채팅 서비스
 * 채팅 관련 비즈니스 로직을 처리
 */
@Service
public class ChatService {

    private final WebSocketEventListener webSocketEventListener;
    private final ChatBotService chatBotService;
    private final SimpMessageSendingOperations messagingTemplate;

    public ChatService(WebSocketEventListener webSocketEventListener, 
                      ChatBotService chatBotService,
                      SimpMessageSendingOperations messagingTemplate) {
        this.webSocketEventListener = webSocketEventListener;
        this.chatBotService = chatBotService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 메시지 전송 처리
     * @param message 전송할 메시지
     * @return 처리된 메시지
     */
    public ChatMessage processMessage(ChatMessage message) {
        String content = message.getContent();
        
        // "."으로 시작하는 메시지는 챗봇에게 보내는 메시지
        if (chatBotService.isBotCommand(content)) {
            // "." 제거한 메시지로 챗봇 응답 생성
            String cleanMessage = chatBotService.removeBotPrefix(content);
            ChatMessage botResponse = chatBotService.generateResponse(cleanMessage, message.getSender());
            
            // 원본 메시지에서 "." 제거하여 표시 (사용자가 보낸 메시지처럼)
            message.setContent(cleanMessage);
            
            // 챗봇 응답을 약간의 딜레이를 주고 브로드캐스트 (질문 다음에 표시되도록)
            sendBotMessageDelayed(botResponse, 500); // 500ms 딜레이
            
            // 원본 메시지도 반환 (사용자가 보낸 메시지로 표시)
            return message;
        }
        
        // 메시지 검증 등 비즈니스 로직 처리 가능
        // 예: 금지어 필터링, 메시지 포맷팅 등
        return message;
    }

    /**
     * 챗봇 메시지를 딜레이를 주고 전송
     * 원본 메시지가 먼저 표시되도록 함
     */
    private void sendBotMessageDelayed(ChatMessage botMessage, long delayMs) {
        CompletableFuture.delayedExecutor(delayMs, TimeUnit.MILLISECONDS)
            .execute(() -> {
                messagingTemplate.convertAndSend("/topic/public", botMessage);
            });
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

