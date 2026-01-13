package com.chatapp.controller;

import com.chatapp.dto.BossRaidMessage;
import com.chatapp.service.BossRaidStateService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * 보스 레이드 WebSocket 컨트롤러
 */
@Controller
public class BossRaidController {

    private final BossRaidStateService stateService;
    private final SimpMessageSendingOperations messagingTemplate;

    public BossRaidController(BossRaidStateService stateService,
                             SimpMessageSendingOperations messagingTemplate) {
        this.stateService = stateService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 채널 생성 (모든 보스에 공통 적용)
     */
    @MessageMapping("/boss/channel.create")
    @SendTo("/topic/boss-raid/channels")
    public BossRaidMessage createChannel(BossRaidMessage message) {
        String channelId = message.getChannelId();
        if (channelId == null) return null;
        
        // 서버 메모리에 채널 저장 (모든 보스에 적용)
        stateService.createChannel(channelId);
        
        // 공통 채널 목록 브로드캐스트
        BossRaidMessage response = new BossRaidMessage();
        response.setType(BossRaidMessage.MessageType.CHANNEL_LIST);
        response.setBossChannels(stateService.getAllBossChannels());
        return response;
    }

    /**
     * 채널 삭제 (모든 보스에서 삭제)
     */
    @MessageMapping("/boss/channel.delete")
    @SendTo("/topic/boss-raid/channels")
    public BossRaidMessage deleteChannel(BossRaidMessage message) {
        String channelId = message.getChannelId();
        if (channelId == null) return null;
        
        // 서버 메모리에서 채널 삭제 (모든 보스에서)
        stateService.deleteChannel(channelId);
        
        // 공통 채널 목록 브로드캐스트
        BossRaidMessage response = new BossRaidMessage();
        response.setType(BossRaidMessage.MessageType.CHANNEL_LIST);
        response.setBossChannels(stateService.getAllBossChannels());
        return response;
    }

    /**
     * 보스 체크 상태 변경
     */
    @MessageMapping("/boss/check")
    public void handleBossCheck(BossRaidMessage message) {
        String bossType = message.getBossType();
        String channelId = message.getChannelId();
        if (bossType == null || channelId == null) return;
        
        // 서버 메모리에 상태 저장
        stateService.updateBossCheck(
            bossType,
            channelId,
            message.getCardIndex(),
            message.getChecked()
        );
        
        // 실시간 브로드캐스트 (보스타입-채널ID 조합으로 토픽 생성)
        message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
        messagingTemplate.convertAndSend("/topic/boss-raid/" + bossType + "/" + channelId, message);
    }

    /**
     * 보스 카드 색상 변경
     */
    @MessageMapping("/boss/color")
    public void handleBossColor(BossRaidMessage message) {
        String bossType = message.getBossType();
        String channelId = message.getChannelId();
        if (bossType == null || channelId == null) return;
        
        // 서버 메모리에 상태 저장
        stateService.updateBossColor(
            bossType,
            channelId,
            message.getCardIndex(),
            message.getColor()
        );
        
        // 실시간 브로드캐스트
        message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
        messagingTemplate.convertAndSend("/topic/boss-raid/" + bossType + "/" + channelId, message);
    }

    /**
     * 보스 카드 메모 변경
     */
    @MessageMapping("/boss/memo")
    public void handleBossMemo(BossRaidMessage message) {
        String bossType = message.getBossType();
        String channelId = message.getChannelId();
        if (bossType == null || channelId == null) return;
        
        // 서버 메모리에 상태 저장
        stateService.updateBossMemo(
            bossType,
            channelId,
            message.getCardIndex(),
            message.getMemo()
        );
        
        // 실시간 브로드캐스트
        message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
        messagingTemplate.convertAndSend("/topic/boss-raid/" + bossType + "/" + channelId, message);
    }

    /**
     * 채널 상태 변경 (보스별)
     */
    @MessageMapping("/boss/channel.status")
    public void handleChannelStatus(BossRaidMessage message) {
        String bossType = message.getBossType();
        String channelId = message.getChannelId();
        if (channelId == null || bossType == null) return;
        
        // 서버 메모리에 상태 저장
        stateService.updateChannelStatus(bossType, channelId, message.getStatus());
        
        // 실시간 브로드캐스트
        message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
        messagingTemplate.convertAndSend("/topic/boss-raid/channel-state/" + bossType, message);
    }

    /**
     * 채널 메모 변경 (보스별)
     */
    @MessageMapping("/boss/channel.memo")
    public void handleChannelMemo(BossRaidMessage message) {
        String bossType = message.getBossType();
        String channelId = message.getChannelId();
        if (channelId == null || bossType == null) return;
        
        // 서버 메모리에 상태 저장
        stateService.updateChannelMemo(bossType, channelId, message.getMemo());
        
        // 실시간 브로드캐스트
        message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
        messagingTemplate.convertAndSend("/topic/boss-raid/channel-state/" + bossType, message);
    }

    /**
     * 새 사용자 접속 시 전체 상태 동기화
     */
    @MessageMapping("/boss/sync")
    public void requestStateSync(
            BossRaidMessage message,
            SimpMessageHeaderAccessor headerAccessor) {
        
        String sessionId = headerAccessor.getSessionId();
        
        // 전체 상태 가져오기
        Map<String, Map<String, BossRaidMessage.ChannelState>> fullState = stateService.getFullState();
        Map<String, java.util.Set<String>> bossChannels = stateService.getAllBossChannels();
        
        // 동기화 메시지 생성
        BossRaidMessage syncMessage = new BossRaidMessage();
        syncMessage.setType(BossRaidMessage.MessageType.STATE_SYNC);
        syncMessage.setFullState(fullState);
        syncMessage.setBossChannels(bossChannels);
        
        // 요청한 사용자에게만 전송
        messagingTemplate.convertAndSendToUser(
            sessionId,
            "/queue/boss-state",
            syncMessage
        );
    }

    /**
     * 보스별 채널 목록 요청
     */
    @MessageMapping("/boss/channel.list")
    @SendTo("/topic/boss-raid/channels")
    public BossRaidMessage getChannelList() {
        BossRaidMessage response = new BossRaidMessage();
        response.setType(BossRaidMessage.MessageType.CHANNEL_LIST);
        response.setBossChannels(stateService.getAllBossChannels());
        return response;
    }
}
