export type ServiceStatus =
    | "pendente"
    | "aguardando_resposta_cliente"
    | "cancelado"
    | "aguardando_peças"
    | "em_execução"
    | "finalizado"
    | "equipamento_saiu"
    | "aguardando_pagamento"
    | "pagamento_atrasado"
    | "pagamento_recebido";

export type ServiceActivityStatus =
    | "pendente"
    | "em_execução"
    | "concluida"
    | "cancelada";

export type ServiceTitheStatus = "aguardando" | "não concluído" | "concluído";
export type ServiceFinancialType = "income" | "expense";
export type ServiceNumericValue = number | string;

export interface ServiceClientSummary {
    id: string;
    name: string;
    document: string | null;
}

export interface ServiceEquipamentSummary {
    id: string;
    type: string;
    brand: string;
    model: string | null;
    mainIdentification: string | null;
    additionalIdentification: string | null;
}

export interface ServiceRecord {
    id: string;
    clientId: string;
    equipamentId: string;
    entryDate: string;
    exitDate: string | null;
    status: ServiceStatus;
    hoursWorked: ServiceNumericValue | null;
    costPerHour: ServiceNumericValue | null;
    titheStatus: ServiceTitheStatus | null;
    titheTransactionId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceSummary extends Omit<ServiceRecord, "hoursWorked" | "costPerHour"> {
    hoursWorked: number | null;
    costPerHour: number | null;
    client: ServiceClientSummary;
    equipament: ServiceEquipamentSummary;
    activityCount: number;
}

export interface CreateServiceRequest {
    clientId: string;
    equipamentId: string;
    entryDate: string;
    exitDate?: string | null;
    status?: ServiceStatus;
    hoursWorked?: number | null;
    description: string;
}

export interface UpdateServiceRequest {
    clientId?: string;
    equipamentId?: string;
    entryDate?: string;
    exitDate?: string | null;
    hoursWorked?: number | null;
    /**
     * true recalculates the snapshot from active monthly expenses;
     * false/null clears it; a number sets a manual snapshot value.
     */
    costPerHour?: boolean | number | null;
    description: string;
}

export interface UpdateServiceStatusRequest {
    status: ServiceStatus;
    description: string;
}

export interface FindServicesByLegacyFilters {
    id?: string;
    clientId?: string;
    equipamentId?: string;
    entryDate?: string;
    exitDate?: string | null;
    status?: string;
    hoursWorked?: number | null;
    costPerHour?: number | null;
    titheTransactionId?: string | null;
    titheStatus?: string | null;
    showHistory?: boolean;
}

export interface ServiceDashboardFilters {
    year: number;
    month?: number;
    page?: number;
    limit?: number;
}

export interface ServiceDashboardResponse {
    period: {
        year: number;
        month: number | null;
        dateBasis: "entryDate";
    };
    serviceCount: number;
    statusCounts: Record<ServiceStatus, number>;
    financial: {
        incomeTotal: number;
        expenseTotal: number;
        balanceTotal: number;
        dateBasis: "referenceDate";
        includedOrigins: Array<"services" | "service_tithe">;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    services: ServiceSummary[];
}

export interface FindServicesByAdvancedFilters {
    search?: string;
    serviceId?: string;
    clientId?: string;
    clientName?: string;
    clientDocument?: string;
    equipamentId?: string;
    equipamentSearch?: string;
    serviceStatus?: ServiceStatus;
    entryDateFrom?: string;
    entryDateTo?: string;
    exitDateFrom?: string;
    exitDateTo?: string;
    exitDateIsNull?: boolean;
    hoursWorkedMin?: number;
    hoursWorkedMax?: number;
    titheStatus?: ServiceTitheStatus;
    titheTransactionId?: string;
    activityId?: string;
    activityTitle?: string;
    activityDescription?: string;
    activityStatus?: ServiceActivityStatus;
    activityStartFrom?: string;
    activityStartTo?: string;
    activityEndFrom?: string;
    activityEndTo?: string;
    transactionType?: ServiceFinancialType;
    transactionCategoryId?: string;
    transactionCategoryName?: string;
    transactionDescription?: string;
    transactionValueMin?: number;
    transactionValueMax?: number;
    transactionReferenceDateFrom?: string;
    transactionReferenceDateTo?: string;
    historyId?: string;
    historyEventType?: string;
    historyDescription?: string;
    historyDateFrom?: string;
    historyDateTo?: string;
    page?: number;
    limit?: number;
}

type ServiceAppliedFilters = {
    [Key in keyof Omit<FindServicesByAdvancedFilters, "page" | "limit">]-?:
        Omit<FindServicesByAdvancedFilters, "page" | "limit">[Key] | null;
};

export interface FindServicesByAdvancedFiltersResponse {
    filters: ServiceAppliedFilters;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    services: ServiceSummary[];
}

export interface ServiceClientDetails {
    name: string;
    document: string | null;
}

export interface ServiceEquipamentDetails {
    id: string;
    clientId: string;
    type: string;
    brand: string;
    model: string | null;
    mainIdentification: string | null;
    additionalIdentification: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceActivity {
    id: string;
    serviceId: string;
    title: string;
    description: string | null;
    startAt: string | null;
    endAt: string | null;
    status: ServiceActivityStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceHistoryEvent {
    id: string;
    serviceId: string;
    eventType: string;
    description: string;
    createdAt: string;
}

export interface ServiceFinancialTransaction {
    id: string;
    description: string;
    value: number;
    type: ServiceFinancialType;
    categoryId: string;
    categoryName: string;
    referenceDate: string;
    originType: string | null;
    originId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceDetailsResponse {
    service: Omit<ServiceRecord, "hoursWorked" | "costPerHour"> & {
        hoursWorked: number | null;
        costPerHour: number | null;
    };
    client: ServiceClientDetails;
    equipament: ServiceEquipamentDetails;
    activities: {
        total: number;
        byStatus: Record<ServiceActivityStatus, number>;
        list: ServiceActivity[];
    };
    financial: {
        incomeTotal: number;
        expenseTotal: number;
        operationalCost: number;
        tithe: {
            status: ServiceTitheStatus;
            isPaid: boolean;
            value: number;
            transaction: ServiceFinancialTransaction | null;
        };
        transactions: ServiceFinancialTransaction[];
    };
    history: ServiceHistoryEvent[];
}

export interface ServiceMutationResponse {
    service: ServiceRecord;
    history: ServiceHistoryEvent;
}

export interface ServiceDeleteResponse {
    message: string;
}

/** Backwards-compatible names for the original advanced-query contract. */
export type FindServicesByFilters = FindServicesByAdvancedFilters;
export type FindServicesByFiltersResponse = FindServicesByAdvancedFiltersResponse;
