export interface ApiResponse<T> {
    message : string,
    data : T
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
