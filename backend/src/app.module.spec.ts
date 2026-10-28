import { Test } from '@nestjs/testing';
import { AppModule } from './app.module.js';
import { F1DataPort } from './application/ports/f1-data.port.js';
import { GetRaceOverview } from './application/use-cases/get-race-overview.use-case.js';
import { F1ApiAdapter } from './infrastructure/f1-api/f1-api.adapter.js';

describe('AppModule', () => {
  it('binds the F1DataPort to the F1ApiAdapter', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(F1DataPort)).toBeInstanceOf(F1ApiAdapter);
  });

  it('provides the GetRaceOverview use case', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(GetRaceOverview)).toBeInstanceOf(GetRaceOverview);
  });
});
