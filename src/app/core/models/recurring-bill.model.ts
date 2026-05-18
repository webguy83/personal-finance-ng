import { Timestamp } from 'firebase/firestore';

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  dueDate: Timestamp;
  category: string;
}

export type NewRecurringBill = Omit<RecurringBill, 'id'>;
