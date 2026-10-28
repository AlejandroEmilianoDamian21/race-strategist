import { DomainError } from './domain-error.js';

export class RaceNotFoundError extends DomainError {
  readonly code = 'RACE_NOT_FOUND';

  constructor(readonly raceId: string) {
    super(`Race "${raceId}" was not found.`);
  }
}
