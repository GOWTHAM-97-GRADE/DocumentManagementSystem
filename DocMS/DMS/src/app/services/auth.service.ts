import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  login(username: string, password: string): Observable<boolean> {
    // Simulate authentication (for demo purposes)
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('token', 'dummy-token');
      return of(true);
    }
    // For demo, any non-empty credentials return true
    if (username && password) {
      localStorage.setItem('token', 'dummy-token');
      return of(true);
    }
    return of(false);
  }

  signup(username: string, email: string, role: string, password: string): Observable<boolean> {
    // Simulate signup logic and store token
    if (username && email && role && password) {
      localStorage.setItem('token', 'dummy-token');
      return of(true);
    }
    return of(false);
  }

  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}
