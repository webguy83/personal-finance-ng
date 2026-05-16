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
  orderBy,
  onSnapshot,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH, FIREBASE_FIRESTORE } from '../firebase';
import { Transaction, NewTransaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly auth = inject<Auth>(FIREBASE_AUTH);
  private readonly firestore = inject<Firestore>(FIREBASE_FIRESTORE);

  private readonly loadingService = inject(LoadingService);

  private readonly _transactions = signal<Transaction[]>([]);
  private readonly _loading = signal(true);

  readonly transactions = this._transactions.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.listenToTransactions(user.uid);
      } else {
        this._transactions.set([]);
        this._loading.set(false);
      }
    });
  }

  private listenToTransactions(uid: string): void {
    this.loadingService.add();
    let firstLoad = true;
    const ref = collection(this.firestore, 'users', uid, 'transactions');
    const q = query(ref, orderBy('date', 'desc'));
    onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
      this._transactions.set(items);
      this._loading.set(false);
      if (firstLoad) {
        firstLoad = false;
        this.loadingService.remove();
      }
    });
  }

  async add(uid: string, tx: NewTransaction) {
    const ref = collection(this.firestore, 'users', uid, 'transactions');
    await addDoc(ref, tx);
  }

  async update(uid: string, id: string, changes: Partial<NewTransaction>) {
    const ref = doc(this.firestore, 'users', uid, 'transactions', id);
    await updateDoc(ref, changes as DocumentData);
  }

  async remove(uid: string, id: string) {
    const ref = doc(this.firestore, 'users', uid, 'transactions', id);
    await deleteDoc(ref);
  }
}
