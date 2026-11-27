import type { CursorPage } from "../employees.types";
import type { EmployeeAmount } from "../engagements/engagements.types";
export type ObligationType = "salario" | "ferias" | "decimo_terceiro" | "bonificacao" | "rescisao" | "ajuste" | "outros";
export type ObligationStatus = "em_revisao" | "pendente" | "parcial" | "pago" | "cancelado";
export interface EmployeeObligation {
    id: string; engagementId: string; type: ObligationType; title: string;
    description: string | null; referenceStart: string | null; referenceEnd: string | null;
    dueDate: string | null; originalValue: EmployeeAmount; finalValue: EmployeeAmount;
    status: ObligationStatus; observations: string | null; createdAt: string; updatedAt: string;
}
export interface ObligationWithBalance extends EmployeeObligation {
    paidValue: number; outstandingValue: number;
}
export interface OpenObligation {
    id: string; type: ObligationType; title: string; referenceStart: string | null;
    referenceEnd: string | null; dueDate: string | null; status: ObligationStatus;
    finalValue: number; paidValue: number; outstandingValue: number;
}
export interface ObligationListItem extends ObligationWithBalance {
    engagement: { id: string; employee: { id: string; name: string; document: string | null } };
}
export interface CreateObligationRequest {
    type: ObligationType; title: string; description?: string | null;
    referenceStart?: string | null; referenceEnd?: string | null; dueDate?: string | null;
    originalValue: number; finalValue: number; status: ObligationStatus;
    observations?: string | null;
}
export type UpdateObligationRequest = Partial<CreateObligationRequest>;
export interface FindObligationsFilters {
    employeeId?: string; employeeName?: string; engagementId?: string;
    type?: ObligationType; status?: ObligationStatus; title?: string;
    valueFrom?: number; valueTo?: number;
    dueDateFrom?: string; dueDateTo?: string;
    referenceStartFrom?: string; referenceStartTo?: string;
    referenceEndFrom?: string; referenceEndTo?: string;
    cursor?: string; limit?: number;
}
export interface CreateObligationsBatchRequest { obligations: CreateObligationRequest[] }
export interface AnalyzeObligationsFilters {
    startMonth: number; startYear: number; endMonth: number; endYear: number;
    calculateSalary: boolean; calculateVacation: boolean; calculateThirteenthSalary: boolean;
}
export interface ObligationSuggestion {
    type: ObligationType; action: "create" | "update" | "none" | "manual_review";
    title: string; referenceStart: string; referenceEnd: string; dueDate: string | null;
    estimatedValue: number | null; recognizedValue: number | null; recognizedStatus?: ObligationStatus;
    paidValue: number; balance: number | null; calculation: string; warnings: string[];
    isProjection: boolean; monthsWorked?: number; concessionDeadline?: string; obligationId?: string;
    createPayload?: CreateObligationRequest;
    updatePayload?: { originalValue: number; finalValue: number };
}
export interface ObligationAnalysis {
    period: { startMonth: number; startYear: number; endMonth: number; endYear: number };
    summary: { recognizedOutstanding: number; suggestedToCreate: number; manualReviewEstimate: number };
    suggestions: ObligationSuggestion[]; warnings: string[];
}
export type ObligationPage = CursorPage<ObligationListItem>;

export interface DeleteObligationWithMovementsRequest {
    deleteLinkedMovements: true;
}
export interface DeleteObligationWithMovementsResponse {
    obligationId: string;
    deletedMovements: number;
    preservedFinancialTransactions: number;
}
