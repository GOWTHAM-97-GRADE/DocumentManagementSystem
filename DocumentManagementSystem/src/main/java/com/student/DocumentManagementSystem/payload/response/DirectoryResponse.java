package com.student.DocumentManagementSystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DirectoryResponse {
    private Long id;
    private String name;
    private String path;
    private String createdBy;
}
