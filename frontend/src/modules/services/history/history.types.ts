import type { ServiceHistoryEvent } from "../services.types";

export type { ServiceHistoryEvent };

export interface ServiceHistoryFilters {
    historyId?: string;
    historyEventType?: string;
    historyDescription?: string;
    historyDateFrom?: string;
    historyDateTo?: string;
}
