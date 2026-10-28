import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config.js';

/**
 * Composition root: the only place where ports are bound to their adapters.
 * Feature modules will be registered here as they are added.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, load: [appConfig] })],
})
export class AppModule {}
