import { DriverNotFoundError } from '../../domain/errors/driver-not-found.error.js';
import { InvalidStrategyError } from '../../domain/errors/invalid-strategy.error.js';
import { RaceNotFoundError } from '../../domain/errors/race-not-found.error.js';
import type { Strategy } from '../../domain/model/strategy.js';
import { FakeF1DataPort } from '../../../test/support/fake-f1-data.port.js';
import { DataSourceUnavailableError } from '../errors/data-source-unavailable.error.js';
import { SimulateStrategy } from './simulate-strategy.use-case.js';

const validStrategy: Strategy = {
  raceId: 'spa-2026',
  driverId: 'norris',
  stints: [
    { compound: 'SOFT', laps: 20 },
    { compound: 'HARD', laps: 24 },
  ],
};

describe('SimulateStrategy', () => {
  let port: FakeF1DataPort;
  let useCase: SimulateStrategy;

  beforeEach(() => {
    port = new FakeF1DataPort();
    useCase = new SimulateStrategy(port);
  });

  it('simulates the strategy with the loaded race context', async () => {
    const result = await useCase.execute(validStrategy);

    expect(result.raceId).toBe('spa-2026');
    expect(result.driverId).toBe('norris');
    expect(result.laps).toHaveLength(44);
    expect(result.stints.map((s) => s.compound)).toEqual(['SOFT', 'HARD']);
    expect(result.pitStops).toHaveLength(1);
    expect(result.totalTime).toBeGreaterThan(0);
  });

  it('labels the result with the ids of the loaded race and driver', async () => {
    class CaseInsensitivePort extends FakeF1DataPort {
      override getRaceDetail(raceId: string) {
        return super.getRaceDetail(raceId.toLowerCase());
      }
      override getWeather(raceId: string) {
        return super.getWeather(raceId.toLowerCase());
      }
      override getSimulationParameters(raceId: string) {
        return super.getSimulationParameters(raceId.toLowerCase());
      }
    }

    const result = await new SimulateStrategy(
      new CaseInsensitivePort(),
    ).execute({ ...validStrategy, raceId: 'SPA-2026' });

    expect(result.raceId).toBe('spa-2026');
    expect(result.driverId).toBe('norris');
  });

  it('loads every dataset keyed by the strategy race', async () => {
    await useCase.execute(validStrategy);

    expect([...port.calls].sort()).toEqual([
      'getRaceDetail',
      'getSimulationParameters',
      'getWeather',
      'listDrivers',
      'listTeams',
      'listTyres',
    ]);
  });

  it('throws DriverNotFoundError for an unknown driver', async () => {
    await expect(
      useCase.execute({ ...validStrategy, driverId: 'nobody' }),
    ).rejects.toThrow(DriverNotFoundError);
  });

  it('throws an invalid-response error when the driver team is missing', async () => {
    port.teams = port.teams.filter((team) => team.id !== 'mclaren');

    const failure = await useCase.execute(validStrategy).catch((e) => e);

    expect(failure).toBeInstanceOf(DataSourceUnavailableError);
    expect(failure).toMatchObject({
      reason: 'invalid-response',
      resource: '/api/teams',
    });
  });

  it('propagates InvalidStrategyError from the domain', async () => {
    await expect(
      useCase.execute({
        ...validStrategy,
        stints: [{ compound: 'SOFT', laps: 44 }],
      }),
    ).rejects.toThrow(InvalidStrategyError);
  });

  it('propagates RaceNotFoundError even when another call fails first', async () => {
    port.failWith(
      'getRaceDetail',
      new DataSourceUnavailableError('timeout', '/api/races/x'),
    );
    port.failWith('getWeather', new RaceNotFoundError('nope'));

    await expect(
      useCase.execute({ ...validStrategy, raceId: 'nope' }),
    ).rejects.toThrow(RaceNotFoundError);
  });
});
