import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start unauthenticated', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should set currentUser on successful login', async () => {
    const loginPromise = firstValueFrom(
      service.login({ email: 'demo@example.com', password: 'password123' }),
    );
    await vi.advanceTimersByTimeAsync(800);
    await loginPromise;
    expect(service.currentUser()?.email).toBe('demo@example.com');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should error on invalid login credentials', async () => {
    let error: Error | null = null;
    const loginPromise = firstValueFrom(
      service.login({ email: 'wrong@example.com', password: 'wrong' }),
    ).catch((e: Error) => { error = e; });
    await vi.advanceTimersByTimeAsync(800);
    await loginPromise;
    expect(error).not.toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('should set currentUser on signup', async () => {
    const signupPromise = firstValueFrom(
      service.signup({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
    );
    await vi.advanceTimersByTimeAsync(800);
    await signupPromise;
    expect(service.currentUser()?.email).toBe('test@example.com');
    expect(service.currentUser()?.name).toBe('Test User');
  });

  it('should clear currentUser on logout', async () => {
    const loginPromise = firstValueFrom(
      service.login({ email: 'demo@example.com', password: 'password123' }),
    );
    await vi.advanceTimersByTimeAsync(800);
    await loginPromise;
    service.logout();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
