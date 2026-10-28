import { DataSourceUnavailableError } from '../../application/errors/data-source-unavailable.error.js';
import { F1ApiClient } from './f1-api.client.js';
import { F1ApiHttpError } from './f1-api.http-error.js';
import type { F1ApiOptions } from './f1-api.options.js';

const options: F1ApiOptions = {
  baseUrl: 'https://f1.test',
  timeoutMs: 20,
  retries: 1,
  retryDelayMs: 0,
  cacheTtlMs: 1000,
};

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const okBody = (data: unknown) => ({
  statusCode: 200,
  code: 'OK',
  message: 'ok',
  data,
});

const buildClient = (fetchImpl: typeof fetch): F1ApiClient =>
  new F1ApiClient(options, fetchImpl);

describe('F1ApiClient', () => {
  it('unwraps the data of the envelope and sends the accept header', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, okBody({ races: [1] })));

    const data = await buildClient(fetchMock).getData<{ races: number[] }>(
      '/api/races',
    );

    expect(data).toEqual({ races: [1] });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://f1.test/api/races');
    expect(new Headers(init.headers).get('accept')).toBe('application/json');
  });

  it('retries once on a 500 and then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500, { statusCode: 500 }))
      .mockResolvedValueOnce(jsonResponse(200, okBody({ ok: true })));

    const data = await buildClient(fetchMock).getData('/api/races');

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry on a 404 and exposes status, code and path', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(404, { statusCode: 404, code: 'RACE4040', message: 'x' }),
      );

    const error = await buildClient(fetchMock)
      .getData('/api/races/nope')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(F1ApiHttpError);
    expect(error).toMatchObject({
      status: 404,
      code: 'RACE4040',
      path: '/api/races/nope',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails with server-error when a 500 persists after the retries', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse(500, { statusCode: 500 })),
      );

    const error = await buildClient(fetchMock)
      .getData('/api/races')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DataSourceUnavailableError);
    expect(error).toMatchObject({
      reason: 'server-error',
      resource: '/api/races',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails with network when fetch rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const error = await buildClient(fetchMock)
      .getData('/api/races')
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ reason: 'network' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails with timeout when the request is aborted by the signal', async () => {
    const fetchMock = vi.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(init.signal?.reason);
          });
        }),
    );

    const error = await buildClient(fetchMock)
      .getData('/api/races')
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ reason: 'timeout', resource: '/api/races' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails with invalid-response when the envelope has no data', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { statusCode: 200, code: 'OK', message: 'ok' }),
      );

    const error = await buildClient(fetchMock)
      .getData('/api/races')
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ reason: 'invalid-response' });
  });

  it('fails with invalid-response when the body is not JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('<html>', { status: 200 }));

    const error = await buildClient(fetchMock)
      .getData('/api/races')
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ reason: 'invalid-response' });
  });

  it('pings the liveness endpoint with a single attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { statusCode: 200, code: 'HL2001', message: 'ok' }),
      );

    await buildClient(fetchMock).ping();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://f1.test/api/__health/liveness',
    );
  });

  it('rejects the ping without retrying when the API is down', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    await expect(buildClient(fetchMock).ping()).rejects.toBeInstanceOf(
      DataSourceUnavailableError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
