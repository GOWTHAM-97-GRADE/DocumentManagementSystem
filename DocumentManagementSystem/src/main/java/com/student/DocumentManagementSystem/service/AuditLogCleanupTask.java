package com.student.DocumentManagementSystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AuditLogCleanupTask {

    @Autowired
    private AuditLogService auditLogService;

    @Scheduled(cron = "0 0 0 * * ?") // Run daily at midnight
    public void cleanupOldLogs() {
        auditLogService.deleteOldLogs(30); // Delete logs older than 30 days
    }
}