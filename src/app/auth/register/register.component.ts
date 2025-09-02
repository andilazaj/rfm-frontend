import { Component } from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { RegisterDto } from '../../core/auth/auth.types';

type RegisterForm = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
  role: FormControl<string>;
}>;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form: RegisterForm;
  loading = false;
  errorMsg = '';
  showPassword = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
      password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
      role: this.fb.nonNullable.control('user', [Validators.required]),
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const dto = this.form.getRawValue() as RegisterDto;

    this.auth
      .register(dto)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.router.navigateByUrl('/auth/login');
        },
        error: (err) => {
          this.errorMsg =
            err instanceof HttpErrorResponse
              ? err.error?.message || err.message || 'Registration failed.'
              : 'Unexpected error.';
        },
        complete: () => console.log(' Register request completed'),
      });
  }
}
