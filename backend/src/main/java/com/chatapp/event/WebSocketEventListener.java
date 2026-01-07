package com.chatapp.event;

import com.chatapp.dto.ChatMessage;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * WebSocket 이벤트 리스너
 * 연결 및 해제 이벤트를 처리하여 접속자 목록을 관리
 */
@Component
public class WebSocketEventListener {

    // 접속자 목록 관리 (세션 ID -> 사용자 이름)
    private final ConcurrentHashMap<String, String> sessionUserMap = new ConcurrentHashMap<>();
    
    // 현재 접속 중인 사용자 목록
    private final CopyOnWriteArraySet<String> activeUsers = new CopyOnWriteArraySet<>();
    
    private final SimpMessageSendingOperations messagingTemplate;

    public WebSocketEventListener(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * WebSocket 연결 이벤트 처리
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        // 연결 시점에는 사용자 정보가 아직 없을 수 있음
        // 실제 사용자 정보는 chat.addUser 메시지에서 처리됨
    }

    /**
     * WebSocket 연결 해제 이벤트 처리
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // 세션에 연결된 사용자 이름 가져오기
        String username = sessionUserMap.remove(sessionId);
        
        if (username != null) {
            // 접속자 목록에서 제거
            activeUsers.remove(username);
            
            // 접속자 목록 업데이트 메시지 브로드캐스트
            broadcastUserList();
            
            // 퇴장 메시지 브로드캐스트
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType(ChatMessage.MessageType.LEAVE);
            chatMessage.setSender(username);
            chatMessage.setContent(username + "님이 채팅방을 나갔습니다.");
            
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }

    /**
     * 접속자 추가
     */
    public void addUser(String sessionId, String username) {
        sessionUserMap.put(sessionId, username);
        activeUsers.add(username);
        broadcastUserList();
    }

    /**
     * 접속자 목록 브로드캐스트
     */
    public void broadcastUserList() {
        ChatMessage message = new ChatMessage();
        message.setType(ChatMessage.MessageType.USER_LIST);
        message.setUsers(new ArrayList<>(activeUsers));
        messagingTemplate.convertAndSend("/topic/public", message);
    }

    /**
     * 현재 접속자 목록 조회
     */
    public List<String> getActiveUsers() {
        return new ArrayList<>(activeUsers);
    }
}

