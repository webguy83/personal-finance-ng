import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { SignupComponent } from './signup';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('SignupComponent', () => {
  let fixture: ComponentFixture<SignupComponent>;
  let component: SignupComponent;
  const mockAuthService = { signup: vi.fn() };

  beforeEach(async () => {
    mockAuthService.signup = vi.fn();

    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show all field errors when submitted empty', () => {
    component.submit();
    fixture.detectChanges();
    const alerts = fixture.nativeElement.querySelectorAll('[role="alert"]');
    expect(alerts.length).toBeGreaterThanOrEqual(3);
  });

  it('should show minlength error for short password', () => {
    component.signupModel.set({ name: 'Test User', email: 'test@example.com', password: 'short' });
    component.submit();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('#password-error');
    expect(error?.textContent).toContain('8 characters');
  });

  it('should show password hint when field is pristine', () => {
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('#password-hint');
    expect(hint?.textContent).toContain('8 characters');
  });

  it('should toggle password visibility', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    expect(input.type).toBe('password');
    component.togglePassword();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });

  it('should call authService.signup on valid submit', () => {
    mockAuthService.signup.mockReturnValue(
      of({ id: '99', name: 'New User', email: 'new@example.com' }),
    );
    component.signupModel.set({ name: 'New User', email: 'new@example.com', password: 'validpass123' });
    component.submit();
    expect(mockAuthService.signup).toHaveBeenCalledWith({
      name: 'New User',
      email: 'new@example.com',
      password: 'validpass123',
    });
  });

  it('should display server error on failed signup', () => {
    mockAuthService.signup.mockReturnValue(throwError(() => new Error('Email already in use.')));
    component.signupModel.set({ name: 'Test User', email: 'taken@example.com', password: 'validpass123' });
    component.submit();
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Email already in use.');
  });
});
