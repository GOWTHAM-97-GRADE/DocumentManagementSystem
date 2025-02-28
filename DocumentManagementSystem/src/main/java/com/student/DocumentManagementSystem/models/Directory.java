package com.student.DocumentManagementSystem.models;
import com.student.DocumentManagementSystem.models.User;
import javax.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="directories")
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
    @JoinColumn(name="created_by",nullable=false)
    private User createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}