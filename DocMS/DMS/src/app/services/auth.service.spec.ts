import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login with valid credentials', (done: DoneFn) => {
    service.login('testuser', 'password').subscribe(success => {
      expect(success).toBeTrue();
      expect(localStorage.getItem('token')).toBeTruthy();
      done();
    });
  });

  it('should signup with valid data', (done: DoneFn) => {
    service.signup('testuser', 'test@example.com', 'user', 'password').subscribe(success => {
      expect(success).toBeTrue();
      expect(localStorage.getItem('token')).toBeTruthy();
      done();
    });
  });

  it('should logout', () => {
    localStorage.setItem('token', 'dummy-token');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
