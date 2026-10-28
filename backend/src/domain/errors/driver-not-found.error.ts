import { DomainError } from './domain-error.js';

export class DriverNotFoundError extends DomainError {
  readonly code = 'DRIVER_NOT_FOUND';

  constructor(readonly driverId: string) {
    super(`Driver "${driverId}" was not found.`);
  }
}
