import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DataSourceUnavailableError } from '../src/application/errors/data-source-unavailable.error.js';
import { F1DataPort } from '../src/application/ports/f1-data.port.js';
import { tyres } from './support/f1-fixtures.js';
import { FakeF1DataPort } from './support/fake-f1-data.port.js';

describe('Races (e2e)', () => {
  let app: INestApplication;
  let fake: FakeF1DataPort;
  let fetchSpy: ReturnType<typeof vi.fn>;
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    fetchSpy = vi.fn(() => Promise.reject(new Error('network is off')));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    fake = new FakeF1DataPort();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(F1DataPort)
      .useValue(fake)
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    globalThis.fetch = originalFetch;
  });

  it('GET /api/races returns the joined races sorted by round', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/races')
      .expect(200);

    expect(response.body).toEqual({
      races: [
        {
          id: 'monaco-2026',
          name: 'Monaco Grand Prix',
          round: 8,
          date: '2026-05-24',
          laps: 78,
          temperature: 24,
          rainProbability: 0.1,
          circuit: {
            id: 'monaco',
            name: 'Circuit de Monaco',
            country: 'Monaco',
            type: 'street',
          },
        },
        {
          id: 'spa-2026',
          name: 'Belgian Grand Prix',
          round: 14,
          date: '2026-07-26',
          laps: 44,
          temperature: 21,
          rainProbability: 0.45,
          circuit: {
            id: 'spa',
            name: 'Circuit de Spa-Francorchamps',
            country: 'Belgium',
            type: 'high-speed',
          },
        },
        {
          id: 'monza-2026',
          name: 'Italian Grand Prix',
          round: 16,
          date: '2026-09-06',
          laps: 53,
          temperature: 28,
          rainProbability: 0.05,
          circuit: {
            id: 'monza',
            name: 'Autodromo Nazionale Monza',
            country: 'Italy',
            type: 'high-speed',
          },
        },
      ],
    });
  });

  it('GET /api/races answers 502 when the data provider is unavailable', async () => {
    fake.failWith(
      'listRaces',
      new DataSourceUnavailableError('timeout', '/api/races'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/races')
      .expect(502);

    expect(response.body).toEqual({
      statusCode: 502,
      code: 'UPSTREAM_UNAVAILABLE',
      message:
        'The F1 data provider is unavailable right now. Please try again.',
      details: { reason: 'timeout', resource: '/api/races' },
    });
  });

  it('GET /api/races/:id/overview returns the race overview', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/races/spa-2026/overview')
      .expect(200);

    expect(response.body).toEqual({
      race: {
        id: 'spa-2026',
        name: 'Belgian Grand Prix',
        round: 14,
        date: '2026-07-26',
        laps: 44,
        temperature: 21,
        rainProbability: 0.45,
      },
      circuit: {
        id: 'spa',
        name: 'Circuit de Spa-Francorchamps',
        country: 'Belgium',
        type: 'high-speed',
        laps: 44,
        lengthKm: 7.004,
        baseLapTime: 106,
        pitStopLoss: 19,
        tyreWear: 0.9,
        overtakingDifficulty: 0.5,
      },
      weather: {
        summary: 'Mostly dry with a chance of light rain.',
        forecast: [
          { fromLap: 1, toLap: 30, temperature: 22, rainIntensity: 0 },
          { fromLap: 31, toLap: 44, temperature: 20, rainIntensity: 0.3 },
        ],
      },
      parameters: {
        lapTimeVariance: 0.3,
        pitStopLoss: 20,
        tyreChangeTime: 2.5,
        fuelEffectPerLap: 0.03,
        safetyCarProbability: 0.2,
        minimumPitStops: 1,
      },
      tyres,
      teams: [
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
      ],
    });
  });

  it('GET /api/races/:id/overview answers 404 for an unknown race', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/races/nope/overview')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      code: 'RACE_NOT_FOUND',
    });
  });

  it('GET /api/races/:id/overview answers 502 when the data provider is unavailable', async () => {
    fake.failWith(
      'listTeams',
      new DataSourceUnavailableError('timeout', '/api/teams'),
    );

    const response = await request(app.getHttpServer())
      .get('/api/races/spa-2026/overview')
      .expect(502);

    expect(response.body).toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_UNAVAILABLE',
      details: { reason: 'timeout', resource: '/api/teams' },
    });
  });

  it('answers unknown routes with the error contract', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/nope')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Cannot GET /api/nope',
    });
  });

  it('never reaches the real F1 API', async () => {
    await request(app.getHttpServer()).get('/api/races').expect(200);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
