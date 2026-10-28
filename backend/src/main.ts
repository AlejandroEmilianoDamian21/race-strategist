import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { AppConfig } from './config/app.config.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get(ConfigService<{ app: AppConfig }, true>);

  app.enableCors({ origin: config.get('app.corsOrigin', { infer: true }) });
  app.enableShutdownHooks();

  await app.listen(config.get('app.port', { infer: true }));
}
await bootstrap();
