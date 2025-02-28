package com.student.DocumentManagementSystem.payload.response;

import lombok.Data;
import lombok.AllArgsConstructor;

@Data
@AllArgsConstructor
public class DirectoryResponse {
    private Long id;
    private String name;
    private String path;
    private String createdBy;
}
