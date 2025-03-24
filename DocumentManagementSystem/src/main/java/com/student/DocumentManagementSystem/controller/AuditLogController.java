package com.student.DocumentManagementSystem.controller;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import com.student.DocumentManagementSystem.payload.response.AuditLogResponse;
import com.student.DocumentManagementSystem.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String operation,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<AuditLogResponse> logs = auditLogService.getAuditLogs(userId, operation, entityType, startDate, endDate);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAuditLogsToPdf(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String operation,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<AuditLogResponse> logs = auditLogService.getAuditLogs(userId, operation, entityType, startDate, endDate);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, baos);
            document.open();
            document.add(new Paragraph("Audit Log Report"));
            document.add(new Paragraph("Generated on: " + LocalDateTime.now()));
            document.add(new Paragraph(" "));

            for (AuditLogResponse log : logs) {
                document.add(new Paragraph(
                        String.format("ID: %d | Time: %s | UserID: %d | Username: %s | Operation: %s | Entity: %s | EntityID: %s | Details: %s",
                                log.getId(), log.getTimestamp(), log.getUserId(), log.getUsername(), log.getOperation(),
                                log.getEntityType(), log.getEntityId(), log.getDetails())));
                document.add(new Paragraph(" "));
            }
            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF", e);
        }

        byte[] pdfBytes = baos.toByteArray();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "audit_logs.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}