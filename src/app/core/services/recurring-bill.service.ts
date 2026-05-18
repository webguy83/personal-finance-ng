import { Injectable, inject, signal } from '@angular/core';
import { LoadingService } from './loading.service';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase';
import { NewRecurringBill, RecurringBill } from '../models/recurring-bill.model';

@Injectable({ providedIn: 'root' })
export class RecurringBillService {
  private readonly auth = inject<Auth>(FIREBASE_AUTH);
  private readonly firestore = inject<Firestore>(FIREBASE_FIRESTORE);
  private readonly loadingService = inject(LoadingService);

  private readonly _bills = signal<RecurringBill[]>([]);
  private readonly _loading = signal(true);

  readonly bills = this._bills.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.listenToBills(user.uid);
      } else {
        this._bills.set([]);
        this._loading.set(false);
      }
    });
  }

  private listenToBills(uid: string): void {
    this.loadingService.add();
    let firstLoad = true;
    const ref = collection(this.firestore, 'users', uid, 'recurring-bills');
    onSnapshot(ref, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as RecurringBill);
      this._bills.set(items);
      this._loading.set(false);
      if (firstLoad) { firstLoad = false; this.loadingService.remove(); }
    });
  }

  async add(uid: string, bill: NewRecurringBill): Promise<void> {
    const ref = collection(this.firestore, 'users', uid, 'recurring-bills');
    await addDoc(ref, bill);
  }

  async remove(uid: string, id: string): Promise<void> {
    const ref = doc(this.firestore, 'users', uid, 'recurring-bills', id);
    await deleteDoc(ref);
  }
}
