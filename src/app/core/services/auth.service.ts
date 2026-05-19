import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  Unsubscribe,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly auth = inject<Auth>(FIREBASE_AUTH);
  private readonly firestore = inject<Firestore>(FIREBASE_FIRESTORE);
  private readonly router = inject(Router);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _loading = signal(true);
  private readonly unsubscribeAuth: Unsubscribe;

  readonly currentUser = this._currentUser.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    this.unsubscribeAuth = onAuthStateChanged(this.auth, (user) => {
      this._currentUser.set(user);
      this._loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAuth();
  }

  async login(credentials: LoginCredentials): Promise<void> {
    await signInWithEmailAndPassword(
      this.auth,
      credentials.email,
      credentials.password,
    );
  }

  async signup(data: SignupData): Promise<void> {
    const { user } = await createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password,
    );
    await updateProfile(user, { displayName: data.name });
    await setDoc(doc(this.firestore, 'users', user.uid), {
      uid: user.uid,
      name: data.name,
      email: data.email,
      createdAt: serverTimestamp(),
      balance: 0,
    });
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/auth/login']);
  }
}

