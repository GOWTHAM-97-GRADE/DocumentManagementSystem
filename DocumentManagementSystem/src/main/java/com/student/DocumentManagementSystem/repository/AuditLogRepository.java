package com.student.DocumentManagementSystem.repository;

import com.student.DocumentManagementSystem.models.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {
    void deleteByTimestampBefore(LocalDateTime threshold);
}