import { DataSourceUnavailableError } from '../../application/errors/data-source-unavailable.error.js';
import { RaceNotFoundError } from '../../domain/errors/race-not-found.error.js';
import { F1ApiAdapter } from './f1-api.adapter.js';
import { F1ApiClient } from './f1-api.client.js';
import type { F1ApiOptions } from './f1-api.options.js';

const options: F1ApiOptions = {
  baseUrl: 'https://f1.test',
  timeoutMs: 50,
  retries: 0,
  retryDelayMs: 0,
  cacheTtlMs: 60_000,
};

const rawRace = {
  id: 'race-01',
  name: 'Bahrain Grand Prix',
  round: 1,
  date: '2025-04-13',
  circuitId: 'circuit-01',
  laps: 57,
  temperature: 31,
  rainProbability: 0.02,
};

const rawCircuit = {
  id: 'circuit-01',
  name: 'Bahrain International Circuit',
  country: 'Bahrain',
  type: 'permanent',
  laps: 57,
  lengthKm: 5.412,
  baseLapTime: 91.5,
  pitStopLoss: 22,
  tyreWear: 1.35,
  overtakingDifficulty: 0.3,
};

const rawTyre = (compound: string) => ({
  compound,
  pace: 0,
  degradation: 0.05,
  wetPerformance: 0.5,
  optimalRainIntensity: { min: 0, max: 0.2 },
});

const allTyres = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map(rawTyre);

type Routes = Record<string, { status?: number; body: unknown }>;

const envelope = (data: unknown) => ({
  statusCode: 200,
  code: 'OK',
  message: 'ok',
  data,
});

