export type FinancialTransactionType = "income" | "expense";

export interface FinancialTransaction {
    id: string;
    description: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    type: FinancialTransactionType;
    categoryId: string;
    referenceDate: string;
    originType: string | null;
    originId: string | null;
    createdAt: string;
    updatedAt: string;
}
