package com.student.DocumentManagementSystem.models;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String path;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Directory parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Directory> subdirectories = new ArrayList<>();

    @OneToMany(mappedBy = "directory", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<FileEntity> files = new ArrayList<>();

    // Helper method to update path based on parent
    public void updatePath() {
        if (this.parent == null) {
            this.path = "/" + this.name; // Root-level directory
        } else {
            this.path = this.parent.getPath() + "/" + this.name;
        }
        // Recursively update subdirectories
        for (Directory subdir : subdirectories) {
            subdir.updatePath();
        }
    }

    // Helper method to add a subdirectory
    public void addSubdirectory(Directory subdirectory) {
        subdirectories.add(subdirectory);
        subdirectory.setParent(this);
        subdirectory.updatePath();
    }

    // Helper method to remove a subdirectory
    public void removeSubdirectory(Directory subdirectory) {
        subdirectories.remove(subdirectory);
        subdirectory.setParent(null);
        subdirectory.updatePath();
    }
}