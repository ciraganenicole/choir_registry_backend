// src/transactions/transactions-categories.enum.ts

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

// Categories for Income type transactions
export enum IncomeCategories {
  DAILY = 'DAILY',
  DONATION = 'DONATION',
  SPECIAL = 'SPECIAL',
  OTHER = 'OTHER',
}

// Categories for Expense type transactions
export enum ExpenseCategories {
  CHARITY = 'CHARITY',
  MAINTENANCE = 'MAINTENANCE',
  TRANSPORT = 'TRANSPORT',
  SPECIAL_ASSISTANCE = 'SPECIAL_ASSISTANCE',
  COMMUNICATION = 'COMMUNICATION',
  RESTAURATION = 'RESTAURATION',
}

// Combined categories type for easier usage
export type TransactionCategories = IncomeCategories | ExpenseCategories;

export const Subcategories = {
  CHARITY: {
    ILLNESS: 'ILLNESS',
    BIRTH: 'BIRTH',
    MARRIAGE: 'MARRIAGE',
    DEATH: 'DEATH',
  },
  MAINTENANCE: {
    MAINTENANCE: 'MAINTENANCE',
    BUY_DEVICES: 'BUY_DEVICES',
  },
  TRANSPORT: {
    COMMITTEE: 'COMMITTEE',
    SORTIE: 'SORTIE',
  },
  // Add other categories and subcategories here
};

export type SubcategoryType = typeof Subcategories[keyof typeof Subcategories][keyof typeof Subcategories[keyof typeof Subcategories]];

// Helper function to validate category matches transaction type
export function isCategoryValidForType(category: TransactionCategories, type: TransactionType): boolean {
  if (type === TransactionType.INCOME) {
    return Object.values(IncomeCategories).includes(category as IncomeCategories);
  }
  return Object.values(ExpenseCategories).includes(category as ExpenseCategories);
}


