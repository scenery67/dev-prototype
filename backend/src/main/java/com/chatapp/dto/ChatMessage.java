package com.chatapp.dto;

import java.util.List;

public class ChatMessage {
    private MessageType type;
    private String content;
    private String sender;
    private List<String> users; // 접속자 목록

    public enum MessageType {
        CHAT,
        JOIN,
        LEAVE,
        USER_LIST // 접속자 목록 업데이트 타입
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public List<String> getUsers() {
        return users;
    }

    public void setUsers(List<String> users) {
        this.users = users;
    }
}

