import { useQuery } from "@tanstack/react-query";

import { servicesQueryKeys } from "../services.queryKeys";
import { getServiceById } from "../services.api";

export function useServiceHistory(serviceId: string | undefined) {
    return useQuery({
        queryKey: servicesQueryKeys.queries.details(serviceId),
        queryFn: () => getServiceById(serviceId!),
        enabled: Boolean(serviceId),
        select: (details) => details.history
    });
}
