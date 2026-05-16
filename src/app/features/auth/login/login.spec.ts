import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/services/auth.service';

const mockEvent = () => ({ preventDefault: vi.fn() }) as unknown as SubmitEvent;

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  const mockAuthService = { login: vi.fn() };

  beforeEach(async () => {
    mockAuthService.login = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show validation errors when form is submitted empty', async () => {
    await component.submit(mockEvent());
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('[role="alert"]');
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('should show email format error for invalid email', async () => {
    component.loginModel.set({ email: 'not-an-email', password: 'somepassword' });
    await component.submit(mockEvent());
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('#email-error');
    expect(error?.textContent).toContain('valid email');
  });

  it('should toggle password visibility', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    expect(input.type).toBe('password');
    component.togglePassword();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    component.togglePassword();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });

  it('should disable submit button while submitting', () => {
    component.isSubmitting.set(true);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
  });

  it('should call authService.login on valid submit', async () => {
    mockAuthService.login.mockResolvedValue(undefined);
    component.loginModel.set({ email: 'demo@example.com', password: 'password123' });
    await component.submit(mockEvent());
    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'demo@example.com',
      password: 'password123',
    });
  });

  it('should display server error on failed login', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Invalid email or password.'));
    component.loginModel.set({ email: 'wrong@example.com', password: 'wrongpass' });
    await component.submit(mockEvent());
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Something went wrong');
  });
});

