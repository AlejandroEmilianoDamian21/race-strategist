import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { F1DataPort } from './application/ports/f1-data.port.js';
import { appConfig, type AppConfig } from './config/app.config.js';
import { F1ApiAdapter } from './infrastructure/f1-api/f1-api.adapter.js';
import { F1ApiClient } from './infrastructure/f1-api/f1-api.client.js';
import {
  F1_API_OPTIONS,
  type F1ApiOptions,
} from './infrastructure/f1-api/f1-api.options.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: [appConfig] }),
  ],
  providers: [
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
