package com.student.DocumentManagementSystem.payload.response;

public class OTPResponse {
    private String message;

    public OTPResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
