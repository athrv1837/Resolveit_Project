package com.resolveit.resloveitbackend.dto;

import java.time.LocalDateTime;

public class ReplyDto {
    private Long id;
    private String content;
    private String createdBy;
    private LocalDateTime createdAt;
    private boolean isAdminReply;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isAdminReply() { return isAdminReply; }
    public void setAdminReply(boolean adminReply) { isAdminReply = adminReply; }
}