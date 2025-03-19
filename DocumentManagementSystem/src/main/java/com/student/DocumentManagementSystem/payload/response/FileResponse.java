package com.student.DocumentManagementSystem.payload.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class FileResponse {
    @JsonProperty("fileId")
    private UUID fileId;

    @JsonProperty("fileName")
    private String fileName;

    @JsonProperty("fileType")
    private String fileType;

    @JsonProperty("fileSize")
    private long fileSize;

    @JsonProperty("fileData")
    private String fileData; // Base64 encoded

    @JsonProperty("uploadDate")
    private LocalDateTime uploadDate;

    @JsonProperty("uploadedBy")
    private String uploadedBy;

    @JsonProperty("comments")
    private List<String> comments = new ArrayList<>();

    // Constructor for minimal response (used in listFilesByDirectory, etc.)
    public FileResponse(UUID fileId, String fileName, String fileType, long fileSize) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    // Full constructor
    public FileResponse(UUID fileId, String fileName, String fileType, long fileSize, String fileData, LocalDateTime uploadDate, String uploadedBy, List<String> comments) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.fileData = fileData;
        this.uploadDate = uploadDate;
        this.uploadedBy = uploadedBy;
        this.comments = comments != null ? comments : new ArrayList<>();
    }
}