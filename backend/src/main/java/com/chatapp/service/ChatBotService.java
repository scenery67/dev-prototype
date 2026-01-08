package com.chatapp.service;

import com.chatapp.dto.ChatMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * 챗봇 서비스
 * 챗봇 응답 생성 및 대화 처리
 */
@Service
public class ChatBotService {

    private static final String BOT_NAME = "챗봇";
    private final Map<String, String> responses = new HashMap<>();
    private final Random random = new Random();
    private final GPTService gptService;
    
    // 사용자별 대화 히스토리 관리 (사용자 이름 -> 대화 히스토리)
    private final Map<String, List<Map<String, String>>> conversationHistory = new HashMap<>();

    public ChatBotService(GPTService gptService) {
        this.gptService = gptService;
        initializeResponses();
    }

    /**
     * 챗봇 응답 초기화
     */
    private void initializeResponses() {
        // 인사말
        responses.put("안녕", "안녕하세요! 무엇을 도와드릴까요?");
        responses.put("hello", "Hello! How can I help you?");
        responses.put("hi", "Hi there!");
        
        // 시간 관련
        responses.put("시간", "현재 시간은 " + java.time.LocalTime.now().toString() + "입니다.");
        responses.put("몇시", "현재 시간은 " + java.time.LocalTime.now().toString() + "입니다.");
        
        // 날씨 관련
        responses.put("날씨", "죄송하지만 날씨 정보는 제공하지 않습니다.");
        
        // 도움말
        responses.put("도움말", "사용 가능한 명령어: /bot (챗봇 소환), /help (도움말)");
        responses.put("help", "Available commands: /bot (summon bot), /help (help)");
    }

    /**
     * 챗봇 소환 처리
     * @param userMessage 사용자 메시지
     * @return 챗봇 응답 메시지
     */
    public ChatMessage summonBot(String userMessage) {
        ChatMessage botMessage = new ChatMessage();
        botMessage.setType(ChatMessage.MessageType.BOT);
        botMessage.setSender(BOT_NAME);
        
        String cleanMessage = removeBotPrefix(userMessage);
        if (cleanMessage.isEmpty() || cleanMessage.equals("/bot") || cleanMessage.equals("/챗봇") || cleanMessage.equals("/봇")) {
            botMessage.setContent("안녕하세요! 저는 챗봇입니다. 무엇을 도와드릴까요? (메시지 앞에 '.'을 붙이면 저에게 말할 수 있어요!)");
        } else {
            // 메시지가 있으면 바로 응답 (username은 null로 전달 - 소환 시에는 히스토리 불필요)
            return generateResponse(cleanMessage, null);
        }
        return botMessage;
    }

