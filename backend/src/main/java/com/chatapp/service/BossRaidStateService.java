package com.chatapp.service;

import com.chatapp.dto.BossRaidMessage;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 보스 레이드 상태 관리 서비스
 * 서버 메모리에 모든 상태를 저장하고 관리
 * 구조: Map<보스타입, Map<채널ID, Map<카드인덱스, 카드상태>>>
 */
@Service
public class BossRaidStateService {

    // 공통 채널 목록: Set<채널ID>
    private final java.util.Set<String> commonChannels = ConcurrentHashMap.newKeySet();

    // 보스별 채널 상태: Map<보스타입, Map<채널ID, 채널상태>>
    private final ConcurrentHashMap<String, Map<String, BossRaidMessage.ChannelState>> bossChannelStates = 
        new ConcurrentHashMap<>();

    // 보스별 카드 상태: Map<보스타입, Map<채널ID, Map<카드인덱스, 카드상태>>>
    // 카드인덱스는 "0", "1", "2", "3", "4" 문자열로 저장
    private final ConcurrentHashMap<String, Map<String, Map<String, BossRaidMessage.BossCardState>>> 
        bossCardStates = new ConcurrentHashMap<>();
    
    // 수화룡 젠 시간 설정: Map<채널ID, Map<수화룡타입, 분>>
    private final ConcurrentHashMap<String, Map<String, Integer>> hydraSpawnSettings = 
        new ConcurrentHashMap<>();

