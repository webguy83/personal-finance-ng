import { Timestamp } from 'firebase/firestore';

export type TransactionCategory =
  | 'General'
  | 'Dining Out'
  | 'Groceries'
  | 'Entertainment'
  | 'Bills'
  | 'Personal Care'
  | 'Transportation'
  | 'Education'
  | 'Lifestyle'
  | 'Shopping';

/** Stored at /users/{uid}/transactions/{txId} */
export interface Transaction {
  id: string;
  name: string;
  avatar: string;
  category: TransactionCategory;
  date: Timestamp;
  /** Positive = income, negative = expense */
  amount: number;
}

export type NewTransaction = Omit<Transaction, 'id'>;
