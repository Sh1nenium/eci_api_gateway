import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(4000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        ACCOUNT_SERVICE_URL: Joi.string().required(),
        AUTH_SERVICE_URL: Joi.string().required(),
        TRANSACTION_SERVICE_URL: Joi.string().required(),
      }),
    }),
    ProxyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
