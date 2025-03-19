import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  email: string = '';
  otp: string = '';
  username: string = '';
  selectedRole: string = 'user'; // Default role
  password: string = '';
  confirmPassword: string = '';

  showEmailInput: boolean = true;
  showOTPInput: boolean = false;
  showSignupForm: boolean = false;
  isLoading: boolean = false;
  isDarkTheme: boolean = false; // Theme support

  emailError: string = '';
  otpError: string = '';
  signupError: string = '';

  roleOptions: string[] = ['user', 'mod', 'admin'];

  usernamePattern = /^[a-zA-Z0-9_-]{4,16}$/;
  passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.isDarkTheme = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  sendOTP() {
    if (!this.email.includes('@') || !this.email.includes('.')) {
      this.emailError = 'Please enter a valid email address.';
      return;
    }
    this.isLoading = true;
    this.authService.sendOTP(this.email).subscribe({
      next: (response: any) => {
        this.showOTPInput = true;
        this.showEmailInput = false;
        this.emailError = '';
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Send OTP Error:', err);
        this.emailError = err.error?.message || 'Failed to send OTP. Check server logs.';
        this.isLoading = false;
      }
    });
  }

  verifyOTP() {
    if (!this.otp || this.otp.length < 4) {
      this.otpError = 'Please enter a valid OTP.';
      return;
    }
    this.isLoading = true;
    this.authService.verifyOTP(this.email, this.otp).subscribe({
      next: (response: any) => {
        this.showSignupForm = true;
        this.showOTPInput = false;
        this.otpError = '';
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Verify OTP Error:', err);
        this.otpError = err.error?.message || 'Invalid or expired OTP.';
        this.isLoading = false;
      }
    });
  }

  signup() {
    if (!this.usernamePattern.test(this.username)) {
      this.signupError = 'Username must be 4-16 characters (letters, numbers, _, -)';
      return;
    }
    if (!this.passwordPattern.test(this.password)) {
      this.signupError = 'Password must have 6+ characters, 1 uppercase, 1 number, 1 special character';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.signupError = 'Passwords do not match';
      return;
    }

    let roles: string[];
    switch (this.selectedRole.toLowerCase()) {
      case 'admin':
        roles = ['admin', 'mod', 'user'];
        break;
      case 'mod':
        roles = ['mod', 'user'];
        break;
      default:
        roles = ['user'];
    }

    const signupData = {
      username: this.username,
      email: this.email,
      password: this.password,
      role: roles
    };

    this.isLoading = true;
    this.authService.signup(signupData).subscribe({
      next: (response: any) => {
        alert('Signup successful! Please log in.');
        this.router.navigate(['/login']);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Signup Error:', err);
        this.signupError = err.error?.message || 'Signup failed. Check server logs.';
        this.isLoading = false;
      }
    });
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }
}