import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Microservices API Gateway')
    .setDescription('Документация API для нашего микросервисного приложения.')
    .setVersion('1.0')
    .addServer('/api')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap()
  .then(() => console.log('API Gateway started'))
  .catch((error) => console.error(error));
