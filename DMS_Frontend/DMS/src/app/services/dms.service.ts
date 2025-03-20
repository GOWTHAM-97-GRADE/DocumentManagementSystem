import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  roles: string[];
}

export interface DirectoryResponse {
  id: number;
  name: string;
  parentId?: number;
  path?: string;
}

export interface FileResponse {
  id: string; // UUID
  name: string;
  directoryId: number;
  relativePath?: string;
  comments?: string[];
}

export interface DirectoryContentResponse {
  subdirectories: DirectoryResponse[];
  files: FileResponse[];
}

export interface CreateDirectoryRequest {
  name: string;
  parentId?: number;
}

export interface RenameDirectoryRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class DmsService {
  private apiUrl = 'http://localhost:8080/api'; // Adjust as needed

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(contentType: string = 'application/json'): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) throw new Error('No authentication token found');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    });
  }

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
    const url = directoryId === 0 ? `${this.apiUrl}/directories` : `${this.apiUrl}/directories/${directoryId}/contents`;
    return this.http.get<DirectoryContentResponse>(url, { headers: this.getHeaders() })
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

  uploadFiles(directoryId: number, files: File[], username: string, relativePaths?: string[]): Observable<FileResponse[]> {
    const formData = new FormData();
    formData.append('directoryId', directoryId.toString());
    formData.append('username', username);
    files.forEach(file => formData.append('file', file));
    if (relativePaths) relativePaths.forEach(path => formData.append('relativePath', path));
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
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
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    return this.http.put<FileResponse>(`${this.apiUrl}/files/${fileId}/update`, formData, { headers })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to update file'))));
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/files/${fileId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete file'))));
  }

  addComment(fileId: string, comment: string): Observable<FileResponse> {
    return this.http.post<FileResponse>(`${this.apiUrl}/files/${fileId}/comments`, { comment }, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to add comment'))));
  }

  // Note: Backend doesn't provide download endpoint; this assumes a hypothetical one
  downloadFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}`, {
      headers: this.getHeaders('application/octet-stream'),
      responseType: 'blob'
    }).pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to download file'))));
  }

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/admin/users`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load users'))));
  }

  deleteUserById(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/delete-user/${userId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete user'))));
  }

  deleteAllUsers(confirm: boolean): Observable<void> {
    const params = new HttpParams().set('confirm', confirm.toString());
    return this.http.delete<void>(`${this.apiUrl}/admin/delete-all-users`, { headers: this.getHeaders(), params })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete all users'))));
  }
}