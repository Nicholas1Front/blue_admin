export type FinancialType = "income" | "expense";

/**
 * Prisma Decimal values are returned as strings by some CRUD endpoints,
 * while the paginated and analytic endpoints normalize them to numbers.
 */
export type FinancialNumericValue = number | string;

export interface FinancialCategorySummary {
    name: string;
    type: FinancialType;
    description: string | null;
    value: number;
}
