import type { BudgetHistoryEvent, BudgetRecord, BudgetStatus } from "../budgets.types";

export interface BudgetDashboardFilters { year: number; month: number; page?: number; limit?: number; }
export interface BudgetMetricsFilters { year: number; }
export interface BudgetStatusTotals { count: number; totalAmount: number; finalAmount: number; }
export interface BudgetDashboardResponse {
    period: { year: number; month: number; dateBasis: "createdAt" };
    budgetCount: number;
    statusCounts: Record<BudgetStatus, number>;
    statusTotals: Record<BudgetStatus, BudgetStatusTotals>;
    open: {
        statuses: BudgetStatus[];
        count: number;
        finalAmount: number;
        pagination: { page: number; limit: number; total: number; totalPages: number };
        budgets: Array<{
            id: string; status: BudgetStatus; finalAmount: number;
            createdAt: string; updatedAt: string;
            client: { id: string; name: string };
            equipament: { id: string; type: string; brand: string; model: string | null; mainIdentification: string | null; additionalIdentification: string | null };
            itemCount: number;
        }>;
    };
    financialNote: string;
}
export interface BudgetMetricsResponse {
    year: number;
    dateBasis: "createdAt";
    annual: { budgetCount: number; totalAmount: number; finalAmount: number };
    statusTotals: Record<BudgetStatus, BudgetStatusTotals>;
    monthly: Array<{
        month: number; budgetCount: number; totalAmount: number; finalAmount: number;
        statusCounts: Record<BudgetStatus, number>;
        statusTotals: Record<BudgetStatus, BudgetStatusTotals>;
    }>;
    interpretation: string;
}
export interface FindBudgetsByAdvancedFilters {
    search?: string; budgetId?: string; clientId?: string; clientName?: string;
    clientDocument?: string; equipamentId?: string; equipamentSearch?: string;
    status?: BudgetStatus; paymentCondition?: string; validity?: string; warranty?: string;
    deliveryTime?: string; observations?: string;
    totalAmountMin?: number; totalAmountMax?: number;
    globalDiscountMin?: number; globalDiscountMax?: number;
    finalAmountMin?: number; finalAmountMax?: number;
    createdAtFrom?: string; createdAtTo?: string; updatedAtFrom?: string; updatedAtTo?: string;
    itemId?: string; itemTitle?: string; itemDescription?: string;
    itemCategoryId?: string; itemCategoryName?: string;
    itemQuantityMin?: number; itemQuantityMax?: number;
    itemUnitValueMin?: number; itemUnitValueMax?: number;
    itemTotalAmountMin?: number; itemTotalAmountMax?: number;
    itemDiscountMin?: number; itemDiscountMax?: number;
    historyId?: string; historyEventType?: string; historyDescription?: string;
    historyCreatedAtFrom?: string; historyCreatedAtTo?: string;
    page?: number; limit?: number;
}
export interface BudgetSearchSummary {
    id: string; clientId: string; equipamentId: string; status: BudgetStatus;
    validity: string; warranty: string; deliveryTime: string; paymentCondition: string;
    totalAmount: number; globalDiscount: number; finalAmount: number;
    createdAt: string; updatedAt: string;
    client: { id: string; name: string; document: string | null };
    equipament: { id: string; type: string; brand: string; model: string | null; mainIdentification: string | null; additionalIdentification: string | null };
    _count?: { items: number };
}
export interface FindBudgetsByAdvancedFiltersResponse {
    budgets: BudgetSearchSummary[];
    page: number; limit: number; total: number; totalPages: number;
}
export interface BudgetDetailsResponse {
    budget: BudgetRecord;
    client: { id: string; name: string; document: string | null; address: string | null };
    equipament: {
        id: string; type: string; brand: string; model: string | null;
        mainIdentification: string | null; additionalIdentification: string | null;
    };
    totals: {
        itemCount: number; categoryCount: number; grossAmount: number;
        itemDiscountAmount: number; totalAmount: number; globalDiscount: number;
        globalDiscountAmount: number; finalAmount: number;
    };
    items: {
        total: number;
        categories: Array<{
            id: string; name: string; description: string | null; isActive: boolean;
            itemCount: number; quantityTotal: number; grossAmount: number;
            itemDiscountAmount: number; totalAmount: number;
            items: Array<{
                id: string; title: string; description: string | null; quantity: number;
                unitValue: number; discount: number; grossAmount: number;
                discountAmount: number; totalAmount: number; createdAt: string; updatedAt: string;
            }>;
        }>;
    };
    history: BudgetHistoryEvent[];
}
