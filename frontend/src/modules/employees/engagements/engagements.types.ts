export type EngagementModality = "CLT" | "PJ" | "Informal" | "outros";
export type EngagementStatus = "trabalhando" | "afastado" | "demitiu-se" | "demitido";
export type EmployeeAmount = number | string;
export interface EmployeeEngagement {
    id: string; employeeId: string; entryDate: string | null; exitDate: string | null;
    status: EngagementStatus; currentSalary: EmployeeAmount | null;
    hourlyRate: EmployeeAmount | null; modality: EngagementModality;
    observations: string | null; createdAt: string; updatedAt: string;
}
export interface EngagementListItem extends EmployeeEngagement {
    employee: { id: string; name: string; document: string | null };
}
export interface CreateEngagementRequest {
    entryDate?: string | null; exitDate?: string | null; status: EngagementStatus;
    currentSalary?: number | null; hourlyRate?: number | null;
    modality: EngagementModality; observations?: string | null;
}
export interface UpdateEngagementRequest extends Partial<Omit<CreateEngagementRequest, "status" | "modality">> {
    status?: EngagementStatus; modality?: EngagementModality; effectiveDate?: string;
}
export interface EngagementMutationResponse {
    engagement: EmployeeEngagement; history: import("../employees.types").EmployeeHistoryEvent;
}
export interface FindEngagementsFilters {
    employeeId?: string; employeeName?: string; status?: EngagementStatus;
    modality?: EngagementModality; entryDateFrom?: string; entryDateTo?: string;
    exitDateFrom?: string; exitDateTo?: string; cursor?: string; limit?: number;
}
