import type { ArgumentsHost } from '@nestjs/common';
import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSourceUnavailableError } from '../../../application/errors/data-source-unavailable.error.js';
import { DriverNotFoundError } from '../../../domain/errors/driver-not-found.error.js';
import { InvalidStrategyError } from '../../../domain/errors/invalid-strategy.error.js';
import { RaceNotFoundError } from '../../../domain/errors/race-not-found.error.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

function createHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('maps InvalidStrategyError to 400 with the violations as details', () => {
    const { host, status, json } = createHost();
    const violations = [
      { code: 'MINIMUM_PIT_STOPS', message: 'Needs a pit stop.' },
    ];
    const error = new InvalidStrategyError(violations as never);

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'INVALID_STRATEGY',
      message: 'The strategy is not valid.',
      details: error.violations,
    });
  });

  it('maps RaceNotFoundError to 404 RACE_NOT_FOUND', () => {
    const { host, status, json } = createHost();

    filter.catch(new RaceNotFoundError('abc'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'RACE_NOT_FOUND',
      message: 'Race "abc" was not found.',
    });
  });

  it('maps DriverNotFoundError to 404 DRIVER_NOT_FOUND', () => {
    const { host, status, json } = createHost();

    filter.catch(new DriverNotFoundError('zed'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'DRIVER_NOT_FOUND',
      message: 'Driver "zed" was not found.',
    });
  });

  it.each(['timeout', 'network', 'server-error'] as const)(
    'maps DataSourceUnavailableError (%s) to 502 with reason and resource',
    (reason) => {
      const { host, status, json } = createHost();

      filter.catch(new DataSourceUnavailableError(reason, '/api/races'), host);

      expect(status).toHaveBeenCalledWith(502);
      expect(json).toHaveBeenCalledWith({
        statusCode: 502,
        code: 'UPSTREAM_UNAVAILABLE',
        message:
          'The F1 data provider is unavailable right now. Please try again.',
        details: { reason, resource: '/api/races' },
      });
    },
  );

  it('maps validation errors to VALIDATION_FAILED with the messages as details', () => {
    const { host, status, json } = createHost();
    const messages = ['raceId must be a string', 'stints must be an array'];

    filter.catch(new BadRequestException(messages), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'The request is not valid.',
      details: messages,
    });
  });

  it('maps a plain 400 HttpException to HTTP_400', () => {
    const { host, json } = createHost();

    filter.catch(new BadRequestException('Malformed body'), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'HTTP_400',
      message: 'Malformed body',
    });
  });

  it('maps unknown routes to 404 NOT_FOUND', () => {
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException('Cannot GET /api/nope'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Cannot GET /api/nope',
    });
  });

  it('maps other HttpExceptions to HTTP_<status>', () => {
    const { host, status, json } = createHost();

    filter.catch(new ForbiddenException('Nope'), host);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      statusCode: 403,
      code: 'HTTP_403',
      message: 'Nope',
    });
  });

  it('maps unknown errors to 500 without leaking internals and logs them', () => {
    const { host, status, json } = createHost();
    const logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const error = new Error('db password is hunter2');

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    });
    expect(logError).toHaveBeenCalledWith(error.message, error.stack);
    logError.mockRestore();
  });
});
