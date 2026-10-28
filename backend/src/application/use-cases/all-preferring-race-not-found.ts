import { RaceNotFoundError } from '../../domain/errors/race-not-found.error.js';

export async function allPreferringRaceNotFound<
  T extends readonly unknown[] | [],
>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }> {
  const settled = await Promise.allSettled(values);
  const failures = settled.flatMap((result) =>
    result.status === 'rejected' ? [result.reason as unknown] : [],
  );
  if (failures.length > 0) {
    throw (
      failures.find((reason) => reason instanceof RaceNotFoundError) ??
      failures[0]
    );
  }
  return settled.map(
    (result) => (result as PromiseFulfilledResult<unknown>).value,
  ) as { -readonly [P in keyof T]: Awaited<T[P]> };
}
