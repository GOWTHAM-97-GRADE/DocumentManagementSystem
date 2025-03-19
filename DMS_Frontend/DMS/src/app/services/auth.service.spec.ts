// src/app/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const API_URL = 'http://localhost:8080/api/auth'; // Updated to match service

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call signin endpoint', () => {
    const credentials = { username: 'testuser', password: 'password' };
    service.signin(credentials).subscribe(response => {
      expect(response).toBeTruthy();
      expect(response.jwt).toEqual('dummy-jwt'); // Updated to expect JWT
    });
    const req = httpMock.expectOne(`${API_URL}/signin`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush({ jwt: 'dummy-jwt' }); // Updated response structure
  });

  it('should call sendOTP endpoint', () => {
    const email = 'test@example.com';
    service.sendOTP(email).subscribe(response => {
      expect(response).toBeTruthy();
      expect(response.message).toEqual('OTP sent to email!');
    });
    const req = httpMock.expectOne(`${API_URL}/send-otp?email=${email}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({}); // Matches updated service
    req.flush({ message: 'OTP sent to email!' });
  });

  it('should call verifyOTP endpoint', () => {
    const email = 'test@example.com';
    const otp = '123456';
    service.verifyOTP(email, otp).subscribe(response => {
      expect(response).toBeTruthy();
      expect(response.message).toEqual('Email verified successfully!');
    });
    const req = httpMock.expectOne(`${API_URL}/verify-otp`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email, otp }); // Matches service signature
    req.flush({ message: 'Email verified successfully!' });
  });

  it('should call signup endpoint', () => {
    const signupRequest = { 
      username: 'testuser', 
      email: 'test@example.com', 
      password: 'password', 
      role: ['ROLE_USER'] 
    };
    service.signup(signupRequest).subscribe(response => {
      expect(response).toBeTruthy();
      expect(response.message).toEqual('User registered successfully!');
    });
    const req = httpMock.expectOne(`${API_URL}/signup`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(signupRequest);
    req.flush({ message: 'User registered successfully!' });
  });
});