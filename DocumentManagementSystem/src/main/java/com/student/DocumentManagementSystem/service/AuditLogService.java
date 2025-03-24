package com.student.DocumentManagementSystem.service;

import com.student.DocumentManagementSystem.models.AuditLog;
import com.student.DocumentManagementSystem.payload.response.AuditLogResponse;
import com.student.DocumentManagementSystem.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void log(String operation, String entityType, String entityId, Long userId, String username, String details) {
        AuditLog log = new AuditLog();
        log.setTimestamp(LocalDateTime.now());
        log.setUserId(userId);
        log.setUsername(username);
        log.setOperation(operation);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    @Transactional
    public void deleteOldLogs(int days) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(days);
        auditLogRepository.deleteByTimestampBefore(threshold);
    }

    public List<AuditLogResponse> getAuditLogs(Long userId, String operation, String entityType, LocalDateTime startDate, LocalDateTime endDate) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (operation != null) {
                predicates.add(cb.equal(root.get("operation"), operation));
            }
            if (entityType != null) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), endDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<AuditLog> logs = auditLogRepository.findAll(spec);
        return logs.stream().map(log -> new AuditLogResponse(
                log.getId(),
                log.getTimestamp(),
                log.getUserId(),
                log.getUsername(),
                log.getOperation(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDetails()
        )).collect(Collectors.toList());
    }
}