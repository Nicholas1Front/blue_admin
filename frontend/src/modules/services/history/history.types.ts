export type { ServiceHistoryEvent } from "../services.types";

export interface ServiceHistoryFilters {
    historyId?: string;
    historyEventType?: string;
    historyDescription?: string;
    historyDateFrom?: string;
    historyDateTo?: string;
}
