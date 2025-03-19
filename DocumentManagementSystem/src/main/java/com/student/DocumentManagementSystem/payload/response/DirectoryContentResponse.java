package com.student.DocumentManagementSystem.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DirectoryContentResponse {
    private List<DirectoryResponse> subdirectories;
    private List<FileResponse> files;
}