const routedFetch = (routes: Routes) =>
  vi.fn().mockImplementation((url: string) => {
    const path = url.replace('https://f1.test', '');
    const route = routes[path];
    if (!route) {
      return Promise.resolve(
        new Response(JSON.stringify({ statusCode: 404, code: 'X' }), {
          status: 404,
        }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify(route.body), { status: route.status ?? 200 }),
    );
  });

const buildAdapter = (fetchMock: typeof fetch): F1ApiAdapter =>
  new F1ApiAdapter(new F1ApiClient(options, fetchMock), options);

describe('F1ApiAdapter', () => {
  it('maps the races to domain objects', async () => {
    const adapter = buildAdapter(
      routedFetch({ '/api/races': { body: envelope({ races: [rawRace] }) } }),
    );

    await expect(adapter.listRaces()).resolves.toEqual([rawRace]);
  });

  it('serves the second call from the cache', async () => {
    const fetchMock = routedFetch({
      '/api/races': { body: envelope({ races: [rawRace] }) },
    });
    const adapter = buildAdapter(fetchMock);

    await adapter.listRaces();
    await adapter.listRaces();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns the race together with its circuit', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/races/race-01': {
          body: envelope({ ...rawRace, circuit: rawCircuit }),
        },
      }),
    );

    await expect(adapter.getRaceDetail('race-01')).resolves.toEqual({
      race: rawRace,
      circuit: rawCircuit,
    });
  });

  it('maps an unknown race to RaceNotFoundError', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/races/nope': {
          status: 404,
          body: { statusCode: 404, code: 'RACE4040', message: 'missing' },
        },
      }),
    );

    await expect(adapter.getRaceDetail('nope')).rejects.toBeInstanceOf(
      RaceNotFoundError,
    );
  });

  it('maps a 400 on a race-scoped call to RaceNotFoundError', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/races/bad/weather': {
          status: 400,
          body: { statusCode: 400, code: 'RACE4000', message: 'bad id' },
        },
      }),
    );

    await expect(adapter.getWeather('bad')).rejects.toBeInstanceOf(
      RaceNotFoundError,
    );
  });

  it('returns weather and simulation parameters', async () => {
    const weather = {
      raceId: 'race-01',
      summary: 'dry',
      forecast: [{ fromLap: 1, toLap: 57, temperature: 30, rainIntensity: 0 }],
    };
    const parameters = {
      raceId: 'race-01',
      lapTimeVariance: 0.2,
      pitStopLoss: 22,
      tyreChangeTime: 2.5,
      fuelEffectPerLap: 0.03,
      safetyCarProbability: 0.1,
      minimumPitStops: 1,
    };
    const adapter = buildAdapter(
      routedFetch({
        '/api/races/race-01/weather': { body: envelope(weather) },
        '/api/races/race-01/simulation-parameters': {
          body: envelope(parameters),
        },
      }),
    );

    await expect(adapter.getWeather('race-01')).resolves.toEqual(weather);
    await expect(adapter.getSimulationParameters('race-01')).resolves.toEqual(
      parameters,
    );
  });

  it('maps circuits, drivers and teams', async () => {
    const driver = {
      id: 'driver-01',
      name: 'A Driver',
      number: 1,
      teamId: 'team-01',
      pace: 0.9,
      consistency: 0.8,
    };
    const team = { id: 'team-01', name: 'A Team', carPerformance: 0.95 };
    const adapter = buildAdapter(
      routedFetch({
        '/api/circuits': { body: envelope({ circuits: [rawCircuit] }) },
        '/api/drivers': { body: envelope({ drivers: [driver] }) },
        '/api/teams': { body: envelope({ teams: [team] }) },
      }),
    );

    await expect(adapter.listCircuits()).resolves.toEqual([rawCircuit]);
    await expect(adapter.listDrivers()).resolves.toEqual([driver]);
    await expect(adapter.listTeams()).resolves.toEqual([team]);
  });

  it('fails with empty-response when the race list is empty', async () => {
    const adapter = buildAdapter(
      routedFetch({ '/api/races': { body: envelope({ races: [] }) } }),
    );

    const error = await adapter.listRaces().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DataSourceUnavailableError);
    expect(error).toMatchObject({
      reason: 'empty-response',
      resource: '/api/races',
    });
  });

  it('returns the five tyres', async () => {
    const adapter = buildAdapter(
      routedFetch({ '/api/tyres': { body: envelope({ tyres: allTyres }) } }),
    );

    const tyres = await adapter.listTyres();

    expect(tyres.map((tyre) => tyre.compound)).toEqual([
      'SOFT',
      'MEDIUM',
      'HARD',
      'INTERMEDIATE',
      'WET',
    ]);
  });

  it('fails with invalid-response when a compound is missing', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/tyres': { body: envelope({ tyres: allTyres.slice(0, 4) }) },
      }),
    );

    await expect(adapter.listTyres()).rejects.toMatchObject({
      reason: 'invalid-response',
    });
  });

  it('fails with invalid-response on an unknown compound', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/tyres': {
          body: envelope({ tyres: [...allTyres, rawTyre('SUPERSOFT')] }),
        },
      }),
    );

    await expect(adapter.listTyres()).rejects.toMatchObject({
      reason: 'invalid-response',
    });
  });

  it('fails with invalid-response when a numeric field is not finite', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/races': {
          body: envelope({ races: [{ ...rawRace, laps: 'many' }] }),
        },
      }),
    );

    await expect(adapter.listRaces()).rejects.toMatchObject({
      reason: 'invalid-response',
    });
  });

  it('maps a persistent upstream 500 to DataSourceUnavailableError', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/teams': { status: 500, body: { statusCode: 500 } },
      }),
    );

    await expect(adapter.listTeams()).rejects.toMatchObject({
      reason: 'server-error',
    });
  });

  it('maps a non-5xx HTTP error on a list endpoint to DataSourceUnavailableError', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/races': {
          status: 429,
          body: { statusCode: 429, code: 'RATE', message: 'slow down' },
        },
      }),
    );

    const error = await adapter.listRaces().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataSourceUnavailableError);
    expect(error).toMatchObject({ reason: 'server-error' });
  });

  it('maps a non-404 HTTP error on a race-scoped call to server-error', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/races/race-01/weather': {
          status: 403,
          body: { statusCode: 403, code: 'NOPE', message: 'forbidden' },
        },
      }),
    );

    await expect(adapter.getWeather('race-01')).rejects.toMatchObject({
      reason: 'server-error',
    });
  });

  it('passes a persistent race-scoped 5xx through as DataSourceUnavailableError', async () => {
    const adapter = buildAdapter(
      routedFetch({
        '/api/races/race-01/simulation-parameters': {
          status: 503,
          body: { statusCode: 503 },
        },
      }),
    );

    await expect(
      adapter.getSimulationParameters('race-01'),
    ).rejects.toMatchObject({ reason: 'server-error' });
  });

  it('does not cache a malformed race-scoped payload', async () => {
    const fetchMock = routedFetch({
      '/api/races/race-01': { body: envelope({ ...rawRace, laps: 'many' }) },
    });
    const adapter = buildAdapter(fetchMock);

    await expect(adapter.getRaceDetail('race-01')).rejects.toMatchObject({
      reason: 'invalid-response',
    });
    await expect(adapter.getRaceDetail('race-01')).rejects.toMatchObject({
      reason: 'invalid-response',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not throw nor wait for the warm-up ping when the API is down', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const adapter = buildAdapter(fetchMock);

    expect(adapter.onModuleInit()).toBeUndefined();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
