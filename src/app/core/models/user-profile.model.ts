/** Stored at /users/{uid} — the user profile document */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: Date;
  /** Current cash balance */
  balance: number;
}
