import { DataSourceUnavailableError } from '../errors/data-source-unavailable.error.js';
import { FakeF1DataPort } from '../../../test/support/fake-f1-data.port.js';
import { ListRaces } from './list-races.use-case.js';

describe('ListRaces', () => {
  let port: FakeF1DataPort;
  let useCase: ListRaces;

  beforeEach(() => {
    port = new FakeF1DataPort();
    useCase = new ListRaces(port);
  });

  it('joins each race with its circuit and sorts by round ascending', async () => {
    const result = await useCase.execute();

    expect(result.map((r) => r.round)).toEqual([8, 14, 16]);
    expect(result[0]).toEqual({
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
    });
  });

  it('loads races and circuits from the port', async () => {
    await useCase.execute();

    expect([...port.calls].sort()).toEqual(['listCircuits', 'listRaces']);
  });

  it('fails with an invalid-response error when a race references an unknown circuit', async () => {
    port.circuits = port.circuits.filter((c) => c.id !== 'spa');

    const error = await useCase.execute().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DataSourceUnavailableError);
    expect(error).toMatchObject({
      reason: 'invalid-response',
      resource: '/api/circuits',
    });
    expect((error as Error).message).toContain('spa');
  });

  it('propagates port errors unchanged', async () => {
    const failure = new DataSourceUnavailableError('timeout', '/api/races');
    port.failWith('listRaces', failure);

    await expect(useCase.execute()).rejects.toBe(failure);
  });

  it('propagates circuit loading errors unchanged', async () => {
    const failure = new DataSourceUnavailableError('network', '/api/circuits');
    port.failWith('listCircuits', failure);

    await expect(useCase.execute()).rejects.toBe(failure);
  });
});
