import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Cummins OS API')
    .setDescription('Industrial fleet intelligence, diagnostics, and predictive maintenance platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('Health')
    .addTag('Fleet')
    .addTag('Diagnostics')
    .addTag('Maintenance')
    .addTag('Analytics')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = parseInt(process.env.API_PORT || '3001');
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen(port, host);
  console.log(`✨ Cummins OS API running on http://${host}:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
