import { DataSourceUnavailableError } from '../errors/data-source-unavailable.error.js';
import { RaceNotFoundError } from '../../domain/errors/race-not-found.error.js';
import { FakeF1DataPort } from '../../../test/support/fake-f1-data.port.js';
import { circuits, weatherFor } from '../../../test/support/f1-fixtures.js';
import { GetRaceOverview } from './get-race-overview.use-case.js';

describe('GetRaceOverview', () => {
  let port: FakeF1DataPort;
  let useCase: GetRaceOverview;

  beforeEach(() => {
    port = new FakeF1DataPort();
    useCase = new GetRaceOverview(port);
  });

  it('returns the race, circuit, weather, parameters, tyres and teams', async () => {
    const result = await useCase.execute('spa-2026');
    const weather = weatherFor('spa-2026');

    expect(result.race).toEqual({
      id: 'spa-2026',
      name: 'Belgian Grand Prix',
      round: 14,
      date: '2026-07-26',
      laps: 44,
      temperature: 21,
      rainProbability: 0.45,
    });
    expect(result.circuit).toEqual(circuits.find((c) => c.id === 'spa'));
    expect(result.weather).toEqual({
      summary: weather.summary,
      forecast: weather.forecast,
    });
    expect(result.parameters).toEqual({
      lapTimeVariance: 0.3,
      pitStopLoss: 20,
      tyreChangeTime: 2.5,
      fuelEffectPerLap: 0.03,
      safetyCarProbability: 0.2,
      minimumPitStops: 1,
    });
    expect(result.parameters).not.toHaveProperty('raceId');
    expect(result.teams).toEqual([
      {
        id: 'ferrari',
        name: 'Ferrari',
        carPerformance: 0.95,
        drivers: [
          {
            id: 'leclerc',
            name: 'Charles Leclerc',
            number: 16,
            pace: 0.96,
            consistency: 0.9,
          },
        ],
      },
      {
        id: 'mclaren',
        name: 'McLaren',
        carPerformance: 0.97,
        drivers: [
          {
            id: 'norris',
            name: 'Lando Norris',
            number: 4,
            pace: 0.97,
            consistency: 0.92,
          },
        ],
      },
    ]);
  });

  it('orders tyres by compound order', async () => {
    port.tyres = [...port.tyres].reverse();

    const result = await useCase.execute('spa-2026');

    expect(result.tyres.map((t) => t.compound)).toEqual([
      'SOFT',
      'MEDIUM',
      'HARD',
      'INTERMEDIATE',
      'WET',
    ]);
  });

  it('loads every dataset from the port', async () => {
    await useCase.execute('spa-2026');

    expect([...port.calls].sort()).toEqual([
      'getRaceDetail',
      'getSimulationParameters',
      'getWeather',
      'listDrivers',
      'listTeams',
      'listTyres',
    ]);
  });

  it('keeps upstream team order and sorts drivers by number', async () => {
    port.teams = [...port.teams].reverse();
    port.drivers = [
      ...port.drivers,
      {
        id: 'piastri',
        name: 'Oscar Piastri',
        number: 81,
        teamId: 'mclaren',
        pace: 0.96,
        consistency: 0.9,
      },
      {
        id: 'hamilton',
        name: 'Lewis Hamilton',
        number: 44,
        teamId: 'ferrari',
        pace: 0.97,
        consistency: 0.9,
      },
    ];

    const result = await useCase.execute('spa-2026');

    expect(result.teams.map((t) => t.id)).toEqual(['mclaren', 'ferrari']);
    expect(result.teams[0]?.drivers.map((d) => d.number)).toEqual([4, 81]);
    expect(result.teams[1]?.drivers.map((d) => d.number)).toEqual([16, 44]);
  });

  it('omits teams without drivers', async () => {
    port.teams = [
      ...port.teams,
      { id: 'williams', name: 'Williams', carPerformance: 0.8 },
    ];

    const result = await useCase.execute('spa-2026');

    expect(result.teams.map((t) => t.id)).toEqual(['ferrari', 'mclaren']);
  });

  it('fails with an invalid-response error when a driver references an unknown team', async () => {
    port.teams = port.teams.filter((t) => t.id !== 'mclaren');

    const error = await useCase.execute('spa-2026').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DataSourceUnavailableError);
    expect(error).toMatchObject({
      reason: 'invalid-response',
      resource: '/api/teams',
    });
    expect((error as Error).message).toContain('norris');
    expect((error as Error).message).toContain('mclaren');
  });

  it('propagates RaceNotFoundError for an unknown race', async () => {
    await expect(useCase.execute('nope')).rejects.toBeInstanceOf(
      RaceNotFoundError,
    );
  });

  it('prefers RaceNotFoundError over an earlier failure of another call', async () => {
    port.failWith(
      'getWeather',
      new DataSourceUnavailableError('timeout', '/api/races/nope/weather'),
    );
    vi.spyOn(port, 'getRaceDetail').mockImplementation(
      (raceId) =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new RaceNotFoundError(raceId)), 0),
        ),
    );

    await expect(useCase.execute('nope')).rejects.toBeInstanceOf(
      RaceNotFoundError,
    );
  });

  it('propagates the failure of the earliest call when no race is missing', async () => {
    const weatherFailure = new DataSourceUnavailableError(
      'timeout',
      '/api/races/spa-2026/weather',
    );
    const teamsFailure = new DataSourceUnavailableError(
      'server-error',
      '/api/teams',
    );
    port.failWith('listTeams', teamsFailure);
    vi.spyOn(port, 'getWeather').mockImplementation(
      () =>
        new Promise((_, reject) => setTimeout(() => reject(weatherFailure), 0)),
    );

    await expect(useCase.execute('spa-2026')).rejects.toBe(weatherFailure);
  });

  it('propagates port errors unchanged', async () => {
    const failure = new DataSourceUnavailableError('timeout', '/api/teams');
    port.failWith('listTeams', failure);

    await expect(useCase.execute('spa-2026')).rejects.toBe(failure);
  });
});
