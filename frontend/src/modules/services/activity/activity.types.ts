import type { ServiceActivityStatus, ServiceRecord } from "../services.types";

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

export interface CreateServiceActivityRequest {
    title: string;
    description?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    status?: ServiceActivityStatus;
}

export interface UpdateServiceActivityRequest {
    title?: string;
    description?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    status?: ServiceActivityStatus;
}

export interface FindServiceActivitiesFilters {
    id?: string;
    serviceId?: string;
    title?: string;
    description?: string | null;
    startAt?: string | null;
    endAt?: string | null;
    status?: ServiceActivityStatus;
}

export interface ServiceActivityMutationResponse {
    service: ServiceRecord;
    activity: ServiceActivity;
}

export interface ServiceActivitiesByServiceResponse {
    service: ServiceRecord;
    activity: ServiceActivity[];
}

export interface ServiceActivitiesByFiltersGroup {
    service: ServiceRecord;
    activities: ServiceActivity[];
}
