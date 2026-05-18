/** Stored at /users/{uid}/pots/{potId} */
export interface Pot {
  id: string;
  name: string;
  /** Savings goal */
  target: number;
  /** Amount saved so far */
  total: number;
  /** Hex color e.g. "#277C78" */
  theme: string;
  /** Firestore server timestamp — used for insertion-order sorting */
  createdAt?: unknown;
}

export type NewPot = Omit<Pot, 'id'>;
