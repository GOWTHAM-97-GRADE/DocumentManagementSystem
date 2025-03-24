package com.student.DocumentManagementSystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private LocalDateTime timestamp;
    private Long userId;
    private String username;
    private String operation;
    private String entityType;
    private String entityId;
    private String details;
}