package com.student.DocumentManagementSystem.repository;

import java.util.Optional;

import com.student.DocumentManagementSystem.models.ERole;
import com.student.DocumentManagementSystem.models.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(ERole name);
}
