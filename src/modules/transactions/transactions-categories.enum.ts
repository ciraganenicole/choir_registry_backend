// src/transactions/transactions-categories.enum.ts

export enum TransactionCategories {
  DAILY = 'DAILY',
  SPECIAL = 'SPECIAL',
  DONATION = 'DONATION',
  OTHER = 'OTHER',
  CHARITY = 'CHARITY',
  MAINTENANCE = 'MAINTENANCE',
  TRANSPORT = 'TRANSPORT',
  SPECIAL_ASSISTANCE = 'SPECIAL_ASSISTANCE',
  COMMUNICATION = 'COMMUNICATION',
  RESTAURATION = 'RESTAURATION',
}

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


