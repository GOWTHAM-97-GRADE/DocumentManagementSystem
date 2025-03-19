package com.student.DocumentManagementSystem.payload.response;

import java.util.Set;

public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private int enabled;
    private Set<String> roles;

    public UserResponse(Long id, String username, String email, int enabled, Set<String> roles) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.enabled = enabled;
        this.roles = roles;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public int getEnabled() {
        return enabled;
    }

    public Set<String> getRoles() {
        return roles;
    }
}