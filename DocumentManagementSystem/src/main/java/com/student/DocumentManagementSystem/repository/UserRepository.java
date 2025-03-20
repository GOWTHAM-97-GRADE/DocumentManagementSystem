package com.student.DocumentManagementSystem.repository;

import com.student.DocumentManagementSystem.models.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    // Override findAll() with EntityGraph to eagerly fetch roles
    @EntityGraph(attributePaths = {"roles"})
    List<User> findAll();
}