export interface F1ApiOptions {
  baseUrl: string;
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
  cacheTtlMs: number;
}

export const F1_API_OPTIONS = Symbol('F1_API_OPTIONS');
export const F1_API_FETCH = Symbol('F1_API_FETCH');
