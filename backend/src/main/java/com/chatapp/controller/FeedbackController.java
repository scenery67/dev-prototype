package com.chatapp.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

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

    private final WebClient webClient;

    public FeedbackController() {
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }

    /**
     * 피드백/문의사항 전송 API
     */
    @PostMapping("/api/feedback")
    public ResponseEntity<Map<String, Object>> sendFeedback(@RequestBody FeedbackRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 로그 출력
            logFeedback(request);
            
            // Webhook 전송
            sendWebhook(
                request.getNickname(),
                request.getEmail() != null && !request.getEmail().isEmpty() ? request.getEmail() : "이메일 미제공",
                request.getMessage()
            );
            
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
     * 피드백 로그 출력
     */
    private void logFeedback(FeedbackRequest request) {
        System.out.println("========================================");
        System.out.println("피드백/문의사항 수신");
        System.out.println("========================================");
        if (request.getNickname() != null && !request.getNickname().isEmpty()) {
            System.out.println("닉네임: " + request.getNickname());
        }
        System.out.println("이메일: " + (request.getEmail() != null && !request.getEmail().isEmpty() ? request.getEmail() : "이메일 미제공"));
        System.out.println("내용:");
        System.out.println(request.getMessage());
        System.out.println("========================================");
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

            // Webhook 전송
            webClient.post()
                    .uri(webhookUrl)
                    .header("Content-Type", "application/json")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
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
