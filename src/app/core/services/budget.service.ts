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
import { Budget, NewBudget } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly auth = inject<Auth>(FIREBASE_AUTH);
  private readonly firestore = inject<Firestore>(FIREBASE_FIRESTORE);

  private readonly loadingService = inject(LoadingService);

  private readonly _budgets = signal<Budget[]>([]);
  private readonly _loading = signal(true);

  readonly budgets = this._budgets.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.listenToBudgets(user.uid);
      } else {
        this._budgets.set([]);
        this._loading.set(false);
      }
    });
  }

  private listenToBudgets(uid: string): void {
    this.loadingService.add();
    let firstLoad = true;
    const ref = collection(this.firestore, 'users', uid, 'budgets');
    const q = query(ref, orderBy('category'));
    onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Budget);
      this._budgets.set(items);
      this._loading.set(false);
      if (firstLoad) { firstLoad = false; this.loadingService.remove(); }
    });
  }

  async add(uid: string, budget: NewBudget): Promise<void> {
    const ref = collection(this.firestore, 'users', uid, 'budgets');
    await addDoc(ref, budget);
  }

  async update(uid: string, id: string, changes: Partial<NewBudget>): Promise<void> {
    const ref = doc(this.firestore, 'users', uid, 'budgets', id);
    await updateDoc(ref, changes as DocumentData);
  }

  async remove(uid: string, id: string): Promise<void> {
    const ref = doc(this.firestore, 'users', uid, 'budgets', id);
    await deleteDoc(ref);
  }
}
