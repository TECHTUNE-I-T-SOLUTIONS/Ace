import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  app.use((req: { method?: string; url?: string }, _res: unknown, next: () => void) => {
    console.log(`[ACE API] ${req.method} ${req.url}`);
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('ACE API')
    .setDescription('Academic Companion & Efficiency backend')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
