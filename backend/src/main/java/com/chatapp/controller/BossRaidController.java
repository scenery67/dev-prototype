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
        String status = message.getStatus();
        
        if (channelId == null || bossType == null) return;
        
        // 빈 문자열인 경우 null로 변환 (상태 초기화)
        if (status != null && status.isEmpty()) {
            status = null;
        }
        
        // 서버 메모리에 상태 저장
        stateService.updateChannelStatus(bossType, channelId, status);
        
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
     * 용 레이드 색상 변경 (용 타입별)
     */
    @MessageMapping("/boss/dragon.color")
    public void handleDragonColor(BossRaidMessage message) {
        String bossType = message.getBossType();
        String channelId = message.getChannelId();
        String dragonType = message.getDragonType();
        String color = message.getColor();
        
        if (channelId == null || bossType == null || dragonType == null) return;
        
        // 빈 문자열인 경우 null로 변환 (색상 초기화)
        if (color != null && color.isEmpty()) {
            color = null;
        }
        
        // 서버 메모리에 상태 저장
        stateService.updateDragonColor(bossType, channelId, dragonType, color);
        
        // 실시간 브로드캐스트
        message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
        messagingTemplate.convertAndSend("/topic/boss-raid/channel-state/" + bossType, message);
    }

    /**
     * 수화룡 시간 업데이트
     */
    @MessageMapping("/boss/hydra.time")
    public void handleHydraTime(BossRaidMessage message) {
        String bossType = message.getBossType();
        String channelId = message.getChannelId();
        String hydraType = message.getHydraType();
        String caughtTime = message.getCaughtTime();
        Long spawnTime = message.getSpawnTime();
        
        if (channelId == null || bossType == null || hydraType == null) return;
        
        // 초기화인 경우 (caughtTime과 spawnTime이 모두 null)
        if (caughtTime == null && spawnTime == null) {
            stateService.updateHydraTime(bossType, channelId, hydraType, null, null);
            // 실시간 브로드캐스트
            message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
            messagingTemplate.convertAndSend("/topic/boss-raid/channel-state/" + bossType, message);
            return;
        }
        
        // 일반 업데이트인 경우 null 체크
        if (caughtTime == null || spawnTime == null) return;
        
        // 서버 메모리에 상태 저장
        stateService.updateHydraTime(bossType, channelId, hydraType, caughtTime, spawnTime);
        
        // 실시간 브로드캐스트
        message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
        messagingTemplate.convertAndSend("/topic/boss-raid/channel-state/" + bossType, message);
    }

    /**
     * 수화룡 젠 시간 설정 업데이트
     */
    @MessageMapping("/boss/hydra.spawn-settings")
    public void handleHydraSpawnSettings(BossRaidMessage message) {
        String channelId = message.getChannelId();
        String hydraType = message.getHydraType();
        Integer spawnMinutes = message.getSpawnMinutes();
        
        if (channelId == null || hydraType == null || spawnMinutes == null) return;
        
        // 서버 메모리에 설정 저장
        stateService.updateHydraSpawnSettings(channelId, hydraType, spawnMinutes);
        
        // 실시간 브로드캐스트
        message.setType(BossRaidMessage.MessageType.STATE_CHANGE);
        messagingTemplate.convertAndSend("/topic/boss-raid/channel-state/수화룡", message);
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
        
        // 디버깅: 상태 확인
        System.out.println("=== STATE SYNC REQUEST ===");
        System.out.println("Session ID: " + sessionId);
        System.out.println("Boss Channels: " + bossChannels);
        fullState.forEach((bossType, channels) -> {
            System.out.println("Boss Type: " + bossType + ", Channels: " + channels.size());
            channels.forEach((channelId, state) -> {
                System.out.println("  Channel: " + channelId);
                System.out.println("    Status: " + state.getStatus());
                System.out.println("    Memo: " + state.getMemo());
                if (state.getDragonColors() != null) {
                    System.out.println("    Dragon Colors: " + state.getDragonColors());
                }
                if (state.getHydraStates() != null) {
                    System.out.println("    Hydra States: " + state.getHydraStates().size());
                    state.getHydraStates().forEach((type, hydraState) -> {
                        System.out.println("      " + type + ": caughtTime=" + hydraState.getCaughtTime() + ", spawnTime=" + hydraState.getSpawnTime());
                    });
                }
            });
        });
        
        // 동기화 메시지 생성
        BossRaidMessage syncMessage = new BossRaidMessage();
        syncMessage.setType(BossRaidMessage.MessageType.STATE_SYNC);
        syncMessage.setFullState(fullState);
        syncMessage.setBossChannels(bossChannels);
        
        // 요청한 사용자에게만 전송
        // convertAndSendToUser는 /user/{username}/queue/boss-state로 변환
        // 세션 ID를 사용자 이름으로 사용 (Spring이 자동으로 처리)
        messagingTemplate.convertAndSendToUser(
            sessionId,
            "/queue/boss-state",
            syncMessage
        );
        
        System.out.println("Sent sync message using convertAndSendToUser with sessionId: " + sessionId);
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
