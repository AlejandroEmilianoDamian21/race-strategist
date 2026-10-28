import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DataSourceUnavailableError } from '../../../application/errors/data-source-unavailable.error.js';
import { DriverNotFoundError } from '../../../domain/errors/driver-not-found.error.js';
import { InvalidStrategyError } from '../../../domain/errors/invalid-strategy.error.js';
import { RaceNotFoundError } from '../../../domain/errors/race-not-found.error.js';
import type { ErrorResponse } from '../error-response.js';

const UNEXPECTED_MESSAGE = 'An unexpected error occurred.';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toErrorResponse(exception);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(body.statusCode)
      .json(body);
  }

  private toErrorResponse(exception: unknown): ErrorResponse {
    if (exception instanceof InvalidStrategyError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'INVALID_STRATEGY',
        message: 'The strategy is not valid.',
        details: exception.violations,
      };
    }
    if (exception instanceof RaceNotFoundError) {
      return this.notFound('RACE_NOT_FOUND', exception.message);
    }
    if (exception instanceof DriverNotFoundError) {
      return this.notFound('DRIVER_NOT_FOUND', exception.message);
    }
    if (exception instanceof DataSourceUnavailableError) {
      return {
        statusCode: HttpStatus.BAD_GATEWAY,
        code: 'UPSTREAM_UNAVAILABLE',
        message:
          'The F1 data provider is unavailable right now. Please try again.',
        details: { reason: exception.reason, resource: exception.resource },
      };
    }
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }
    this.logUnexpected(exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: UNEXPECTED_MESSAGE,
    };
  }

  private fromHttpException(exception: HttpException): ErrorResponse {
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();
    const messages =
      typeof payload === 'object' && 'message' in payload
        ? payload.message
        : undefined;

    if (statusCode === 400 && Array.isArray(messages)) {
      return {
        statusCode,
        code: 'VALIDATION_FAILED',
        message: 'The request is not valid.',
        details: messages,
      };
    }
    const code = statusCode === 404 ? 'NOT_FOUND' : `HTTP_${statusCode}`;
    if (statusCode >= 500) {
      this.logUnexpected(exception);
      return { statusCode, code, message: UNEXPECTED_MESSAGE };
    }
    return { statusCode, code, message: exception.message };
  }

  private notFound(code: string, message: string): ErrorResponse {
    return { statusCode: HttpStatus.NOT_FOUND, code, message };
  }

  private logUnexpected(exception: unknown): void {
    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error(`Non-error thrown: ${String(exception)}`);
    }
  }
}
