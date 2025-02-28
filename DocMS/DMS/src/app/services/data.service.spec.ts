import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return directory structure', () => {
    const dirs = service.getDirectoryStructure();
    expect(Array.isArray(dirs)).toBeTrue();
    expect(dirs.length).toBeGreaterThan(0);
  });

  it('should return recent files', () => {
    const files = service.getRecentFiles();
    expect(Array.isArray(files)).toBeTrue();
    expect(files.length).toBeGreaterThan(0);
  });
});
