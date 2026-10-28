import type { StrategyViolation } from '../strategy/strategy-violation.js';
import { DomainError } from './domain-error.js';

export class InvalidStrategyError extends DomainError {
  readonly code = 'INVALID_STRATEGY';

  constructor(readonly violations: StrategyViolation[]) {
    super(`Invalid strategy: ${violations.map((v) => v.message).join(' ')}`);
  }
}
