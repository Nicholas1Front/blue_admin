import { getServiceById } from "../services.api";
import type { ServiceHistoryEvent } from "../services.types";

/**
 * Service history is audit data created by backend operations. The backend
 * exposes it through the service details query, not through standalone CRUD
 * routes, so this helper intentionally only reads it.
 */
export async function getServiceHistory(
    serviceId: string
): Promise<ServiceHistoryEvent[]> {
    const details = await getServiceById(serviceId);
    return details.history;
}
