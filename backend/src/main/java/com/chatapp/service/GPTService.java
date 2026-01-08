package com.chatapp.service;

import com.chatapp.config.OpenAIConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * GPT 서비스
 * OpenAI API를 통한 대화 생성
 */
@Service
public class GPTService {

    private final OpenAIConfig openAIConfig;
    private final ObjectMapper objectMapper;

    public GPTService(OpenAIConfig openAIConfig) {
        this.openAIConfig = openAIConfig;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * GPT에게 메시지 전송 및 응답 받기
     * @param userMessage 사용자 메시지
     * @param conversationHistory 대화 히스토리 (선택적)
     * @return GPT 응답
     */
    public String getGPTResponse(String userMessage, List<Map<String, String>> conversationHistory) {
        if (!openAIConfig.isEnabled()) {
            System.out.println("GPT is disabled. Check openai.enabled in application.properties");
            return null; // GPT가 비활성화되어 있으면 null 반환
        }

        try {
            // 메시지 리스트 구성
            List<Map<String, String>> messages = new ArrayList<>();
            
            // 시스템 메시지 추가
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are a helpful and friendly chatbot. Respond in Korean. Keep responses concise and natural.");
            messages.add(systemMessage);
            
            // 대화 히스토리 추가 (있는 경우)
            if (conversationHistory != null && !conversationHistory.isEmpty()) {
                messages.addAll(conversationHistory);
            }
            
            // 사용자 메시지 추가
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);
            messages.add(userMsg);
            
            // 요청 본문 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", openAIConfig.getModel());
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 500);
            
            // API 호출 (HttpURLConnection 사용)
            String requestBodyJson = objectMapper.writeValueAsString(requestBody);
            String response = callOpenAIAPI(requestBodyJson);
            
            // 응답 파싱
            if (response != null) {
                JsonNode jsonNode = objectMapper.readTree(response);
                JsonNode choices = jsonNode.get("choices");
                if (choices != null && choices.isArray() && choices.size() > 0) {
                    JsonNode message = choices.get(0).get("message");
                    if (message != null) {
                        JsonNode content = message.get("content");
                        if (content != null) {
                            return content.asText();
                        }
                    }
                }
            }
            
            System.out.println("GPT API 응답 파싱 실패: " + response);
            return "죄송합니다. 응답을 생성하는데 문제가 발생했습니다.";
            
        } catch (Exception e) {
            System.err.println("GPT API 호출 오류: " + e.getMessage());
            e.printStackTrace();
            return null; // 에러 발생 시 null 반환하여 키워드 기반 응답으로 fallback
        }
    }

    /**
     * OpenAI API 호출 (HttpURLConnection 사용)
     * 429 오류 시 재시도 로직 포함
     */
    private String callOpenAIAPI(String requestBodyJson) throws Exception {
        int maxRetries = 3;
        int retryDelay = 2000; // 2초
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            URL url = new URL(openAIConfig.getApiUrl());
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            try {
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Authorization", "Bearer " + openAIConfig.getApiKey());
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                connection.setConnectTimeout(30000);
                connection.setReadTimeout(30000);
                
                // 요청 본문 전송
                try (OutputStreamWriter writer = new OutputStreamWriter(connection.getOutputStream(), StandardCharsets.UTF_8)) {
                    writer.write(requestBodyJson);
                    writer.flush();
                }
                
                // 응답 읽기
                int responseCode = connection.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                        StringBuilder response = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            response.append(line);
                        }
                        return response.toString();
                    }
                } else if (responseCode == 429) {
                    // 429 오류 응답 읽기
                    StringBuilder errorResponse = new StringBuilder();
                    if (connection.getErrorStream() != null) {
                        try (BufferedReader reader = new BufferedReader(
                                new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8))) {
                            String line;
                            while ((line = reader.readLine()) != null) {
                                errorResponse.append(line);
                            }
                        }
                    }
                    
                    // insufficient_quota인 경우 재시도하지 않음
                    String errorStr = errorResponse.toString();
                    if (errorStr.contains("insufficient_quota") || errorStr.contains("quota")) {
                        throw new Exception("OpenAI API 할당량 부족: 계정의 사용 가능한 크레딧이 부족합니다. OpenAI 대시보드에서 결제 정보를 확인해주세요.");
                    }
                    
                    // rate limit인 경우에만 재시도
                    if (attempt < maxRetries) {
                        System.out.println("OpenAI API 429 오류 발생 (Rate Limit). " + retryDelay + "ms 후 재시도 (" + attempt + "/" + maxRetries + ")");
                        try {
                            Thread.sleep(retryDelay);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            throw new Exception("재시도 중단됨");
                        }
                        retryDelay *= 2; // 지수 백오프
                        continue;
                    } else {
                        throw new Exception("OpenAI API 요청 한도 초과: 너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.");
                    }
                } else {
                    // 에러 응답 읽기
                    StringBuilder errorResponse = new StringBuilder();
                    if (connection.getErrorStream() != null) {
                        try (BufferedReader reader = new BufferedReader(
                                new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8))) {
                            String line;
                            while ((line = reader.readLine()) != null) {
                                errorResponse.append(line);
                            }
                        }
                    }
                    
                    String errorMsg = "OpenAI API 오류 (코드: " + responseCode + ")";
                    if (responseCode == 429) {
                        errorMsg += ": 요청 한도 초과. 잠시 후 다시 시도해주세요.";
                    } else if (responseCode == 401) {
                        errorMsg += ": API 키가 유효하지 않습니다.";
                    } else if (responseCode == 500) {
                        errorMsg += ": OpenAI 서버 오류입니다.";
                    }
                    
                    System.err.println(errorMsg + " 응답: " + errorResponse.toString());
                    throw new Exception(errorMsg);
                }
            } finally {
                connection.disconnect();
            }
        }
        
        throw new Exception("최대 재시도 횟수 초과");
    }

    /**
     * 간단한 메시지 전송 (히스토리 없음)
     * @param userMessage 사용자 메시지
     * @return GPT 응답
     */
    public String getGPTResponse(String userMessage) {
        return getGPTResponse(userMessage, null);
    }
}

