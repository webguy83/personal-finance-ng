import { Injectable, inject, signal } from '@angular/core';
import { LoadingService } from './loading.service';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  increment,
} from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase';
import { Pot, NewPot } from '../models/pot.model';

@Injectable({ providedIn: 'root' })
export class PotService {
  private readonly auth = inject<Auth>(FIREBASE_AUTH);
  private readonly firestore = inject<Firestore>(FIREBASE_FIRESTORE);
  private readonly loadingService = inject(LoadingService);

  private readonly _pots = signal<Pot[]>([]);
  private readonly _loading = signal(true);

  readonly pots = this._pots.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.listenToPots(user.uid);
      } else {
        this._pots.set([]);
        this._loading.set(false);
      }
    });
  }

  private listenToPots(uid: string): void {
    this.loadingService.add();
    let firstLoad = true;
    const ref = collection(this.firestore, 'users', uid, 'pots');
    const q = query(ref);
    const createdAtSeconds = (pot: Pot): number => {
      const ts = pot.createdAt as { seconds?: number } | null;
      return ts?.seconds ?? 0;
    };
    onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Pot)
        .sort((a, b) => createdAtSeconds(b) - createdAtSeconds(a));
      this._pots.set(items);
      this._loading.set(false);
      if (firstLoad) { firstLoad = false; this.loadingService.remove(); }
    });
  }

  async add(uid: string, pot: NewPot): Promise<void> {
    const ref = collection(this.firestore, 'users', uid, 'pots');
    await addDoc(ref, { ...pot, createdAt: serverTimestamp() });
  }

  async update(uid: string, id: string, changes: Partial<NewPot>): Promise<void> {
    const ref = doc(this.firestore, 'users', uid, 'pots', id);
    await updateDoc(ref, changes as DocumentData);
  }

  /** Add or withdraw money from a pot */
  async adjustTotal(uid: string, id: string, amount: number): Promise<void> {
    const ref = doc(this.firestore, 'users', uid, 'pots', id);
    await updateDoc(ref, { total: increment(amount) });
  }

  /** Delete a pot */
  async remove(uid: string, id: string): Promise<void> {
    const ref = doc(this.firestore, 'users', uid, 'pots', id);
    await deleteDoc(ref);
  }
}
