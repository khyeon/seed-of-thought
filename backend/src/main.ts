import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function bootstrap() {
  // Manual env loading for early access to PORT or other configs before AppModule initialization
  const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
  const envPath = path.resolve(process.cwd(), envFile);
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath, override: true });
  console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL?.split('@')[1] || 'NOT SET'}`);

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://seed-of-thought.vercel.app',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
      'http://localhost:19006',
      'http://127.0.0.1:19006',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
