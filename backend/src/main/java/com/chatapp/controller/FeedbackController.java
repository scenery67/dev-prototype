package com.chatapp.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 피드백/문의사항 컨트롤러 (Webhook 방식)
 * Slack/Discord Webhook을 통한 실시간 알림
 * Render 무료 서버에서도 SMTP 포트 차단 없이 사용 가능
 */
@RestController
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class FeedbackController {

    @Value("${feedback.webhook.url:}")
    private String webhookUrl;

    @Value("${feedback.site.url:}")
    private String siteUrl;

    @Value("${feedback.rate.limit.max:3}")
    private int rateLimitMax; // 일정 시간 내 최대 요청 수

    @Value("${feedback.rate.limit.window:300}")
    private int rateLimitWindowSeconds; // 제한 시간 (초)

    private final WebClient webClient;
    
    // IP별 요청 시간 기록 (스레드 안전)
    private final Map<String, List<Long>> requestHistory = new ConcurrentHashMap<>();

    public FeedbackController() {
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    /**
     * 피드백/문의사항 전송 API
     */
    @PostMapping("/api/feedback")
    public ResponseEntity<Map<String, Object>> sendFeedback(
            @RequestBody FeedbackRequest request,
            HttpServletRequest httpRequest) {
        Map<String, Object> response = new HashMap<>();
        
        // IP 주소 추출
        String clientIp = getClientIpAddress(httpRequest);
        
        // Rate limiting 체크
        RateLimitResult rateLimitResult = checkRateLimit(clientIp);
        if (!rateLimitResult.isAllowed()) {
            response.put("success", false);
            if (rateLimitResult.getRemainingSeconds() > 0) {
                long remainingMinutes = rateLimitResult.getRemainingSeconds() / 60;
                long remainingSecs = rateLimitResult.getRemainingSeconds() % 60;
                if (remainingMinutes > 0) {
                    response.put("message", String.format("요청이 너무 많습니다. %d분 %d초 후 다시 시도해주세요.", remainingMinutes, remainingSecs));
                } else {
                    response.put("message", String.format("요청이 너무 많습니다. %d초 후 다시 시도해주세요.", remainingSecs));
                }
            } else {
                response.put("message", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
            }
            return ResponseEntity.status(429).body(response); // 429 Too Many Requests
        }
        
        try {
            // 로그 출력
            logFeedback(request, clientIp);
            
            // Webhook 전송 (비동기로 처리 - 사용자 응답을 기다리지 않음)
            sendWebhookAsync(
                request.getNickname(),
                request.getEmail() != null && !request.getEmail().isEmpty() ? request.getEmail() : "이메일 미제공",
                request.getMessage()
            );
            
            // 로그는 이미 남아있으므로, Webhook 전송 여부와 관계없이 성공으로 처리
            response.put("success", true);
            response.put("message", "피드백이 성공적으로 전송되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "피드백 전송 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 클라이언트 IP 주소 추출
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For는 여러 IP가 있을 수 있으므로 첫 번째 IP만 사용
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * Rate limiting 체크
     * @param clientIp 클라이언트 IP 주소
     * @return RateLimitResult: 요청 허용 여부와 남은 시간 정보
     */
    private RateLimitResult checkRateLimit(String clientIp) {
        long currentTime = System.currentTimeMillis();
        long windowStart = currentTime - (rateLimitWindowSeconds * 1000L);
        
        // 해당 IP의 요청 기록 가져오기
        List<Long> requests = requestHistory.computeIfAbsent(clientIp, k -> new ArrayList<>());
        
        // 오래된 요청 기록 제거 (현재 시간 - 제한 시간 이전의 기록)
        requests.removeIf(time -> time < windowStart);
        
        // 요청 수가 제한을 초과하면 차단
        if (requests.size() >= rateLimitMax) {
            // 가장 오래된 요청이 언제 제거될지 계산 (남은 시간)
            long oldestRequestTime = requests.isEmpty() ? currentTime : Collections.min(requests);
            long remainingSeconds = rateLimitWindowSeconds - ((currentTime - oldestRequestTime) / 1000);
            
            System.out.println("Rate limit 초과: IP=" + clientIp + ", 요청 수=" + requests.size() + "/" + rateLimitMax + ", 남은 시간=" + remainingSeconds + "초");
            return new RateLimitResult(false, remainingSeconds);
        }
        
        // 현재 요청 시간 기록
        requests.add(currentTime);
        
        return new RateLimitResult(true, 0);
    }

    /**
     * Rate limiting 결과 클래스
     */
    private static class RateLimitResult {
        private final boolean allowed;
        private final long remainingSeconds;

        public RateLimitResult(boolean allowed, long remainingSeconds) {
            this.allowed = allowed;
            this.remainingSeconds = remainingSeconds;
        }

        public boolean isAllowed() {
            return allowed;
        }

        public long getRemainingSeconds() {
            return remainingSeconds;
        }
    }

    /**
     * 피드백 로그 출력
     */
    private void logFeedback(FeedbackRequest request, String clientIp) {
        System.out.println("========================================");
        System.out.println("피드백/문의사항 수신");
        System.out.println("========================================");
        System.out.println("IP: " + clientIp);
        if (request.getNickname() != null && !request.getNickname().isEmpty()) {
            System.out.println("닉네임: " + request.getNickname());
        }
        System.out.println("이메일: " + (request.getEmail() != null && !request.getEmail().isEmpty() ? request.getEmail() : "이메일 미제공"));
        System.out.println("내용:");
        System.out.println(request.getMessage());
        System.out.println("========================================");
    }

    /**
     * Webhook 전송 (비동기 - 사용자 응답을 기다리지 않음)
     */
    private void sendWebhookAsync(String nickname, String email, String message) {
        // 비동기로 실행 (별도 스레드에서 처리)
        CompletableFuture.runAsync(() -> {
            try {
                sendWebhook(nickname, email, message);
            } catch (Exception e) {
                System.err.println("비동기 Webhook 전송 중 예외 발생: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }

    /**
     * Webhook 전송 (Slack/Discord)
     */
    private void sendWebhook(String nickname, String email, String message) {
        if (webhookUrl == null || webhookUrl.isEmpty()) {
            System.out.println("Webhook 전송 스킵: WEBHOOK_URL이 설정되지 않았습니다.");
            return;
        }

        try {
            // Slack/Discord Webhook 메시지 포맷 구성
            Map<String, Object> payload = new HashMap<>();
            
            // Discord Webhook 형식
            if (webhookUrl.contains("discord.com") || webhookUrl.contains("discordapp.com")) {
                payload = createDiscordPayload(nickname, email, message);
            } 
            // Slack Webhook 형식
            else if (webhookUrl.contains("slack.com")) {
                payload = createSlackPayload(nickname, email, message);
            }
            // 기본 형식 (Discord 호환)
            else {
                payload = createDiscordPayload(nickname, email, message);
            }

            // Webhook 전송 (타임아웃 30초로 증가)
            webClient.post()
                    .uri(webhookUrl)
                    .header("Content-Type", "application/json")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30)) // 10초 -> 30초로 증가
                    .block();

            System.out.println("Webhook 전송 성공: " + webhookUrl);
        } catch (Exception e) {
            System.err.println("========================================");
            System.err.println("Webhook 전송 실패");
            System.err.println("========================================");
            System.err.println("오류 메시지: " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("원인: " + e.getCause().getMessage());
            }
            System.err.println("========================================");
            e.printStackTrace();
            // Webhook 전송 실패해도 로그는 남아있으므로 계속 진행
        }
    }

    /**
     * Discord Webhook 메시지 포맷 생성
     */
    private Map<String, Object> createDiscordPayload(String nickname, String email, String message) {
        Map<String, Object> payload = new HashMap<>();
        
        // Discord embeds 형식
        Map<String, Object> embed = new HashMap<>();
        embed.put("title", "🔔 새로운 피드백/문의사항");
        embed.put("color", 3447003); // 파란색
        
        StringBuilder description = new StringBuilder();
        if (nickname != null && !nickname.isEmpty()) {
            description.append("**닉네임:** ").append(nickname).append("\n");
        }
        description.append("**이메일:** ").append(email).append("\n\n");
        description.append("**내용:**\n```\n").append(message).append("\n```");
        
        embed.put("description", description.toString());
        embed.put("timestamp", java.time.Instant.now().toString());
        
        // 사이트 링크 추가
        if (siteUrl != null && !siteUrl.isEmpty()) {
            Map<String, Object> footer = new HashMap<>();
            footer.put("text", "사이트 바로가기");
            embed.put("footer", footer);
        }

        payload.put("embeds", new Object[]{embed});
        
        return payload;
    }

    /**
     * Slack Webhook 메시지 포맷 생성
     */
    private Map<String, Object> createSlackPayload(String nickname, String email, String message) {
        Map<String, Object> payload = new HashMap<>();
        
        StringBuilder text = new StringBuilder();
        text.append("*새로운 피드백/문의사항이 접수되었습니다*\n\n");
        
        if (nickname != null && !nickname.isEmpty()) {
            text.append("*닉네임:* ").append(nickname).append("\n");
        }
        text.append("*이메일:* ").append(email).append("\n\n");
        text.append("*내용:*\n```\n").append(message).append("\n```");
        
        if (siteUrl != null && !siteUrl.isEmpty()) {
            text.append("\n\n<").append(siteUrl).append("|사이트 바로가기>");
        }
        
        payload.put("text", text.toString());
        
        return payload;
    }

    /**
     * 피드백 요청 DTO
     */
    public static class FeedbackRequest {
        private String nickname;
        private String email;
        private String message;

        public String getNickname() {
            return nickname;
        }

        public void setNickname(String nickname) {
            this.nickname = nickname;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
