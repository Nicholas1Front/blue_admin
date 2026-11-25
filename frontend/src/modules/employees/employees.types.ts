import type { EmployeeEngagement } from "./engagements/engagements.types";

export interface EmployeeRecord {
    id: string;
    name: string;
    document: string | null;
    address: string | null;
    birthDate: string | null;
    observations: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface EmployeeListItem extends EmployeeRecord { _count: { engagements: number } }
export interface EmployeeSummaryRecord {
    id: string; name: string; document: string | null;
    totalOutstanding: number; openObligations: number;
    absencesThisMonth: number; tardinessThisMonth: number;
    engagements: EmployeeEngagement[];
}
export interface CreateEmployeeRequest {
    name: string; document?: string | null; address?: string | null;
    birthDate?: string | null; observations?: string | null;
}
export type UpdateEmployeeRequest = Partial<CreateEmployeeRequest>;
export interface EmployeeMutationResponse {
    employee: EmployeeRecord; history: EmployeeHistoryEvent;
}
export interface EmployeeHistoryEvent {
    id: string; employeeId: string; engagementId: string | null;
    eventType: string; description: string; metadata: unknown;
    eventDate: string | null; createdAt: string;
}
export interface CursorPagination {
    limit: number; hasMore: boolean; nextCursor: string | null;
}
export interface CursorPage<T> { data: T[]; pagination: CursorPagination }
export interface FindEmployeesFilters {
    name?: string; document?: string; address?: string;
    birthDateFrom?: string; birthDateTo?: string;
    cursor?: string; limit?: number;
}
