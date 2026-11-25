import type { CursorPage, EmployeeHistoryEvent, EmployeeRecord } from "../employees.types";
import type { EmployeeEngagement, EngagementModality, EngagementStatus } from "../engagements/engagements.types";
import type { ObligationType, ObligationStatus, ObligationWithBalance } from "../obligations/obligations.types";
import type { EmployeeMovement, MovementListItem } from "../movements/movements.types";
export type EmployeeDashboardFilters = { movementsCursor?: string; movementsLimit?: number } & ({ month: number; year: number } | { month?: never; year?: never });
export interface DashboardObligation {
    id: string; engagementId: string; type: ObligationType; title: string;
    referenceStart: string | null; referenceEnd: string | null; dueDate: string | null;
    finalValue: number; paidValue: number; outstandingValue: number; status: ObligationStatus;
    employeeId: string | null; employeeName: string | null;
}
export interface EmployeeDashboardResponse {
    period: { month: number; year: number; startDate: string; endDate: string; daysRemaining: number };
    totals: { employees: number; openObligations: number; totalOpenValue: number; obligationsDueThisMonth: number; dueThisMonthValue: number; overdueValue: number; paymentsRecordedThisMonth: number };
    nextObligation: DashboardObligation | null;
    employees: Array<{ employeeId: string; name: string; totalOpenValue: number; obligationsDueThisMonth: number; dueThisMonthValue: number; overdueValue: number; paymentsRecordedThisMonth: number; absencesThisMonth: number; tardinessThisMonth: number }>;
    obligationsDueThisMonth: DashboardObligation[];
    overdueObligations: DashboardObligation[];
    recentMovements: CursorPage<MovementListItem>;
}
export interface EmployeeEngagementSummary {
    id: string; status: EngagementStatus; modality: EngagementModality;
    entryDate: string | null; exitDate: string | null; currentSalary: number | null;
    totalOutstanding: number; openObligations: number;
    obligations: Array<{
        id: string; type: ObligationType; title: string; dueDate: string | null;
        referenceStart: string | null; referenceEnd: string | null;
        finalValue: number; paidValue: number; outstandingValue: number;
    }>;
    absencesThisMonth: number; tardinessThisMonth: number;
}
export interface EmployeeSummaryItem {
    id: string; name: string; document: string | null; totalOutstanding: number;
    openObligations: number; absencesThisMonth: number; tardinessThisMonth: number;
    engagements: EmployeeEngagementSummary[];
}
export interface EmployeeSummaryFilters {
    employeeId?: string; name?: string; document?: string; engagementId?: string;
    status?: EngagementStatus; modality?: EngagementModality;
    month?: number; year?: number; cursor?: string; limit?: number;
}
export interface EmployeeSummaryResponse { data: EmployeeSummaryItem[]; period: { month: number; year: number }; pagination: { limit: number; hasMore: boolean; nextCursor: string | null }; }
export interface FinancialSummaryObligation {
    id: string; type: ObligationType; title: string; referenceStart: string | null;
    referenceEnd: string | null; dueDate: string | null; status: ObligationStatus;
    finalValue: number; paidValue: number; outstandingValue: number;
}
export interface EngagementFinancialSummary {
    employee: { id: string; name: string }; engagementId: string;
    totalOutstanding: number; openObligationsCount: number;
    obligationsByType: Array<{ type: ObligationType; totalOutstanding: number; count: number }>;
    overdueObligations: FinancialSummaryObligation[];
    upcomingObligations: FinancialSummaryObligation[];
}
export interface MonthlyPaymentsFilters { month: number; year: number; employeeId?: string; engagementId?: string; cursor?: string; limit?: number; }
export interface MonthlyPaymentItem {
    id: string; engagementId: string; description: string; eventDate: string | null;
    value: number | null; obligationId: string | null; financialTransactionId: string | null; createdAt: string;
    engagement: { employee: { id: string; name: string } };
    obligation: { id: string; type: ObligationType; title: string; referenceStart: string | null; referenceEnd: string | null } | null;
    financialTransaction: { id: string; description: string; referenceDate: string; value: number } | null;
}
export interface MonthlyPaymentsResponse {
    period: { month: number; year: number; startDate: string; endDate: string };
    data: MonthlyPaymentItem[];
    totals: { count: number; value: number };
    pagination: { limit: number; hasMore: boolean; nextCursor: string | null };
}
export interface EmployeeHistoryFilters { eventType?: string; cursor?: string; limit?: number; }
export type EmployeeHistoryResponse = CursorPage<EmployeeHistoryEvent>;
export interface EmployeeOverviewFilters { obligationsCursor?: string; obligationsLimit?: number; movementsCursor?: string; movementsLimit?: number; historyCursor?: string; historyLimit?: number; }
export interface EmployeeOverviewResponse {
    employee: EmployeeRecord;
    engagements: EmployeeEngagement[];
    obligations: { byEngagement: Record<string, ObligationWithBalance[]>; pagination: { limit: number; hasMore: boolean; nextCursor: string | null } };
    movements: { byEngagement: Record<string, EmployeeMovement[]>; pagination: { limit: number; hasMore: boolean; nextCursor: string | null } };
    history: { employee: EmployeeHistoryEvent[]; byEngagement: Record<string, EmployeeHistoryEvent[]>; pagination: { limit: number; hasMore: boolean; nextCursor: string | null } };
}
export interface ConsistencyAnalysis {
    employee: { id: string; name: string };
    summary: { missingObligation: number; obligationBalance: number; transactionAllocation: number; invalidObligationLink: number };
    findings: Record<string, unknown[]>;
}
