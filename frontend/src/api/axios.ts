import axios, { AxiosError } from "axios";

import { ApiError } from "./ApiError";
import type { ApiErrorResponse } from "./api.types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;

      throw new ApiError(
        apiError.message,
        error.response.status,
        apiError.code,
        apiError.details,
      );
    }

    throw error;
  },
);