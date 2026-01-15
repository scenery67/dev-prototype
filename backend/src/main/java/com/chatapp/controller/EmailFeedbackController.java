package com.chatapp.controller;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 이메일 피드백/문의사항 컨트롤러 (기존)
 * 로컬에서는 가능하나, Render 무료 서버를 사용하니까 SMTP 외부 서버 차단하여 사용 불가
 */
@RestController
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class EmailFeedbackController {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${feedback.recipient.email:4562sky@naver.com}")
    private String recipientEmail;

    @Value("${feedback.sender.email:feedback@dev-prototype.com}")
    private String senderEmail;

    @Value("${feedback.sender.name:Feedback}")
    private String senderName;

    @Value("${feedback.site.url:}")
    private String siteUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    /**
     * 피드백/문의사항 전송 API (이메일)
     */
    @PostMapping("/api/feedback/email")
    public ResponseEntity<Map<String, Object>> sendFeedback(@RequestBody FeedbackRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 이메일 전송 로직
            sendEmail(
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
     * 이메일 전송
     */
    private void sendEmail(String nickname, String email, String message) {
        // 로그 출력
        System.out.println("========================================");
        System.out.println("피드백/문의사항 수신");
        System.out.println("========================================");
        if (nickname != null && !nickname.isEmpty()) {
            System.out.println("닉네임: " + nickname);
        }
        System.out.println("이메일: " + email);
        System.out.println("내용:");
        System.out.println(message);
        System.out.println("========================================");
        
        // 실제 이메일 전송 (SMTP 설정이 되어 있는 경우)
        if (mailSender != null) {
            // 설정 확인 로그
            System.out.println("mailSender 존재: " + (mailSender != null));
            System.out.println("mailUsername: " + (mailUsername != null && !mailUsername.isEmpty() ? mailUsername : "비어있음"));
            System.out.println("mailPassword: " + (mailPassword != null && !mailPassword.isEmpty() ? "설정됨 (길이: " + mailPassword.length() + ")" : "비어있음"));
            
            if (mailUsername != null && !mailUsername.isEmpty() 
                && mailPassword != null && !mailPassword.isEmpty()) {
                try {
                    MimeMessage mimeMessage = mailSender.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                    
                    // 이메일 주소만 사용 (이름 제거)
                    helper.setFrom(senderEmail);
                    
                    helper.setTo(recipientEmail);
                    helper.setSubject("[피드백/문의사항] 새로운 문의가 접수되었습니다");
                    
                    StringBuilder emailContent = new StringBuilder();
                    emailContent.append("<h2>피드백/문의사항</h2>");
                    emailContent.append("<hr>");
                    if (nickname != null && !nickname.isEmpty()) {
                        emailContent.append("<p><strong>닉네임:</strong> ").append(nickname).append("</p>");
                    }
                    emailContent.append("<p><strong>이메일:</strong> ").append(email).append("</p>");
                    emailContent.append("<p><strong>내용:</strong></p>");
                    emailContent.append("<div style='background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;'>");
                    emailContent.append(message.replace("\n", "<br>"));
                    emailContent.append("</div>");
                    
                    // 사이트 바로가기 링크 추가
                    if (siteUrl != null && !siteUrl.isEmpty()) {
                        emailContent.append("<hr>");
                        emailContent.append("<p style='text-align: center; margin-top: 20px;'>");
                        emailContent.append("<a href='").append(siteUrl).append("' style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>사이트 바로가기</a>");
                        emailContent.append("</p>");
                    }
                    
                    helper.setText(emailContent.toString(), true);
                    
                    mailSender.send(mimeMessage);
                    System.out.println("이메일 전송 성공: " + recipientEmail);
                } catch (MessagingException e) {
                    System.err.println("========================================");
                    System.err.println("이메일 전송 실패");
                    System.err.println("========================================");
                    System.err.println("오류 메시지: " + e.getMessage());
                    if (e.getCause() != null) {
                        System.err.println("원인: " + e.getCause().getMessage());
                    }
                    System.err.println("========================================");
                    e.printStackTrace();
                    // 이메일 전송 실패해도 로그는 남아있으므로 계속 진행
                } catch (Exception e) {
                    System.err.println("========================================");
                    System.err.println("이메일 전송 중 오류 발생");
                    System.err.println("========================================");
                    System.err.println("오류 메시지: " + e.getMessage());
                    if (e.getCause() != null) {
                        System.err.println("원인: " + e.getCause().getMessage());
                    }
                    System.err.println("========================================");
                    e.printStackTrace();
                }
            } else {
                System.out.println("이메일 전송 스킵: MAIL_USERNAME 또는 MAIL_PASSWORD가 설정되지 않았습니다.");
            }
        } else {
            System.out.println("이메일 전송 스킵: JavaMailSender 빈이 생성되지 않았습니다. spring.mail 설정을 확인해주세요.");
        }
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
