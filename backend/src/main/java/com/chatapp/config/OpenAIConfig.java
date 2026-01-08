package com.chatapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAI API 설정
 */
@Configuration
public class OpenAIConfig {
    
    @Value("${openai.api.key:}")
    private String apiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;
    
    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;
    
    @Value("${openai.enabled:false}")
    private boolean enabled;

    public String getApiKey() {
        return apiKey;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public String getModel() {
        return model;
    }

    public boolean isEnabled() {
        return enabled && apiKey != null && !apiKey.isEmpty();
    }
}

