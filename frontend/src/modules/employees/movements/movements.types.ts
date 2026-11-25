import type { CursorPage } from "../employees.types";
import type { EmployeeAmount } from "../engagements/engagements.types";
import type { ObligationType } from "../obligations/obligations.types";
export type EmployeeMovementType = "falta" | "atraso" | "saida_antecipada" | "bonificacao" | "decimo_terceiro" | "ferias" | "rescisao" | "ajuste" | "anotacao" | "pagamento";
export type MovementCreationType = Exclude<EmployeeMovementType, "pagamento">;
export interface EmployeeMovement {
    id: string; engagementId: string; type: EmployeeMovementType; description: string;
    eventDate: string | null; referenceStart?: string | null; referenceEnd?: string | null;
    value: EmployeeAmount | null; obligationId: string | null; financialTransactionId: string | null;
    observations?: string | null; createdAt: string; updatedAt?: string;
    obligation?: { id: string; type: ObligationType; title: string; referenceStart: string | null; referenceEnd: string | null; dueDate?: string | null; finalValue?: number; status?: string } | null;
    financialTransaction?: { id: string; description: string; value: number; referenceDate: string; categoryId?: string; type?: string } | null;
}
export interface MovementListItem extends EmployeeMovement {
    engagement: { id?: string; employee: { id: string; name: string; document?: string | null } };
}
export interface CreateMovementRequest {
    type: MovementCreationType; description: string;
    eventDate?: string | null; referenceStart?: string | null; referenceEnd?: string | null;
    value?: number | null; obligationId?: string | null; observations?: string | null;
}
export type UpdateMovementRequest = Partial<CreateMovementRequest>;
export interface CreatePaymentRequest {
    categoryId?: string; createFinancialTransaction?: boolean; financialTransactionId?: string;
    obligationId: string; description: string; value: number; eventDate?: string | null;
    observations?: string | null;
}
export interface UpdatePaymentRequest {
    categoryId?: string; createFinancialTransaction?: boolean; obligationId?: string;
    description: string; value: number; eventDate?: string | null; observations?: string | null;
}
export interface FindMovementsFilters {
    employeeId?: string; employeeName?: string; engagementId?: string;
    type?: EmployeeMovementType; description?: string; obligationId?: string;
    financialTransactionId?: string; eventDateFrom?: string; eventDateTo?: string;
    cursor?: string; limit?: number; order?: "asc" | "desc";
}
export interface FindEngagementMovementsFilters {
    type?: EmployeeMovementType; startDate?: string; endDate?: string; order?: "asc" | "desc";
}
export type MovementPage = CursorPage<MovementListItem>;
