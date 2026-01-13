package com.chatapp.dto;

import java.util.Map;

/**
 * 보스 레이드 작업 메시지 DTO
 */
public class BossRaidMessage {
    private MessageType type;
    private String channelId;
    private String channelName;
    private String bossType;  // "용", "해골왕", "수화룡"
    private String bossId;    // "boss1", "boss2" 등
    private Boolean checked;
    private String color;     // "gray", "green", "yellow", "orange", "red"
    private String memo;      // 메모 내용
    private Integer cardIndex; // 카드 인덱스 (0-4)
    private String dragonType; // 용 타입: "흑", "진", "묵", "감"
    
    // 수화룡 레이드용
    private String hydraType; // 수화룡 타입: "수룡", "화룡"
    private String caughtTime; // 잡힌 시간 (ISO 8601 형식 또는 "HHmm" 형식)
    private Long spawnTime; // 젠 예정 시간 (타임스탬프)
    private Integer spawnMinutes; // 젠 시간 (분) - 설정값
    
    // 전체 상태 동기화용
    private Map<String, Map<String, ChannelState>> fullState; // 보스타입 -> 채널ID -> 상태
    
    // 보스별 채널 목록 동기화용
    private Map<String, java.util.Set<String>> bossChannels; // 보스타입 -> Set<채널ID>
    
    // 채널 상태
    private String status; // "gray", "green", "yellow", "orange", "red"
    private Boolean moving; // 이동중 표시 여부

    public enum MessageType {
    // 채널 관리
    CHANNEL_CREATE,    // 채널 생성
    CHANNEL_DELETE,    // 채널 삭제
    CHANNEL_SELECT,    // 채널 선택
    CHANNEL_LIST,      // 채널 목록 동기화
    CHANNEL_STATUS,    // 채널 상태 변경
    CHANNEL_MEMO,      // 채널 메모 변경
    CHANNEL_MOVING,    // 채널 이동중 표시
        
        // 보스 상태
        BOSS_CHECK,        // 보스 체크 상태 변경
        BOSS_COLOR,        // 보스 카드 색상 변경
        BOSS_MEMO,         // 보스 카드 메모 변경
        HYDRA_TIME,        // 수화룡 시간 업데이트
        HYDRA_SPAWN_SETTINGS, // 수화룡 젠 시간 설정 업데이트
        
        // 상태 동기화
        STATE_SYNC,        // 전체 상태 동기화 (새 사용자용)
        STATE_CHANGE       // 상태 변경 (실시간)
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }

    public String getChannelName() {
        return channelName;
    }

    public void setChannelName(String channelName) {
        this.channelName = channelName;
    }

    public String getBossType() {
        return bossType;
    }

    public void setBossType(String bossType) {
        this.bossType = bossType;
    }

    public String getBossId() {
        return bossId;
    }

    public void setBossId(String bossId) {
        this.bossId = bossId;
    }

    public Boolean getChecked() {
        return checked;
    }

    public void setChecked(Boolean checked) {
        this.checked = checked;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getMemo() {
        return memo;
    }

    public void setMemo(String memo) {
        this.memo = memo;
    }

    public Integer getCardIndex() {
        return cardIndex;
    }

    public void setCardIndex(Integer cardIndex) {
        this.cardIndex = cardIndex;
    }

    public String getDragonType() {
        return dragonType;
    }

    public void setDragonType(String dragonType) {
        this.dragonType = dragonType;
    }

    public String getHydraType() {
        return hydraType;
    }

    public void setHydraType(String hydraType) {
        this.hydraType = hydraType;
    }

    public String getCaughtTime() {
        return caughtTime;
    }

    public void setCaughtTime(String caughtTime) {
        this.caughtTime = caughtTime;
    }

    public Long getSpawnTime() {
        return spawnTime;
    }

    public void setSpawnTime(Long spawnTime) {
        this.spawnTime = spawnTime;
    }

    public Integer getSpawnMinutes() {
        return spawnMinutes;
    }

    public void setSpawnMinutes(Integer spawnMinutes) {
        this.spawnMinutes = spawnMinutes;
    }

    public Map<String, Map<String, ChannelState>> getFullState() {
        return fullState;
    }

    public void setFullState(Map<String, Map<String, ChannelState>> fullState) {
        this.fullState = fullState;
    }

    public Map<String, java.util.Set<String>> getBossChannels() {
        return bossChannels;
    }

    public void setBossChannels(Map<String, java.util.Set<String>> bossChannels) {
        this.bossChannels = bossChannels;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getMoving() {
        return moving;
    }

    public void setMoving(Boolean moving) {
        this.moving = moving;
    }

    /**
     * 채널 상태 내부 클래스
     */
    public static class ChannelState {
        private String status; // "gray", "green", "yellow", "orange", "red"
        private String memo;
        private Boolean moving; // 이동중 표시 여부
        // 용 레이드용 색상 상태: Map<용타입, 색상>
        private Map<String, String> dragonColors; // "흑" -> "gray", "진" -> "green" 등
        
        // 수화룡 레이드용 상태: Map<수화룡타입, 상태>
        private Map<String, HydraState> hydraStates; // "수룡" -> HydraState, "화룡" -> HydraState

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getMemo() {
            return memo;
        }

        public void setMemo(String memo) {
            this.memo = memo;
        }

        public Boolean getMoving() {
            return moving;
        }

        public void setMoving(Boolean moving) {
            this.moving = moving;
        }

        public Map<String, String> getDragonColors() {
            return dragonColors;
        }

        public void setDragonColors(Map<String, String> dragonColors) {
            this.dragonColors = dragonColors;
        }

        public Map<String, HydraState> getHydraStates() {
            return hydraStates;
        }

        public void setHydraStates(Map<String, HydraState> hydraStates) {
            this.hydraStates = hydraStates;
        }
    }

    /**
     * 수화룡 상태 내부 클래스
     */
    public static class HydraState {
        private String caughtTime; // 잡힌 시간 (ISO 8601 형식)
        private Long spawnTime; // 젠 예정 시간 (타임스탬프)
        private Integer spawnMinutes; // 젠 시간 설정 (분)

        public String getCaughtTime() {
            return caughtTime;
        }

        public void setCaughtTime(String caughtTime) {
            this.caughtTime = caughtTime;
        }

        public Long getSpawnTime() {
            return spawnTime;
        }

        public void setSpawnTime(Long spawnTime) {
            this.spawnTime = spawnTime;
        }

        public Integer getSpawnMinutes() {
            return spawnMinutes;
        }

        public void setSpawnMinutes(Integer spawnMinutes) {
            this.spawnMinutes = spawnMinutes;
        }
    }

    /**
     * 보스 상태 내부 클래스
     */
    public static class BossState {
        private Map<String, Map<String, BossCardState>> channelStates; // 채널ID -> 카드인덱스 -> 카드상태

        public Map<String, Map<String, BossCardState>> getChannelStates() {
            return channelStates;
        }

        public void setChannelStates(Map<String, Map<String, BossCardState>> channelStates) {
            this.channelStates = channelStates;
        }
    }

    /**
     * 보스 카드 상태
     */
    public static class BossCardState {
        private Boolean checked;
        private String color;
        private String memo;

        public Boolean getChecked() {
            return checked;
        }

        public void setChecked(Boolean checked) {
            this.checked = checked;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public String getMemo() {
            return memo;
        }

        public void setMemo(String memo) {
            this.memo = memo;
        }
    }
}
