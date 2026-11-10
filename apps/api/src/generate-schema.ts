import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function generateSchema() {
  console.log('Compiling Code-First GraphQL schema...');
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  await app.init();
  console.log('✔ GraphQL schema.gql compiled and emitted to disk on the fly.');
  await app.close();
  process.exit(0);
}

generateSchema().catch((err) => {
  console.error('Error generating schema:', err);
  process.exit(1);
});
