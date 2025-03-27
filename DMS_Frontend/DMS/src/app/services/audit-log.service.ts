import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuditLogResponse } from '../models/audit-log-response';
import { AuthService } from './auth.service'; // Import AuthService

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private apiUrl = 'http://localhost:8080/api/audit-logs'; // Adjust to your backend URL

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token found');
      throw new Error('No authentication token found');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getAuditLogs(params: any): Observable<AuditLogResponse[]> {
    let httpParams = new HttpParams();
    for (const key in params) {
      if (params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    }
    return this.http.get<AuditLogResponse[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
      params: httpParams,
    }).pipe(
      catchError(this.handleError)
    );
  }

  exportAuditLogsToPdf(params: any): Observable<Blob> {
    let httpParams = new HttpParams();
    for (const key in params) {
      if (params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    }
    return this.http.get(`${this.apiUrl}/export`, {
      headers: this.getAuthHeaders(),
      params: httpParams,
      responseType: 'blob',
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.status === 403) {
      errorMessage = 'Access denied: Admin privileges required';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized: Please log in again';
    } else if (error.status === 0) {
      errorMessage = 'Network error: Check server connection';
    } else {
      errorMessage = `Server error: ${error.status} - ${error.message}`;
    }
    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}