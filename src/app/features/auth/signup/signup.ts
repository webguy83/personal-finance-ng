import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { email as emailValidator, form, FormField, minLength, required } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth.service';
import { FirebaseError } from 'firebase/app';

interface SignupData {
  name: string;
  email: string;
  password: string;
}

function toUserMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
    }
  }
  return 'Something went wrong. Please try again.';
}

@Component({
  selector: 'app-signup',
  imports: [FormField, RouterLink],
  templateUrl: './signup.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  readonly showPassword = signal(false);
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly signupModel = signal<SignupData>({ name: '', email: '', password: '' });

  readonly signupForm = form(this.signupModel, (s) => {
    required(s.name, { message: 'Name is required.' });
    required(s.email, { message: 'Email is required.' });
    emailValidator(s.email, { message: 'Please enter a valid email address.' });
    required(s.password, { message: 'Password is required.' });
    minLength(s.password, 8, { message: 'Password must be at least 8 characters.' });
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    const allValid =
      this.signupForm.name().valid() &&
      this.signupForm.email().valid() &&
      this.signupForm.password().valid();

    if (!allValid) {
      this.liveAnnouncer.announce('Please fix the errors in the form before submitting.');
      return;
    }

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const { name, email, password } = this.signupModel();

    try {
      await this.authService.signup({ name, email, password });
      await this.router.navigate(['/']);
    } catch (err) {
      console.error('[Signup error]', err);
      const message = toUserMessage(err);
      this.serverError.set(message);
      this.liveAnnouncer.announce(message);
      this.isSubmitting.set(false);
    }
  }
}

