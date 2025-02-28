package com.student.DocumentManagementSystem.payload.request;

import javax.validation.constraints.NotBlank;

public class VerifyOTPRequest {
    @NotBlank
    private String email;

    @NotBlank
    private String otp;

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}