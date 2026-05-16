import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { email as emailValidator, form, FormField, required } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';
import { FirebaseError } from 'firebase/app';

interface LoginData {
  email: string;
  password: string;
}

function toUserMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
    }
  }
  return 'Something went wrong. Please try again.';
}

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly loginModel = signal<LoginData>({ email: '', password: '' });

  readonly loginForm = form(this.loginModel, (s) => {
    required(s.email, { message: 'Email is required.' });
    emailValidator(s.email, { message: 'Please enter a valid email address.' });
    required(s.password, { message: 'Password is required.' });
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    const allValid = this.loginForm.email().valid() && this.loginForm.password().valid();
    if (!allValid) {
      this.liveAnnouncer.announce('Please fix the errors in the form before submitting.');
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const { email, password } = this.loginModel();

    try {
      await this.authService.login({ email, password });
      await this.router.navigate(['/']);
    } catch (err) {
      console.error('[Login error]', err);
      const message = toUserMessage(err);
      this.serverError.set(message);
      this.liveAnnouncer.announce(message);
      this.isSubmitting.set(false);
    }
  }
}

