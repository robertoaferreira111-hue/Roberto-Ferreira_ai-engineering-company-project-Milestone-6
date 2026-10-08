"use client";

import { useCallback, useState } from "react";

import type { ApiError, ApiResult } from "@/types";

interface AsyncState<TData> {
  data: TData | null;
  isLoading: boolean;
  error: ApiError | null;
}

interface UseAsyncReturn<TArgs extends unknown[], TData> extends AsyncState<TData> {
  execute: (...args: TArgs) => Promise<ApiResult<TData>>;
  reset: () => void;
}

export function useAsync<TArgs extends unknown[], TData>(
  asyncFunction: (...args: TArgs) => Promise<ApiResult<TData>>
): UseAsyncReturn<TArgs, TData> {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<ApiResult<TData>> => {
      setIsLoading(true);
      setError(null);

      const result = await asyncFunction(...args);

      if (result.error) {
        setData(null);
        setError(result.error);
      } else {
        setData(result.data);
      }

      setIsLoading(false);
      return result;
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    reset
  };
}