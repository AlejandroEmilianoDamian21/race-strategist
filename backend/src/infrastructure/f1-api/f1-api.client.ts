import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  DataSourceUnavailableError,
  type DataSourceFailure,
} from '../../application/errors/data-source-unavailable.error.js';
import { F1ApiHttpError } from './f1-api.http-error.js';
import {
  F1_API_FETCH,
  F1_API_OPTIONS,
  type F1ApiOptions,
} from './f1-api.options.js';
import type { ApiEnvelope } from './f1-api.types.js';

const LIVENESS_PATH = '/api/__health/liveness';

class RetryableFailure extends Error {
  constructor(readonly reason: DataSourceFailure) {
    super(reason);
  }
}

const isTimeout = (error: unknown): boolean =>
  error instanceof Error &&
  (error.name === 'TimeoutError' || error.name === 'AbortError');

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class F1ApiClient {
  private readonly logger = new Logger(F1ApiClient.name);
  private readonly fetchImpl: typeof fetch;

  constructor(
    @Inject(F1_API_OPTIONS) private readonly options: F1ApiOptions,
    @Optional() @Inject(F1_API_FETCH) fetchImpl?: typeof fetch,
  ) {
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async getData<T>(path: string): Promise<T> {
    const body = await this.requestWithRetries(path, this.options.retries);
    if (body.data === undefined || body.data === null) {
      throw new DataSourceUnavailableError('invalid-response', path);
    }
    return body.data as T;
  }

  async ping(): Promise<void> {
    await this.requestWithRetries(LIVENESS_PATH, 0);
  }

  private async requestWithRetries(
    path: string,
    retries: number,
  ): Promise<ApiEnvelope<unknown>> {
    const attempts = retries + 1;
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.requestOnce(path);
      } catch (error) {
        if (!(error instanceof RetryableFailure)) {
          throw error;
        }
        this.logger.warn(
          `Attempt ${attempt}/${attempts} failed for ${path}: ${error.reason}`,
        );
        if (attempt >= attempts) {
          throw new DataSourceUnavailableError(error.reason, path);
        }
        await sleep(this.options.retryDelayMs);
      }
    }
  }

  private async requestOnce(path: string): Promise<ApiEnvelope<unknown>> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.options.baseUrl}${path}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (error) {
      throw new RetryableFailure(isTimeout(error) ? 'timeout' : 'network');
    }

    if (response.status >= 500) {
      throw new RetryableFailure('server-error');
    }

    let body: ApiEnvelope<unknown>;
    try {
      body = (await response.json()) as ApiEnvelope<unknown>;
    } catch (error) {
      if (isTimeout(error)) {
        throw new RetryableFailure('timeout');
      }
      if (!response.ok) {
        throw new F1ApiHttpError(response.status, undefined, path);
      }
      throw new DataSourceUnavailableError('invalid-response', path);
    }

    if (!response.ok) {
      throw new F1ApiHttpError(response.status, body?.code, path);
    }
    return body;
  }
}
