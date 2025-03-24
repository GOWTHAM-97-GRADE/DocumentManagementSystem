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
  private tokenKey = 'jwt';
  private userKey = 'auth_user';
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
            roles: response.roles
          };
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

  login(username: string, password: string): Observable<any> {
    return this.signin({ username, password });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.user = null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserDetails(): Observable<User> {
    if (this.user) {
      return of(this.user);
    }
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
    if (this.user) {
      return this.user;
    }
    const user = localStorage.getItem(this.userKey);
    if (user) {
      this.user = JSON.parse(user);
      return this.user;
    }
    return null;
  }
}