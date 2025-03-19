package com.student.DocumentManagementSystem.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import javax.persistence.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.*;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "files")
public class FileEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "file_id", updatable = false, nullable = false, columnDefinition = "BINARY(16)")
    private UUID fileId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private long fileSize;

    @ManyToOne
    @JoinColumn(name = "directory_id", referencedColumnName = "id", nullable = false)
    private Directory directory;

    @ManyToOne
    @JoinColumn(name = "uploaded_by", referencedColumnName = "id", nullable = false)
    private User uploadedBy;

    @Column(nullable = false)
    private LocalDateTime uploadDate;

    @Lob
    private byte[] fileData;

    @ElementCollection
    @Column(length = 1000) // Adjust length as needed
    private List<String> comments = new ArrayList<>(); // Add comments field
}