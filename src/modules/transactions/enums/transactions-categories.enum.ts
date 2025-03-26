export enum TransactionType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE'
}

export enum IncomeCategories {
    DAILY = 'DAILY',
    SPECIAL = 'SPECIAL',
    DONATION = 'DONATION',
    OTHER = 'OTHER'
}

export enum ExpenseCategories {
    CHARITY = 'CHARITY',
    MAINTENANCE = 'MAINTENANCE',
    TRANSPORT = 'TRANSPORT',
    SPECIAL_ASSISTANCE = 'SPECIAL_ASSISTANCE',
    COMMUNICATION = 'COMMUNICATION',
    RESTAURATION = 'RESTAURATION'
}

export enum SubCategories {
    ILLNESS = 'ILLNESS',
    BIRTH = 'BIRTH',
    MARRIAGE = 'MARRIAGE',
    DEATH = 'DEATH',
    BUY_DEVICES = 'BUY_DEVICES',
    COMMITTEE = 'COMMITTEE',
    SORTIE = 'SORTIE'
}

export const isCategoryValidForType = (category: string, type: TransactionType): boolean => {
    if (type === TransactionType.INCOME) {
        return Object.values(IncomeCategories).includes(category as IncomeCategories);
    }
    return Object.values(ExpenseCategories).includes(category as ExpenseCategories);
}; 