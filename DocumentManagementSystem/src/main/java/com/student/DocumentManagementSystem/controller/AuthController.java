package com.student.DocumentManagementSystem.controller;

import com.student.DocumentManagementSystem.models.User;
import com.student.DocumentManagementSystem.payload.request.LoginRequest;
import com.student.DocumentManagementSystem.payload.request.SignupRequest;
import com.student.DocumentManagementSystem.payload.request.VerifyOTPRequest;
import com.student.DocumentManagementSystem.payload.response.JwtResponse;
import com.student.DocumentManagementSystem.payload.response.MessageResponse;
import com.student.DocumentManagementSystem.payload.response.OTPResponse;
import com.student.DocumentManagementSystem.repository.UserRepository;
import com.student.DocumentManagementSystem.security.jwt.JwtUtils;
import com.student.DocumentManagementSystem.security.services.UserDetailsImpl;
import com.student.DocumentManagementSystem.service.OTPService;
import com.student.DocumentManagementSystem.service.SignUpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private SignUpService signUpService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OTPService otpService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        String jwt = jwtUtils.generateJwtToken(authentication);

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt, userPrincipal.getId(), userPrincipal.getUsername(), userPrincipal.getEmail(), roles));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOTP(@RequestParam String email) {
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email is already registered!"));
        }
        otpService.generateAndSendOTP(email);
        return ResponseEntity.ok(new OTPResponse("OTP sent to your email!"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(@Valid @RequestBody VerifyOTPRequest request) {
        boolean isValid = otpService.validateOTP(request.getEmail(), request.getOtp());

        if (isValid) {
            otpService.storeVerifiedEmail(request.getEmail());
            otpService.deleteOTP(request.getEmail());
            return ResponseEntity.ok(new MessageResponse("Email verified successfully! You can now complete your signup."));
        }
        return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP or OTP expired!"));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (!otpService.isEmailVerified(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email not verified. Please verify your email before signing up."));
        }
        return signUpService.completeRegistration(signUpRequest);
    }
}