    /**
     * 챗봇 응답 생성
     * @param userMessage 사용자 메시지
     * @param username 사용자 이름 (대화 히스토리 관리용)
     * @return 챗봇 응답 메시지
     */
    public ChatMessage generateResponse(String userMessage, String username) {
        ChatMessage botMessage = new ChatMessage();
        botMessage.setType(ChatMessage.MessageType.BOT);
        botMessage.setSender(BOT_NAME);
        
        if (userMessage == null || userMessage.trim().isEmpty()) {
            botMessage.setContent("무엇을 도와드릴까요?");
            return botMessage;
        }
        
        // GPT가 활성화되어 있고 username이 있으면 GPT 사용
        if (username != null && gptService != null) {
            try {
                String gptResponse = gptService.getGPTResponse(userMessage, getConversationHistory(username));
                if (gptResponse != null && !gptResponse.trim().isEmpty()) {
                    // GPT 응답 사용
                    botMessage.setContent(gptResponse);
                    // 대화 히스토리 업데이트
                    updateConversationHistory(username, userMessage, gptResponse);
                    System.out.println("GPT 응답 성공: " + gptResponse.substring(0, Math.min(50, gptResponse.length())));
                    return botMessage;
                } else {
                    System.out.println("GPT 응답이 null이거나 비어있음. 키워드 기반 응답으로 fallback");
                }
            } catch (Exception e) {
                System.err.println("GPT 호출 중 오류 발생: " + e.getMessage());
                e.printStackTrace();
                
                // 특정 오류에 대한 사용자 친화적 메시지
                String errorMessage = e.getMessage();
                if (errorMessage != null) {
                    if (errorMessage.contains("할당량 부족") || errorMessage.contains("insufficient_quota") || errorMessage.contains("quota")) {
                        botMessage.setContent("죄송합니다. 현재 GPT 서비스의 사용 할당량이 부족합니다. 관리자에게 문의해주세요. (키워드 기반 응답으로 전환됩니다)");
                        return botMessage;
                    } else if (errorMessage.contains("429") || errorMessage.contains("요청 한도")) {
                        botMessage.setContent("죄송합니다. 현재 요청이 너무 많아서 일시적으로 응답할 수 없습니다. 잠시 후 다시 시도해주세요. (키워드 기반 응답으로 전환됩니다)");
                        return botMessage;
                    } else if (errorMessage.contains("401")) {
                        botMessage.setContent("API 키 설정에 문제가 있습니다. 관리자에게 문의해주세요.");
                        return botMessage;
                    }
                }
                // 기타 오류는 키워드 기반 응답으로 fallback
            }
        } else {
            if (username == null) {
                System.out.println("username이 null이므로 GPT 사용 불가");
            }
            if (gptService == null) {
                System.out.println("GPTService가 null입니다");
            }
        }
        
        // GPT가 비활성화되어 있으면 기존 키워드 기반 응답 사용
        String lowerMessage = userMessage.toLowerCase().trim();
        
        // 직접 매칭되는 응답이 있는지 확인
        String response = responses.get(lowerMessage);
        if (response != null) {
            botMessage.setContent(response);
            return botMessage;
        }
        
        // 키워드 기반 응답 (더 많은 패턴 추가)
        if (lowerMessage.contains("안녕") || lowerMessage.contains("hello") || lowerMessage.contains("hi") || lowerMessage.contains("헬로")) {
            botMessage.setContent("안녕하세요! 무엇을 도와드릴까요?");
        } else if (lowerMessage.contains("시간") || lowerMessage.contains("몇시") || lowerMessage.contains("지금")) {
            java.time.LocalTime now = java.time.LocalTime.now();
            botMessage.setContent("현재 시간은 " + String.format("%02d시 %02d분", now.getHour(), now.getMinute()) + "입니다.");
        } else if (lowerMessage.contains("날짜") || lowerMessage.contains("오늘")) {
            java.time.LocalDate today = java.time.LocalDate.now();
            botMessage.setContent("오늘은 " + today.getYear() + "년 " + today.getMonthValue() + "월 " + today.getDayOfMonth() + "일입니다.");
        } else if (lowerMessage.contains("날씨")) {
            botMessage.setContent("죄송하지만 날씨 정보는 제공하지 않습니다.");
        } else if (lowerMessage.contains("이름") || lowerMessage.contains("누구")) {
            botMessage.setContent("저는 " + BOT_NAME + "입니다! 반갑습니다!");
        } else if (lowerMessage.contains("도움") || lowerMessage.contains("help") || lowerMessage.contains("명령어")) {
            botMessage.setContent("메시지 앞에 '.'을 붙이면 저에게 말할 수 있어요! 예: .안녕, .시간 알려줘");
        } else if (lowerMessage.contains("고마워") || lowerMessage.contains("감사") || lowerMessage.contains("thanks") || lowerMessage.contains("thank")) {
            botMessage.setContent("천만에요! 언제든지 도와드리겠습니다.");
        } else if (lowerMessage.contains("잘가") || lowerMessage.contains("bye") || lowerMessage.contains("안녕히")) {
            botMessage.setContent("안녕히 가세요! 또 만나요!");
        } else if (lowerMessage.contains("뭐") || lowerMessage.contains("무엇") || lowerMessage.contains("what")) {
            botMessage.setContent("무엇을 도와드릴까요? 구체적으로 질문해주시면 더 잘 도와드릴 수 있어요!");
        } else if (lowerMessage.contains("어떻게") || lowerMessage.contains("how")) {
            botMessage.setContent("어떤 도움이 필요하신지 더 자세히 알려주시면 좋겠어요!");
        } else if (lowerMessage.contains("왜") || lowerMessage.contains("why")) {
            botMessage.setContent("좋은 질문이네요! 더 구체적으로 설명해주시면 답변해드릴 수 있어요.");
        } else if (lowerMessage.contains("어디") || lowerMessage.contains("where")) {
            botMessage.setContent("어디에 대해 궁금하신가요?");
        } else {
            // 기본 응답 (더 다양하게)
            String[] defaultResponses = {
                "흥미로운 말씀이네요! 더 자세히 설명해주실 수 있나요?",
                "그렇군요. 다른 질문이 있으신가요?",
                "이해했습니다. 다른 도움이 필요하신가요?",
                "좋은 질문이네요! 더 구체적으로 말씀해주시면 도와드리겠습니다.",
                "제가 이해한 바로는... 더 구체적인 정보가 필요할 것 같아요.",
                "그건 흥미롭네요! 다른 것도 궁금하신가요?",
                "알겠습니다. 다른 도움이 필요하시면 언제든지 말씀해주세요!"
            };
            botMessage.setContent(defaultResponses[random.nextInt(defaultResponses.length)]);
        }
        
        return botMessage;
    }

