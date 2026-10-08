import type { ApiError, ApiResult } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function buildApiUrl(pathname: string): string {
  if (!API_URL) return pathname.startsWith("/") ? pathname : `/${pathname}`;

  return new URL(pathname, `${API_URL.endsWith("/") ? API_URL : `${API_URL}/`}`).toString();
}

function toApiError(status: number, payload: unknown, fallbackMessage: string): ApiError {
  if (payload && typeof payload === "object") {
    const maybeMessage = "error" in payload ? payload.error : "message" in payload ? payload.message : undefined;

    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return {
        status,
        message: maybeMessage,
        details: payload
      };
    }
  }

  return {
    status,
    message: fallbackMessage,
    details: payload
  };
}

export async function apiRequest<TResponse>(pathname: string, init?: RequestInit): Promise<ApiResult<TResponse>> {
  const requestInit: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  };

  try {
    const response = await fetch(buildApiUrl(pathname), requestInit);
    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      return {
        data: null,
        error: toApiError(response.status, payload, response.statusText || "Request failed")
      };
    }

    return {
      data: payload as TResponse,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: {
        status: 0,
        message: error instanceof Error ? error.message : "Unexpected network error",
        details: error
      }
    };
  }
}