import { Timestamp } from 'firebase/firestore';

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  dueDate: Timestamp;
  isPaid: boolean;
  category: string;
}

export type NewRecurringBill = Omit<RecurringBill, 'id'>;
