import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DmsapplicationComponent } from './dmsapplication.component';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('DmsapplicationComponent', () => {
  let component: DmsapplicationComponent;
  let fixture: ComponentFixture<DmsapplicationComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dataServiceSpy: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const dataSpy = jasmine.createSpyObj('DataService', ['getDirectoryStructure', 'getRecentFiles']);
    authSpy.logout.and.stub();
    dataSpy.getDirectoryStructure.and.returnValue(['Folder1', 'Folder2']);
    dataSpy.getRecentFiles.and.returnValue(['File1', 'File2']);

    await TestBed.configureTestingModule({
      declarations: [ DmsapplicationComponent ],
      imports: [ RouterTestingModule ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: DataService, useValue: dataSpy }
      ]
    })
    .compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    dataServiceSpy = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DmsapplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load directory structure and recent files on init', () => {
    expect(component.directoryStructure.length).toBeGreaterThan(0);
    expect(component.recentFiles.length).toBeGreaterThan(0);
  });
});
