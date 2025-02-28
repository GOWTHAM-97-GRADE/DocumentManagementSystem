package com.student.DocumentManagementSystem.repository;

import com.student.DocumentManagementSystem.models.OTP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Repository
public interface OTPRepository extends JpaRepository<OTP, Long> {

    // Find OTP by email and OTP code, used for validation
    Optional<OTP> findByEmailAndOtp(String email, String otp);

    Optional<OTP> findByEmail(String email);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM OTP o WHERE o.email = ?1")
    void deleteByEmail(String email);

}
