/** Stored at /users/{uid}/budgets/{budgetId} */
export interface Budget {
  id: string;
  /** Must match a TransactionCategory */
  category: string;
  /** Monthly spending limit */
  maximum: number;
  /** Hex color e.g. "#277C78" */
  theme: string;
}

export type NewBudget = Omit<Budget, 'id'>;
