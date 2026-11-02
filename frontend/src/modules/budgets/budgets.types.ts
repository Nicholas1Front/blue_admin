export type BudgetStatus = "rascunho" | "enviado" | "aprovado" | "rejeitado" | "expirado" | "cancelado";
export type BudgetNumericValue = number | string;

export interface BudgetRecord {
    id: string;
    clientId: string;
    equipamentId: string;
    validity: string;
    warranty: string;
    deliveryTime: string;
    paymentCondition: string;
    observations: string | null;
    totalAmount: BudgetNumericValue;
    globalDiscount: BudgetNumericValue;
    finalAmount: BudgetNumericValue;
    status: BudgetStatus;
    createdAt: string;
    updatedAt: string;
}
export interface BudgetHistoryEvent {
    id: string;
    budgetId: string;
    eventType: string;
    description: string;
    createdAt: string;
}
export interface CreateBudgetRequest {
    clientId: string;
    equipamentId: string;
    validity?: string;
    warranty?: string;
    deliveryTime?: string;
    paymentCondition?: string;
    observations?: string | null;
    globalDiscount?: number;
    status?: BudgetStatus;
}
export interface CreateBudgetFromServiceRequest {
    serviceId: string;
    items: Array<{ activityId: string; budgetCategoryId: string }>;
}
export interface UpdateBudgetRequest {
    clientId?: string;
    equipamentId?: string;
    validity?: string;
    warranty?: string;
    deliveryTime?: string;
    paymentCondition?: string;
    observations?: string | null;
    globalDiscount?: number;
    status?: BudgetStatus;
}
export interface FindBudgetsFilters {
    id?: string; clientId?: string; equipamentId?: string; validity?: string;
    warranty?: string; deliveryTime?: string; paymentCondition?: string;
    observations?: string; status?: string;
    totalAmountMin?: number; totalAmountMax?: number;
    globalDiscountMin?: number; globalDiscountMax?: number;
    finalAmountMin?: number; finalAmountMax?: number;
    createdAtFrom?: string; createdAtTo?: string;
    updatedAtFrom?: string; updatedAtTo?: string;
    historyId?: string; historyEventType?: string; historyDescription?: string;
    historyCreatedAtFrom?: string; historyCreatedAtTo?: string;
    page?: number; limit?: number;
}
export interface PaginatedBudgetsResponse {
    budgets: BudgetRecord[];
    page: number; limit: number; total: number; totalPages: number;
}
export interface BudgetConversionResponse {
    budget: BudgetRecord;
    items: Array<Record<string, unknown>>;
    history: BudgetHistoryEvent;
}
