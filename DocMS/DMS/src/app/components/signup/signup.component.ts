import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  signupForm: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private router: Router) {
    this.signupForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  verifyEmail() {
    // Simulate email verification logic
    console.log('Email verification initiated for', this.signupForm.get('email')?.value);
  }

  onSubmit() {
    if (this.signupForm.valid) {
      const { username, email, role, password } = this.signupForm.value;
      this.authService.signup(username, email, role, password).subscribe(success => {
        if(success) {
          this.router.navigate(['/dms']);
        } else {
          this.errorMessage = 'Signup failed';
        }
      });
    }
  }
}
