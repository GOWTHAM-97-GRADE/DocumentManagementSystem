package com.student.DocumentManagementSystem.models;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(nullable = false)
    private String operation; // e.g., CREATE, RENAME, MOVE, DELETE, COMMENT, UPDATE

    @Column(name = "entity_type", nullable = false)
    private String entityType; // e.g., DIRECTORY, FILE

    @Column(name = "entity_id", nullable = false)
    private String entityId; // Stored as String to handle both Long and UUID

    @Column(columnDefinition = "TEXT")
    private String details;
}