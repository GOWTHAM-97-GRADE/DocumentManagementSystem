import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse as AngularHttpResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  path: string;
  createdBy: string;
}

export interface FileResponse {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData?: string; // Base64 data
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

  private getJsonHeaders(): HttpHeaders {
    return this.getAuthHeaders().set('Content-Type', 'application/json');
  }

  private handleError(operation: string) {
    return (err: any) => {
      const errorMsg = err.error?.message || err.message || 'Unknown error';
      console.error(`${operation} error:`, { status: err.status, message: errorMsg, error: err.error });
      return throwError(() => new Error(`${operation} failed: ${errorMsg}`));
    };
  }

  getAllDirectories(): Observable<DirectoryResponse[]> {
    return this.http.get<DirectoryResponse[]>(`${this.apiUrl}/directories`, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Load directories')));
  }

  getSubdirectories(parentId: number): Observable<DirectoryResponse[]> {
    return this.http.get<DirectoryResponse[]>(`${this.apiUrl}/directories/${parentId}/subdirectories`, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Load subdirectories')));
  }

  createDirectory(request: CreateDirectoryRequest): Observable<DirectoryResponse> {
    return this.http.post<DirectoryResponse>(`${this.apiUrl}/directories`, request, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Create directory')));
  }

  getDirectoryContents(directoryId: number): Observable<DirectoryContentResponse> {
    return this.http.get<DirectoryContentResponse>(`${this.apiUrl}/directories/${directoryId}/contents`, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Load directory contents')));
  }

  deleteDirectory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/directories/${id}`, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Delete directory')));
  }

  renameDirectory(id: number, request: RenameDirectoryRequest): Observable<DirectoryResponse> {
    return this.http.put<DirectoryResponse>(`${this.apiUrl}/directories/${id}/rename`, request, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Rename directory')));
  }

  moveDirectory(id: number, newParentId?: number): Observable<DirectoryResponse> {
    const params = newParentId !== undefined ? new HttpParams().set('newParentId', newParentId.toString()) : new HttpParams();
    return this.http.put<DirectoryResponse>(`${this.apiUrl}/directories/${id}/move`, null, { headers: this.getJsonHeaders(), params })
      .pipe(catchError(this.handleError('Move directory')));
  }

  uploadFiles(directoryId: number, files: File[]): Observable<FileResponse[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('file', file));
    const params = new HttpParams().set('directoryId', directoryId.toString());
    const headers = this.getAuthHeaders();
    console.log('Upload Headers:', headers.get('Authorization'));
    return this.http.post<FileResponse[]>(`${this.apiUrl}/files/upload`, formData, { headers, params })
      .pipe(catchError(this.handleError('Upload files')));
  }

  getFile(fileId: string): Observable<FileResponse> {
    return this.http.get<FileResponse>(`${this.apiUrl}/files/${fileId}`, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Get file')));
  }

  updateFile(fileId: string, file: File): Observable<FileResponse> {
    if (!fileId || !file) {
      console.error('Invalid input for updateFile:', { fileId, file });
      return throwError(() => new Error('File ID or file is missing'));
    }
    const formData = new FormData();
    formData.append('file', file);
    const headers = this.getAuthHeaders();
    return this.http.put<FileResponse>(`${this.apiUrl}/files/${fileId}/update`, formData, { 
      headers,
      observe: 'response' // Get full HTTP response
    }).pipe(
      map((response: AngularHttpResponse<FileResponse>) => {
        console.log('Raw server response:', response); // Debug the response
        const body: FileResponse | null = response.body;
        if (response.status === 200) {
          if (!body || !body.fileId || !body.fileName) {
            console.warn('Server returned incomplete or no JSON response, assuming update succeeded:', body);
            // Fallback to a minimal FileResponse based on input
            return {
              fileId,
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size,
              uploadDate: new Date().toISOString(),
              uploadedBy: this.authService.getCurrentUser()?.username || 'unknown',
              comments: []
            } as FileResponse;
          }
          return body; // Valid FileResponse
        }
        throw new Error(`Unexpected status code: ${response.status}`);
      }),
      catchError((err) => {
        console.error('Update file error:', err);
        // If parsing fails but status is 200, assume success and return fallback
        if (err.status === 200) {
          console.warn('Update succeeded but response parsing failed, using fallback');
          return of({
            fileId,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            uploadDate: new Date().toISOString(),
            uploadedBy: this.authService.getCurrentUser()?.username || 'unknown',
            comments: []
          } as FileResponse);
        }
        const errorMsg = err.status === 404 
          ? `File with ID ${fileId} not found`
          : `Update failed: ${err.statusText || 'Unknown error'}`;
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  deleteFile(fileId: string): Observable<void> {
    return this.http.delete(`${this.apiUrl}/files/${fileId}`, { headers: this.getJsonHeaders(), responseType: 'text' })
      .pipe(
        map(() => void 0),
        catchError(this.handleError('Delete file'))
      );
  }

  addComment(fileId: string, comment: string): Observable<FileResponse> {
    const body = { comment };
    return this.http.post<FileResponse>(`${this.apiUrl}/files/${fileId}/comments`, body, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Add comment')));
  }

  downloadFile(fileId: string): Observable<Blob> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/files/${fileId}/download`, {
      headers,
      responseType: 'blob' // Expect binary response
    }).pipe(
      catchError((err) => {
        const errorMsg = err.status === 404 
          ? `File with ID ${fileId} not found on server` 
          : `Download failed: ${err.statusText || 'Unknown error'}`;
        console.error('Download file error:', { status: err.status, message: errorMsg, error: err });
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  private base64ToBlob(b64Data: string, contentType: string): Blob {
    try {
      const byteCharacters = atob(b64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      return new Blob(byteArrays, { type: contentType });
    } catch (e) {
      console.error('Error decoding base64 to Blob:', e);
      throw new Error('Invalid file data encoding');
    }
  }

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}/admin/users`, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Load users')));
  }

  deleteUserById(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/delete-user/${userId}`, { headers: this.getJsonHeaders() })
      .pipe(catchError(this.handleError('Delete user')));
  }

  deleteAllUsers(confirm: boolean): Observable<void> {
    const params = new HttpParams().set('confirm', confirm.toString());
    return this.http.delete<void>(`${this.apiUrl}/admin/delete-all-users`, { headers: this.getJsonHeaders(), params })
      .pipe(catchError(this.handleError('Delete all users')));
  }
}