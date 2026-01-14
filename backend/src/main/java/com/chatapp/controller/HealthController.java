package com.chatapp.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 서버 상태 체크 컨트롤러
 * 헬스체크 및 서버 상태 확인용 API
 */
@RestController
public class HealthController {

    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);

    /**
     * 서버 상태 체크 API
     * @param request HTTP 요청 정보
     * @return 서버 상태 정보
     */
    @GetMapping("/api/health")
    @CrossOrigin(origins = "${cors.allowed-origins:*}")
    public ResponseEntity<Map<String, Object>> health(HttpServletRequest request) {
        // 요청자 정보 로깅
        String clientIp = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");
        
        logger.info("Health check request - IP: {}, Origin: {}, Referer: {}, User-Agent: {}", 
            clientIp, origin, referer, userAgent);
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Server is running");
        return ResponseEntity.ok(response);
    }

    /**
     * 클라이언트 IP 주소 추출
     * 프록시나 로드밸런서를 통한 요청도 처리
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
}