    /**
     * 챗봇 명령어인지 확인
     * @param message 메시지
     * @return 챗봇 명령어 여부
     */
    public boolean isBotCommand(String message) {
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        String trimmed = message.trim();
        // "."으로 시작하면 챗봇에게 보내는 메시지
        return trimmed.startsWith(".");
    }

    /**
     * 챗봇에게 보내는 메시지인지 확인
     * @param message 메시지
     * @return 챗봇에게 보내는 메시지 여부
     */
    public boolean isTalkingToBot(String message) {
        return isBotCommand(message);
    }

    /**
     * 챗봇 메시지에서 "." 제거
     * @param message 원본 메시지
     * @return "." 제거된 메시지
     */
    public String removeBotPrefix(String message) {
        if (message == null || message.trim().isEmpty()) {
            return message;
        }
        String trimmed = message.trim();
        if (trimmed.startsWith(".")) {
            return trimmed.substring(1).trim();
        }
        return trimmed;
    }

    /**
     * 사용자별 대화 히스토리 조회
     * @param username 사용자 이름
     * @return 대화 히스토리
     */
    private List<Map<String, String>> getConversationHistory(String username) {
        return conversationHistory.getOrDefault(username, new ArrayList<>());
    }

    /**
     * 대화 히스토리 업데이트
     * @param username 사용자 이름
     * @param userMessage 사용자 메시지
     * @param botResponse 챗봇 응답
     */
    private void updateConversationHistory(String username, String userMessage, String botResponse) {
        List<Map<String, String>> history = conversationHistory.computeIfAbsent(username, k -> new ArrayList<>());
        
        // 사용자 메시지 추가
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        history.add(userMsg);
        
        // 챗봇 응답 추가
        Map<String, String> botMsg = new HashMap<>();
        botMsg.put("role", "assistant");
        botMsg.put("content", botResponse);
        history.add(botMsg);
        
        // 히스토리 길이 제한 (최근 10개 대화만 유지)
        if (history.size() > 20) { // user + assistant = 2개씩이므로 10개 대화
            history.remove(0);
            history.remove(0);
        }
    }

    /**
     * 사용자 대화 히스토리 초기화
     * @param username 사용자 이름
     */
    public void clearConversationHistory(String username) {
        conversationHistory.remove(username);
    }
}

