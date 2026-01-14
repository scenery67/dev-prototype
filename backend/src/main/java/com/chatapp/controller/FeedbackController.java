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
 * 피드백/문의사항 컨트롤러
 */
@RestController
@CrossOrigin(origins = "${cors.allowed-origins:*}")
public class FeedbackController {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${feedback.recipient.email:4562sky@naver.com}")
    private String recipientEmail;

    @Value("${feedback.sender.email:feedback@dev-prototype.com}")
    private String senderEmail;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    /**
     * 피드백/문의사항 전송 API
     */
    @PostMapping("/api/feedback")
    public ResponseEntity<Map<String, Object>> sendFeedback(@RequestBody FeedbackRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 이메일 전송 로직
            sendEmail(
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
    private void sendEmail(String email, String message) {
        // 로그 출력
        System.out.println("========================================");
        System.out.println("피드백/문의사항 수신");
        System.out.println("========================================");
        System.out.println("이메일: " + email);
        System.out.println("내용:");
        System.out.println(message);
        System.out.println("========================================");
        
        // 실제 이메일 전송 (SMTP 설정이 되어 있는 경우)
        if (mailSender != null) {
            // 설정 확인 로그
            System.out.println("mailSender 존재: " + (mailSender != null));
            System.out.println("mailUsername: " + (mailUsername != null && !mailUsername.isEmpty() ? "설정됨" : "비어있음"));
            System.out.println("mailPassword: " + (mailPassword != null && !mailPassword.isEmpty() ? "설정됨" : "비어있음"));
            
            if (mailUsername != null && !mailUsername.isEmpty() 
                && mailPassword != null && !mailPassword.isEmpty()) {
                try {
                    MimeMessage mimeMessage = mailSender.createMimeMessage();
                    MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                    
                    helper.setFrom(senderEmail);
                    helper.setTo(recipientEmail);
                    helper.setSubject("[피드백/문의사항] 새로운 문의가 접수되었습니다");
                    
                    StringBuilder emailContent = new StringBuilder();
                    emailContent.append("<h2>피드백/문의사항</h2>");
                    emailContent.append("<hr>");
                    emailContent.append("<p><strong>이메일:</strong> ").append(email).append("</p>");
                    emailContent.append("<p><strong>내용:</strong></p>");
                    emailContent.append("<div style='background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;'>");
                    emailContent.append(message.replace("\n", "<br>"));
                    emailContent.append("</div>");
                    
                    helper.setText(emailContent.toString(), true);
                    
                    mailSender.send(mimeMessage);
                    System.out.println("이메일 전송 성공: " + recipientEmail);
                } catch (MessagingException e) {
                    System.err.println("이메일 전송 실패: " + e.getMessage());
                    e.printStackTrace();
                    // 이메일 전송 실패해도 로그는 남아있으므로 계속 진행
                } catch (Exception e) {
                    System.err.println("이메일 전송 중 오류 발생: " + e.getMessage());
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
        private String email;
        private String message;

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
