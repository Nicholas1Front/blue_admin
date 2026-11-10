export type VehicleEventType =
    | "maintenance"
    | "issue"
    | "observation"
    | "problem_solved"
    | "odometer_reset";

export type VehicleHistoryCreatableEventType = Exclude<VehicleEventType, "odometer_reset">;

export interface VehicleRecord {
    id: string;
    title: string;
    plate: string | null;
    renavam: string | null;
    crlv: string | null;
    crv: string | null;
    currentKilometer: number | null;
    observations: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface VehicleHistoryEvent {
    id: string;
    vehicleId: string;
    eventType: VehicleEventType;
    description: string;
    kilometerSnapshot: number | null;
    eventDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateVehicleRequest {
    title: string;
    plate?: string | null;
    renavam?: string | null;
    crlv?: string | null;
    crv?: string | null;
    currentKilometer?: number | null;
    observations?: string | null;
}

export interface UpdateVehicleRequest {
    title?: string;
    plate?: string | null;
    renavam?: string | null;
    crlv?: string | null;
    crv?: string | null;
    observations?: string | null;
}

export interface UpdateVehicleOdometerRequest {
    kilometer: number;
    isReset?: boolean;
    description?: string;
}

export interface CreateVehicleHistoryRequest {
    eventType: VehicleHistoryCreatableEventType;
    description: string;
    kilometerSnapshot?: number | null;
    eventDate?: string;
}

export interface UpdateVehicleHistoryRequest {
    eventType?: VehicleHistoryCreatableEventType;
    description?: string;
    kilometerSnapshot?: number | null;
    eventDate?: string;
}

export interface VehicleDashboardFilters {
    page?: number;
    limit?: number;
}

export interface VehicleSummary extends Pick<
    VehicleRecord,
    "id" | "title" | "plate" | "renavam" | "currentKilometer" | "createdAt" | "updatedAt"
> {
    historyCount: number;
    lastEvent: Pick<
        VehicleHistoryEvent,
        "id" | "eventType" | "description" | "kilometerSnapshot" | "eventDate" | "createdAt"
    > | null;
}

export interface VehicleDashboardResponse {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    vehicles: VehicleSummary[];
}

export interface FindVehicleHistoryByPeriodFilters {
    startDate: string;
    endDate: string;
}

export interface VehicleWithHistoryByPeriod extends VehicleRecord {
    period: {
        startDate: string;
        endDate: string;
        dateBasis: "eventDate";
    };
    history: VehicleHistoryEvent[];
}

export interface FindVehiclesByFilters {
    search?: string;
    vehicleId?: string;
    title?: string;
    plate?: string;
    renavam?: string;
    crlv?: string;
    crv?: string;
    observations?: string;
    currentKilometerMin?: number;
    currentKilometerMax?: number;
    vehicleCreatedAtFrom?: string;
    vehicleCreatedAtTo?: string;
    vehicleUpdatedAtFrom?: string;
    vehicleUpdatedAtTo?: string;
    historyId?: string;
    historyEventType?: VehicleEventType;
    historyDescription?: string;
    historyKilometerMin?: number;
    historyKilometerMax?: number;
    historyDateFrom?: string;
    historyDateTo?: string;
    page?: number;
    limit?: number;
}

export interface VehicleFilteredSummary extends Pick<
    VehicleRecord,
    "id" | "title" | "plate" | "renavam" | "currentKilometer" | "createdAt" | "updatedAt"
> {
    _count: {
        history: number;
    };
    history: Array<
        Pick<
            VehicleHistoryEvent,
            "id" | "eventType" | "description" | "kilometerSnapshot" | "eventDate" | "createdAt"
        >
    >;
}

export interface FindVehiclesByFiltersResponse {
    vehicles: VehicleFilteredSummary[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
