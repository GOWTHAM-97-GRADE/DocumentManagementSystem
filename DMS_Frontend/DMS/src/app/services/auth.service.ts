import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private tokenKey = 'jwt'; // Use 'jwt' as in the second implementation
  private userKey = 'auth_user'; // Add userKey for storing user details in localStorage
  private user: User | null = null;

  constructor(private http: HttpClient) {}

  sendOTP(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-otp?email=${encodeURIComponent(email)}`, null);
  }

  verifyOTP(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp`, { email, otp });
  }

  signup(signupData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, signupData);
  }

  signin(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/signin`, credentials).pipe(
      tap((response: any) => {
        if (response.accessToken) {
          localStorage.setItem(this.tokenKey, response.accessToken);
          this.user = {
            id: response.id,
            username: response.username || credentials.username,
            email: response.email,
            roles: response.roles // Correctly typed as string[]
          };
          // Store user in localStorage (from first implementation)
          localStorage.setItem(this.userKey, JSON.stringify({
            id: response.id,
            username: response.username || credentials.username,
            email: response.email,
            roles: response.roles
          }));
        }
      })
    );
  }

  // Updated login method to match the first implementation's signature
  login(username: string, password: string): Observable<any> {
    return this.signin({ username, password });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey); // Clear userKey as in first implementation
    this.user = null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Add backward compatibility for isAuthenticated (from first implementation)
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserDetails(): Observable<User> {
    // If user is already in memory, return it (merge behavior)
    if (this.user) {
      return of(this.user);
    }
    // Otherwise, fetch from backend
    return this.http.get<User>(`${this.apiUrl}/user`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` })
    }).pipe(
      tap(user => this.user = user)
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { email, otp, newPassword });
  }

  getCurrentUser(): User | null {
    // First check memory (from second implementation)
    if (this.user) {
      return this.user;
    }
    // Then check localStorage (from first implementation)
    const user = localStorage.getItem(this.userKey);
    if (user) {
      this.user = JSON.parse(user);
      return this.user;
    }
    return null;
  }
}