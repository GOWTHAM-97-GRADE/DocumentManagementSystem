import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Interfaces aligned with backend payloads
interface UserResponse {
  id: number;
  username: string;
  email: string;
  enabled: number;
  roles: string[]; // JSON serializes Set<String> as an array
}

interface DirectoryResponse {
  id: number;
  name: string;
  parentId?: number;
  path?: string;
}

interface FileResponse {
  id: string; // UUID in backend
  name: string;
  directoryId: number;
  relativePath?: string;
  comments?: string[];
}

interface DirectoryContentResponse {
  subdirectories: DirectoryResponse[];
  files: FileResponse[];
}

interface CreateDirectoryRequest {
  name: string;
  parentId?: number;
}

interface RenameDirectoryRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class DmsService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(includeContentType: boolean = true): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    let headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    if (includeContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }
    return headers;
  }

  getCurrentUsername(): string | undefined {
    return this.authService.getCurrentUser()?.username;
  }

  // Directory Management
  getAllDirectories(): Observable<DirectoryResponse[]> {
    return this.http.get<DirectoryResponse[]>(`${this.apiUrl}/directories`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load directories'))));
  }

  getSubdirectories(parentId: number): Observable<DirectoryResponse[]> {
    return this.http.get<DirectoryResponse[]>(`${this.apiUrl}/directories/${parentId}/subdirectories`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load subdirectories'))));
  }

  createDirectory(request: CreateDirectoryRequest): Observable<DirectoryResponse> {
    return this.http.post<DirectoryResponse>(`${this.apiUrl}/directories`, request, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to create directory'))));
  }

  getDirectoryContents(directoryId: number): Observable<DirectoryContentResponse> {
    return this.http.get<DirectoryContentResponse>(`${this.apiUrl}/directories/${directoryId}/contents`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load directory contents'))));
  }

  deleteDirectory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/directories/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete directory'))));
  }

  renameDirectory(id: number, request: RenameDirectoryRequest): Observable<DirectoryResponse> {
    return this.http.put<DirectoryResponse>(`${this.apiUrl}/directories/${id}/rename`, request, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to rename directory'))));
  }

  moveDirectory(id: number, newParentId?: number): Observable<DirectoryResponse> {
    const params = newParentId !== undefined ? new HttpParams().set('newParentId', newParentId.toString()) : new HttpParams();
    return this.http.put<DirectoryResponse>(`${this.apiUrl}/directories/${id}/move`, null, { headers: this.getHeaders(), params })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to move directory'))));
  }

  // File Management
  uploadFiles(directoryId: number, files: File[], username: string, relativePaths?: string[]): Observable<FileResponse[]> {
    const formData = new FormData();
    formData.append('directoryId', directoryId.toString());
    files.forEach(file => formData.append('file', file));
    formData.append('username', username);
    if (relativePaths) {
      relativePaths.forEach(path => formData.append('relativePath', path));
    }
    const headers = this.getHeaders(false); // No Content-Type for multipart
    return this.http.post<FileResponse[]>(`${this.apiUrl}/files/upload`, formData, { headers })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to upload files'))));
  }

  getFile(fileId: string): Observable<FileResponse> {
    return this.http.get<FileResponse>(`${this.apiUrl}/files/${fileId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to get file'))));
  }

  updateFile(fileId: string, file: File): Observable<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = this.getHeaders(false); // No Content-Type for multipart
    return this.http.put<FileResponse>(`${this.apiUrl}/files/${fileId}/update`, formData, { headers })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to update file'))));
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/files/${fileId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete file'))));
  }

  addComment(fileId: string, comment: string): Observable<FileResponse> {
    return this.http.post<FileResponse>(
      `${this.apiUrl}/files/${fileId}/comments`,
      { comment },
      { headers: this.getHeaders() }
    ).pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to add comment'))));
  }

  // Hypothetical download endpoint (to be implemented in backend)
  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}/download`, {
      headers: this.getHeaders(false),
      responseType: 'blob'
    }).pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to download file'))));
  }

  // User Management
  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/admin/users`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load users'))));
  }

  deleteUserById(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/delete-user/${userId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete user'))));
  }

  deleteAllUsers(confirm: boolean): Observable<void> {
    if (!confirm) {
      return throwError(() => new Error('Operation requires confirmation'));
    }
    const params = new HttpParams().set('confirm', 'true');
    return this.http.delete<void>(`${this.apiUrl}/admin/delete-all-users`, { headers: this.getHeaders(), params })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete all users'))));
  }
}