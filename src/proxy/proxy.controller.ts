/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  All,
  Controller,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import express from 'express';
import { firstValueFrom } from 'rxjs';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class ProxyController {
  private authServiceUrl: string;
  private accountServiceUrl: string;
  private transactionServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL')!;
    this.accountServiceUrl = this.configService.get<string>(
      'ACCOUNT_SERVICE_URL',
    )!;
    this.transactionServiceUrl = this.configService.get<string>(
      'TRANSACTION_SERVICE_URL',
    )!;
  }

  @All('*')
  async proxy(@Req() request: express.Request) {
    const originalPath = request.originalUrl.replace('/api', '');
    let targetServiceUrl: string;

    if (originalPath.startsWith('/auth')) {
      targetServiceUrl = this.authServiceUrl;
    } else if (originalPath.startsWith('/user')) {
      targetServiceUrl = this.accountServiceUrl;
    } else if (originalPath.startsWith('/transaction')) {
      targetServiceUrl = this.transactionServiceUrl;
    } else {
      throw new HttpException('Маршрут не найден', HttpStatus.NOT_FOUND);
    }

    const targetUrl = `${targetServiceUrl}${originalPath}`;

    const {
      host,
      'content-length': contentLength,
      ...headers
    } = request.headers;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: request.method as any,
          url: targetUrl,
          data: request.body,
          headers: headers,
        }),
      );
      return response.data;
    } catch (error) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const data = error.response?.data || {
        message: 'Внутренняя ошибка прокси',
      };
      throw new HttpException(data, status);
    }
  }
}
