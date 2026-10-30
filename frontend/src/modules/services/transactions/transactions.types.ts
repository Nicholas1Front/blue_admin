import type { ServiceFinancialType, ServiceNumericValue, ServiceRecord, ServiceTitheStatus } from "../services.types";
import type { FinancialType } from "../../financial/shared/financial.types";

export interface ServiceTransaction {
    id: string;
    description: string;
    value: ServiceNumericValue;
    type: ServiceFinancialType | string;
    categoryId: string;
    referenceDate: string;
    originType: string | null;
    originId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceTransactionWithCategory extends ServiceTransaction {
    categoryName: string;
}

export interface LinkServiceTransactionRequest {
    id: string;
}

export interface ServiceTransactionLinkResponse {
    service: ServiceRecord;
    transaction: ServiceTransaction | null;
}

export interface UnlinkServiceTransactionResponse extends ServiceTransaction {
    originId: null;
    originType: null;
    titheForService?: { id: string } | null;
}

export interface ServiceTitheLinkResponse {
    service: ServiceRecord & {
        titheStatus: ServiceTitheStatus | null;
        titheTransactionId: string | null;
    };
    transaction: ServiceTransaction | null;
}


export interface AvailableTransactionsFilters {
    year?: number;
    month?: number;
    page: number;
    limit: number;
    categoryId?: string;
    value?: number;
    type: FinancialType;
    search?: string;
}

export interface AvailableTransactionsResponse {
    transactions: import("../../financial/transactions/transactions.types").FinancialTransactionListItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
