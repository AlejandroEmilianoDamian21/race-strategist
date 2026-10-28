import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DataSourceUnavailableError } from '../src/application/errors/data-source-unavailable.error.js';
import { F1DataPort } from '../src/application/ports/f1-data.port.js';
import { FakeF1DataPort } from './support/fake-f1-data.port.js';

const validBody = {
  raceId: 'spa-2026',
  driverId: 'norris',
  stints: [
    { compound: 'SOFT', laps: 20 },
    { compound: 'HARD', laps: 24 },
  ],
};

describe('Simulate (e2e)', () => {
  let app: INestApplication;
  let fake: FakeF1DataPort;
  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.reject(new Error('network is off')),
    ) as unknown as typeof fetch;
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

  const post = (body: object) =>
    request(app.getHttpServer()).post('/api/simulate').send(body);

  it('POST /api/simulate returns the simulation result', async () => {
    const response = await post(validBody).expect(200);

    expect(response.body).toMatchObject({
      raceId: 'spa-2026',
      driverId: 'norris',
      totalTime: expect.any(Number),
      driverDelta: expect.any(Number),
    });
    expect(response.body.stints).toHaveLength(2);
    expect(response.body.pitStops).toHaveLength(1);
    expect(response.body.laps).toHaveLength(44);
    expect(response.body.laps[0]).toEqual({
      lap: 1,
      stintIndex: 0,
      compound: 'SOFT',
      tyreAge: 1,
      rainIntensity: 0,
      rainPenalty: 0,
      pitLoss: 0,
      time: expect.any(Number),
    });
    const decimals = String(response.body.totalTime).split('.')[1] ?? '';
    expect(decimals.length).toBeLessThanOrEqual(3);
  });

  it('answers 400 VALIDATION_FAILED when stints is missing', async () => {
    const response = await post({
      raceId: 'spa-2026',
      driverId: 'norris',
    }).expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
  });

  it('answers 400 VALIDATION_FAILED when laps is not an integer', async () => {
    const response = await post({
      ...validBody,
      stints: [{ compound: 'SOFT', laps: 'ten' }],
    }).expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
  });

  it('answers 400 VALIDATION_FAILED for an unknown extra property', async () => {
    const response = await post({ ...validBody, extra: true }).expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
    });
  });

  it('answers 400 INVALID_STRATEGY with violations for an illegal strategy', async () => {
    const response = await post({
      ...validBody,
      stints: [{ compound: 'SOFT', laps: 44 }],
    }).expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'INVALID_STRATEGY',
    });
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'NOT_ENOUGH_PIT_STOPS' }),
      ]),
    );
  });

  it.each([
    ['an empty stint list', [], 'NO_STINTS'],
    [
      'a stint with zero laps',
      [
        { compound: 'SOFT', laps: 0 },
        { compound: 'HARD', laps: 44 },
      ],
      'STINT_TOO_SHORT',
    ],
    [
      'a stint with negative laps',
      [
        { compound: 'SOFT', laps: -5 },
        { compound: 'HARD', laps: 49 },
      ],
      'STINT_TOO_SHORT',
    ],
    [
      'an unknown compound',
      [
        { compound: 'SUPERSOFT', laps: 20 },
        { compound: 'HARD', laps: 24 },
      ],
      'UNKNOWN_COMPOUND',
    ],
    [
      'a huge lap count',
      [
        { compound: 'SOFT', laps: 1_000_000_000 },
        { compound: 'HARD', laps: 24 },
      ],
      'LAPS_MISMATCH',
    ],
  ])(
    'answers 400 INVALID_STRATEGY for %s',
    async (_, stints, violationCode) => {
      const response = await post({ ...validBody, stints }).expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        code: 'INVALID_STRATEGY',
      });
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: violationCode }),
        ]),
      );
    },
  );

  it('answers 404 RACE_NOT_FOUND for an unknown race', async () => {
    const response = await post({ ...validBody, raceId: 'nope' }).expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      code: 'RACE_NOT_FOUND',
    });
  });

  it('answers 404 DRIVER_NOT_FOUND for an unknown driver', async () => {
    const response = await post({ ...validBody, driverId: 'nobody' }).expect(
      404,
    );

    expect(response.body).toMatchObject({
      statusCode: 404,
      code: 'DRIVER_NOT_FOUND',
    });
  });

  it('answers 502 UPSTREAM_UNAVAILABLE when the data provider fails', async () => {
    fake.failWith(
      'listTyres',
      new DataSourceUnavailableError('timeout', '/api/tyres'),
    );

    const response = await post(validBody).expect(502);

    expect(response.body).toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_UNAVAILABLE',
      details: { reason: 'timeout', resource: '/api/tyres' },
    });
  });

  it('answers 502 UPSTREAM_UNAVAILABLE when the driver references an unknown team', async () => {
    fake.drivers = fake.drivers.map((driver) =>
      driver.id === 'norris' ? { ...driver, teamId: 'ghost' } : driver,
    );

    const response = await post(validBody).expect(502);

    expect(response.body).toMatchObject({
      statusCode: 502,
      code: 'UPSTREAM_UNAVAILABLE',
      details: { reason: 'invalid-response', resource: '/api/teams' },
    });
  });
});
