package com.chatapp.controller;

import org.springframework.http.ResponseEntity;
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

    /**
     * 서버 상태 체크 API
     * @return 서버 상태 정보
     */
    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Server is running");
        return ResponseEntity.ok(response);
    }
}
