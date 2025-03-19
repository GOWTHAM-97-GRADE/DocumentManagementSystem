package com.student.DocumentManagementSystem.models;

import lombok.*;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "directories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Directory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String path;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // New: Parent directory for hierarchy (null for root directories)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Directory parent;

    // Optional: List of subdirectories (bidirectional mapping)
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Directory> subdirectories;

    // Optional: Files in this directory (if not already in FileEntity)
    @OneToMany(mappedBy = "directory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FileEntity> files;
}