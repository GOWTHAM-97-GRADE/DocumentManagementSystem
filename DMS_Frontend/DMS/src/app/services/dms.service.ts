import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Interfaces matching backend responses
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
  path: string;
  createdBy: string;
}

export interface FileResponse {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData?: string;
  uploadDate?: string;
  uploadedBy?: string;
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
  newName: string;
}

@Injectable({
  providedIn: 'root'
})
export class DmsService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Helper method for authorization header only
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

  // Helper method for JSON requests (includes Content-Type)
  private getJsonHeaders(): HttpHeaders {
    return this.getAuthHeaders().set('Content-Type', 'application/json');
  }

  getAllDirectories(): Observable<DirectoryResponse[]> {
    return this.http.get<DirectoryResponse[]>(`${this.apiUrl}/directories`, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load directories'))));
  }

  getSubdirectories(parentId: number): Observable<DirectoryResponse[]> {
    return this.http.get<DirectoryResponse[]>(`${this.apiUrl}/directories/${parentId}/subdirectories`, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load subdirectories'))));
  }

  createDirectory(request: CreateDirectoryRequest): Observable<DirectoryResponse> {
    return this.http.post<DirectoryResponse>(`${this.apiUrl}/directories`, request, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to create directory'))));
  }

  getDirectoryContents(directoryId: number): Observable<DirectoryContentResponse> {
    return this.http.get<DirectoryContentResponse>(`${this.apiUrl}/directories/${directoryId}/contents`, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load directory contents'))));
  }

  deleteDirectory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/directories/${id}`, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete directory'))));
  }

  renameDirectory(id: number, request: RenameDirectoryRequest): Observable<DirectoryResponse> {
    return this.http.put<DirectoryResponse>(`${this.apiUrl}/directories/${id}/rename`, request, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to rename directory'))));
  }

  moveDirectory(id: number, newParentId?: number): Observable<DirectoryResponse> {
    const params = newParentId !== undefined ? new HttpParams().set('newParentId', newParentId.toString()) : new HttpParams();
    return this.http.put<DirectoryResponse>(`${this.apiUrl}/directories/${id}/move`, null, { headers: this.getJsonHeaders(), params })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to move directory'))));
  }

  uploadFiles(directoryId: number, files: File[], relativePaths?: string[]): Observable<FileResponse[]> {
    const formData = new FormData();
    formData.append('directoryId', directoryId.toString());
    files.forEach((file, index) => {
      formData.append('file', file);
      if (relativePaths && relativePaths[index]) {
        formData.append('relativePath', relativePaths[index]);
      }
      console.log(`Uploading file: ${file.name}, size: ${file.size}`);
    });
    const headers = this.getAuthHeaders(); // Only Authorization, no Content-Type
    console.log('Upload Headers:', headers.get('Authorization'));
    return this.http.post<FileResponse[]>(`${this.apiUrl}/files/upload`, formData, { headers })
      .pipe(catchError(err => {
        console.error('Upload error details:', { status: err.status, message: err.message, error: err.error });
        return throwError(() => new Error(err.error?.message || 'Failed to upload files'));
      }));
  }

  getFile(fileId: string): Observable<FileResponse> {
    return this.http.get<FileResponse>(`${this.apiUrl}/files/${fileId}`, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to get file'))));
  }

  updateFile(fileId: string, file: File): Observable<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = this.getAuthHeaders(); // Only Authorization, no Content-Type
    return this.http.put<FileResponse>(`${this.apiUrl}/files/${fileId}/update`, formData, { headers })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to update file'))));
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/files/${fileId}`, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete file'))));
  }

  addComment(fileId: string, comment: string): Observable<FileResponse> {
    const body = { comment };
    return this.http.post<FileResponse>(`${this.apiUrl}/files/${fileId}/comments`, body, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to add comment'))));
  }

  downloadFile(fileId: string): Observable<Blob> {
    const headers = this.getAuthHeaders(); // Only Authorization, no Content-Type
    return this.http.get(`${this.apiUrl}/files/${fileId}`, { headers, responseType: 'blob' })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to download file'))));
  }

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/admin/users`, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to load users'))));
  }

  deleteUserById(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/delete-user/${userId}`, { headers: this.getJsonHeaders() })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete user'))));
  }

  deleteAllUsers(confirm: boolean): Observable<void> {
    const params = new HttpParams().set('confirm', confirm.toString());
    return this.http.delete<void>(`${this.apiUrl}/admin/delete-all-users`, { headers: this.getJsonHeaders(), params })
      .pipe(catchError(err => throwError(() => new Error(err.error?.message || 'Failed to delete all users'))));
  }
}