    /**
     * 채널 생성 (모든 보스에 공통 적용)
     */
    public void createChannel(String channelId) {
        // 공통 채널 목록에 추가
        commonChannels.add(channelId);
        
        // 모든 보스에 채널 상태 초기화
        String[] bossTypes = {"용", "해골왕", "수화룡"};
        for (String bossType : bossTypes) {
            // 채널 상태 초기화
            Map<String, BossRaidMessage.ChannelState> bossChannels = 
                bossChannelStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>());
            BossRaidMessage.ChannelState channelState = new BossRaidMessage.ChannelState();
            
            // 수화룡 레이드인 경우 수화룡 상태 초기화
            if ("수화룡".equals(bossType)) {
                Map<String, BossRaidMessage.HydraState> hydraStates = new ConcurrentHashMap<>();
                // 기본 젠 시간 설정 (수룡: 35분, 화룡: 37분)
                Map<String, Integer> spawnSettings = hydraSpawnSettings.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
                Integer suSpawnMinutes = spawnSettings.getOrDefault("수룡", 35);
                Integer hwaSpawnMinutes = spawnSettings.getOrDefault("화룡", 37);
                
                BossRaidMessage.HydraState suState = new BossRaidMessage.HydraState();
                suState.setSpawnMinutes(suSpawnMinutes);
                hydraStates.put("수룡", suState);
                
                BossRaidMessage.HydraState hwaState = new BossRaidMessage.HydraState();
                hwaState.setSpawnMinutes(hwaSpawnMinutes);
                hydraStates.put("화룡", hwaState);
                
                channelState.setHydraStates(hydraStates);
            }
            
            bossChannels.put(channelId, channelState);
            
            // 카드 상태 초기화
            bossCardStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>())
                .put(channelId, new ConcurrentHashMap<>());
        }
        
        // 수화룡 젠 시간 설정 초기화 (채널 생성 시 기본값 설정)
        Map<String, Integer> spawnSettings = hydraSpawnSettings.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
        spawnSettings.putIfAbsent("수룡", 35);
        spawnSettings.putIfAbsent("화룡", 37);
    }

    /**
     * 채널 삭제 (모든 보스에서 삭제)
     */
    public void deleteChannel(String channelId) {
        // 공통 채널 목록에서 제거
        commonChannels.remove(channelId);
        
        // 모든 보스에서 채널 상태 및 카드 상태 제거
        bossChannelStates.forEach((bossType, bossChannels) -> {
            bossChannels.remove(channelId);
        });
        bossCardStates.forEach((bossType, bossCards) -> {
            bossCards.remove(channelId);
        });
    }

    /**
     * 채널 상태 업데이트 (보스별)
     */
    public void updateChannelStatus(String bossType, String channelId, String status) {
        Map<String, BossRaidMessage.ChannelState> bossChannels = 
            bossChannelStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>());
        BossRaidMessage.ChannelState channelState = 
            bossChannels.computeIfAbsent(channelId, k -> new BossRaidMessage.ChannelState());
        channelState.setStatus(status);
    }

    /**
     * 용 레이드 색상 업데이트 (용 타입별)
     */
    public void updateDragonColor(String bossType, String channelId, String dragonType, String color) {
        Map<String, BossRaidMessage.ChannelState> bossChannels = 
            bossChannelStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>());
        BossRaidMessage.ChannelState channelState = 
            bossChannels.computeIfAbsent(channelId, k -> new BossRaidMessage.ChannelState());
        
        // 용 색상 맵 초기화
        if (channelState.getDragonColors() == null) {
            channelState.setDragonColors(new ConcurrentHashMap<>());
        }
        
        // 용 타입별 색상 업데이트
        channelState.getDragonColors().put(dragonType, color);
    }

    /**
     * 수화룡 시간 업데이트
     */
    public void updateHydraTime(String bossType, String channelId, String hydraType, String caughtTime, Long spawnTime) {
        Map<String, BossRaidMessage.ChannelState> bossChannels = 
            bossChannelStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>());
        BossRaidMessage.ChannelState channelState = 
            bossChannels.computeIfAbsent(channelId, k -> new BossRaidMessage.ChannelState());
        
        // 수화룡 상태 맵 초기화
        if (channelState.getHydraStates() == null) {
            channelState.setHydraStates(new ConcurrentHashMap<>());
        }
        
        // 수화룡 상태 가져오기 또는 생성
        BossRaidMessage.HydraState hydraState = channelState.getHydraStates().computeIfAbsent(
            hydraType, k -> {
                BossRaidMessage.HydraState newState = new BossRaidMessage.HydraState();
                // 기본 젠 시간 설정 가져오기
                Map<String, Integer> spawnSettings = hydraSpawnSettings.getOrDefault(channelId, new ConcurrentHashMap<>());
                Integer spawnMinutes = spawnSettings.getOrDefault(hydraType, hydraType.equals("수룡") ? 35 : 37);
                newState.setSpawnMinutes(spawnMinutes);
                return newState;
            }
        );
        
        // 시간 업데이트
        hydraState.setCaughtTime(caughtTime);
        hydraState.setSpawnTime(spawnTime);
    }

    /**
     * 수화룡 젠 시간 설정 업데이트
     */
    public void updateHydraSpawnSettings(String channelId, String hydraType, Integer spawnMinutes) {
        Map<String, Integer> spawnSettings = hydraSpawnSettings.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
        spawnSettings.put(hydraType, spawnMinutes);
        
        // 해당 채널의 모든 수화룡 상태의 젠 시간 설정도 업데이트
        Map<String, BossRaidMessage.ChannelState> bossChannels = bossChannelStates.get("수화룡");
        if (bossChannels != null) {
            BossRaidMessage.ChannelState channelState = bossChannels.get(channelId);
            if (channelState != null && channelState.getHydraStates() != null) {
                BossRaidMessage.HydraState hydraState = channelState.getHydraStates().get(hydraType);
                if (hydraState != null) {
                    hydraState.setSpawnMinutes(spawnMinutes);
                    // 이미 잡힌 시간이 있으면 젠 예정 시간 재계산
                    if (hydraState.getCaughtTime() != null && hydraState.getSpawnTime() != null) {
                        // 잡힌 시간에서 새로운 젠 시간만큼 더하기
                        try {
                            java.time.LocalDateTime caughtDateTime = java.time.LocalDateTime.parse(hydraState.getCaughtTime());
                            java.time.LocalDateTime newSpawnTime = caughtDateTime.plusMinutes(spawnMinutes);
                            hydraState.setSpawnTime(newSpawnTime.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli());
                        } catch (Exception e) {
                            // 파싱 실패 시 무시
                        }
                    }
                }
            }
        }
    }

    /**
     * 수화룡 젠 시간 설정 가져오기
     */
    public Map<String, Integer> getHydraSpawnSettings(String channelId) {
        Map<String, Integer> settings = hydraSpawnSettings.get(channelId);
        if (settings == null) {
            settings = new HashMap<>();
            settings.put("수룡", 35);
            settings.put("화룡", 37);
        }
        return new HashMap<>(settings);
    }

    /**
     * 채널 메모 업데이트 (보스별)
     */
    public void updateChannelMemo(String bossType, String channelId, String memo) {
        Map<String, BossRaidMessage.ChannelState> bossChannels = 
            bossChannelStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>());
        BossRaidMessage.ChannelState channelState = 
            bossChannels.computeIfAbsent(channelId, k -> new BossRaidMessage.ChannelState());
        channelState.setMemo(memo);
    }

    /**
     * 보스별 채널 상태 가져오기
     */
    public Map<String, BossRaidMessage.ChannelState> getBossChannelStates(String bossType) {
        Map<String, BossRaidMessage.ChannelState> result = new HashMap<>();
        Map<String, BossRaidMessage.ChannelState> bossChannels = bossChannelStates.get(bossType);
        
        // 공통 채널 목록의 모든 채널에 대해 상태 가져오기
        for (String channelId : commonChannels) {
            BossRaidMessage.ChannelState state = null;
            if (bossChannels != null) {
                state = bossChannels.get(channelId);
            }
            
            // 상태가 없으면 빈 상태 생성
            if (state == null) {
                state = new BossRaidMessage.ChannelState();
            }
            
            // 깊은 복사
            BossRaidMessage.ChannelState copiedState = new BossRaidMessage.ChannelState();
            copiedState.setStatus(state.getStatus());
            copiedState.setMemo(state.getMemo());
            // 용 색상 복사
            if (state.getDragonColors() != null) {
                copiedState.setDragonColors(new HashMap<>(state.getDragonColors()));
            }
            // 수화룡 상태 복사
            if (state.getHydraStates() != null) {
                Map<String, BossRaidMessage.HydraState> copiedHydraStates = new HashMap<>();
                state.getHydraStates().forEach((type, hydraState) -> {
                    BossRaidMessage.HydraState copiedHydraState = new BossRaidMessage.HydraState();
                    copiedHydraState.setCaughtTime(hydraState.getCaughtTime());
                    copiedHydraState.setSpawnTime(hydraState.getSpawnTime());
                    copiedHydraState.setSpawnMinutes(hydraState.getSpawnMinutes());
                    copiedHydraStates.put(type, copiedHydraState);
                });
                copiedState.setHydraStates(copiedHydraStates);
            }
            result.put(channelId, copiedState);
        }
        
        return result;
    }

    /**
     * 전체 상태 가져오기 (모든 보스의 채널 상태)
     */
    public Map<String, Map<String, BossRaidMessage.ChannelState>> getFullState() {
        Map<String, Map<String, BossRaidMessage.ChannelState>> result = new HashMap<>();
        String[] bossTypes = {"용", "해골왕", "수화룡"};
        
        // 모든 보스 타입에 대해
        for (String bossType : bossTypes) {
            Map<String, BossRaidMessage.ChannelState> copiedBossChannels = new HashMap<>();
            Map<String, BossRaidMessage.ChannelState> bossChannels = bossChannelStates.get(bossType);
            
            // 공통 채널 목록의 모든 채널에 대해 상태 가져오기
            for (String channelId : commonChannels) {
                BossRaidMessage.ChannelState state = null;
                if (bossChannels != null) {
                    state = bossChannels.get(channelId);
                }
                
                // 상태가 없으면 빈 상태 생성
                if (state == null) {
                    state = new BossRaidMessage.ChannelState();
                }
                
                // 깊은 복사
                BossRaidMessage.ChannelState copiedState = new BossRaidMessage.ChannelState();
                copiedState.setStatus(state.getStatus());
                copiedState.setMemo(state.getMemo());
                // 용 색상 복사
                if (state.getDragonColors() != null) {
                    copiedState.setDragonColors(new HashMap<>(state.getDragonColors()));
                }
                // 수화룡 상태 복사
                if (state.getHydraStates() != null) {
                    Map<String, BossRaidMessage.HydraState> copiedHydraStates = new HashMap<>();
                    state.getHydraStates().forEach((type, hydraState) -> {
                        BossRaidMessage.HydraState copiedHydraState = new BossRaidMessage.HydraState();
                        copiedHydraState.setCaughtTime(hydraState.getCaughtTime());
                        copiedHydraState.setSpawnTime(hydraState.getSpawnTime());
                        copiedHydraState.setSpawnMinutes(hydraState.getSpawnMinutes());
                        copiedHydraStates.put(type, copiedHydraState);
                    });
                    copiedState.setHydraStates(copiedHydraStates);
                }
                copiedBossChannels.put(channelId, copiedState);
            }
            
            result.put(bossType, copiedBossChannels);
        }
        
        return result;
    }

    /**
     * 공통 채널 목록 조회
     */
    public java.util.Set<String> getCommonChannels() {
        return new java.util.HashSet<>(commonChannels);
    }

    /**
     * 모든 보스의 채널 목록 조회 (공통 채널을 모든 보스에 반환)
     */
    public Map<String, java.util.Set<String>> getAllBossChannels() {
        Map<String, java.util.Set<String>> result = new HashMap<>();
        java.util.Set<String> channels = getCommonChannels();
        // 모든 보스 타입에 동일한 채널 목록 반환
        result.put("용", channels);
        result.put("해골왕", channels);
        result.put("수화룡", channels);
        return result;
    }

    /**
     * 보스 체크 상태 업데이트
     */
    public void updateBossCheck(String bossType, String channelId, 
                                Integer cardIndex, boolean checked) {
        Map<String, Map<String, BossRaidMessage.BossCardState>> bossState = 
            bossCardStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>());
        
        Map<String, BossRaidMessage.BossCardState> channelState = 
            bossState.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
        
        String cardKey = String.valueOf(cardIndex);
        BossRaidMessage.BossCardState cardState = 
            channelState.computeIfAbsent(cardKey, k -> new BossRaidMessage.BossCardState());
        
        cardState.setChecked(checked);
    }

    /**
     * 보스 카드 색상 업데이트
     */
    public void updateBossColor(String bossType, String channelId, 
                                Integer cardIndex, String color) {
        Map<String, Map<String, BossRaidMessage.BossCardState>> bossState = 
            bossCardStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>());
        
        Map<String, BossRaidMessage.BossCardState> channelState = 
            bossState.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
        
        String cardKey = String.valueOf(cardIndex);
        BossRaidMessage.BossCardState cardState = 
            channelState.computeIfAbsent(cardKey, k -> new BossRaidMessage.BossCardState());
        
        cardState.setColor(color);
    }

    /**
     * 보스 카드 메모 업데이트
     */
    public void updateBossMemo(String bossType, String channelId, 
                              Integer cardIndex, String memo) {
        Map<String, Map<String, BossRaidMessage.BossCardState>> bossState = 
            bossCardStates.computeIfAbsent(bossType, k -> new ConcurrentHashMap<>());
        
        Map<String, BossRaidMessage.BossCardState> channelState = 
            bossState.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
        
        String cardKey = String.valueOf(cardIndex);
        BossRaidMessage.BossCardState cardState = 
            channelState.computeIfAbsent(cardKey, k -> new BossRaidMessage.BossCardState());
        
        cardState.setMemo(memo);
    }

    /**
     * 보스의 채널 상태 가져오기
     */
    public Map<String, BossRaidMessage.BossCardState> getBossChannelStates(
            String bossType, String channelId) {
        Map<String, Map<String, BossRaidMessage.BossCardState>> bossState = 
            bossCardStates.get(bossType);
        
        if (bossState == null) {
            return new HashMap<>();
        }
        
        Map<String, BossRaidMessage.BossCardState> channelState = bossState.get(channelId);
        if (channelState == null) {
            return new HashMap<>();
        }
        
        // 깊은 복사 반환
        Map<String, BossRaidMessage.BossCardState> result = new HashMap<>();
        channelState.forEach((cardIndex, cardState) -> {
            BossRaidMessage.BossCardState copiedState = new BossRaidMessage.BossCardState();
            copiedState.setChecked(cardState.getChecked());
            copiedState.setColor(cardState.getColor());
            copiedState.setMemo(cardState.getMemo());
            result.put(cardIndex, copiedState);
        });
        return result;
    }

}
