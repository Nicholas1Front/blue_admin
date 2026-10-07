export type MonthlyAccountType = "income" | "expense";

export interface MonthlyAccount {
    id: string;
    description: string;
    amount: number;
    type: MonthlyAccountType;
    categoryId: string;
    dueDay: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}
