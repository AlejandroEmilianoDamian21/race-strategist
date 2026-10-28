import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { F1DataPort } from './application/ports/f1-data.port.js';
import { GetRaceOverview } from './application/use-cases/get-race-overview.use-case.js';
import { ListRaces } from './application/use-cases/list-races.use-case.js';
import { SimulateStrategy } from './application/use-cases/simulate-strategy.use-case.js';
import { appConfig, type AppConfig } from './config/app.config.js';
import { F1ApiAdapter } from './infrastructure/f1-api/f1-api.adapter.js';
import { F1ApiClient } from './infrastructure/f1-api/f1-api.client.js';
import {
  F1_API_OPTIONS,
  type F1ApiOptions,
} from './infrastructure/f1-api/f1-api.options.js';
import { HttpExceptionFilter } from './infrastructure/http/filters/http-exception.filter.js';
import { RacesController } from './infrastructure/http/races.controller.js';
import { SimulationController } from './infrastructure/http/simulation.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: [appConfig] }),
  ],
  controllers: [RacesController, SimulationController],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    ListRaces,
    GetRaceOverview,
    SimulateStrategy,
    {
      provide: F1_API_OPTIONS,
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<{ app: AppConfig }, true>,
      ): F1ApiOptions => config.get('app.f1Api', { infer: true }),
    },
    F1ApiClient,
    { provide: F1DataPort, useClass: F1ApiAdapter },
  ],
})
export class AppModule {}
