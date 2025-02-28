package com.student.DocumentManagementSystem.repository;

import java.util.Optional;

import com.student.DocumentManagementSystem.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email); // Add this method

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);
}
