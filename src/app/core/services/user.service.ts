import { Injectable, inject, signal } from '@angular/core';
import { LoadingService } from './loading.service';
import {
  Firestore,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly auth = inject<Auth>(FIREBASE_AUTH);
  private readonly firestore = inject<Firestore>(FIREBASE_FIRESTORE);

  private readonly loadingService = inject(LoadingService);

  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _loading = signal(true);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();

  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.unsubscribeSnapshot?.();
      if (user) {
        this.listenToProfile(user.uid);
      } else {
        this._profile.set(null);
        this._loading.set(false);
      }
    });
  }

  private listenToProfile(uid: string): void {
    this.loadingService.add();
    let firstLoad = true;
    const ref = doc(this.firestore, 'users', uid);
    this.unsubscribeSnapshot = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        this._profile.set({ id: snap.id, ...snap.data() } as unknown as UserProfile);
      } else {
        this._profile.set(null);
      }
      this._loading.set(false);
      if (firstLoad) { firstLoad = false; this.loadingService.remove(); }
    });
  }
}
