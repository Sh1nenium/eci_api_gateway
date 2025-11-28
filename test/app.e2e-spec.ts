/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('ProxyController (e2e)', () => {
  let app: INestApplication;
  let httpService: HttpService;

  const mockHttpService = {
    request: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpService = moduleFixture.get<HttpService>(HttpService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Proxy routes', () => {
    it('POST /auth/login -> should proxy to auth service', () => {
      const mockResponse: AxiosResponse = {
        data: { token: 'proxied_token' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@test.com', password: 'pass' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual(mockResponse.data);
          expect(mockHttpService.request).toHaveBeenCalledWith(
            expect.objectContaining({
              method: 'POST',
              url: expect.stringContaining('/auth/login'),
            }),
          );
        });
    });

    it('should handle errors from downstream service', () => {
      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Unauthorized downstream' },
        },
      };

      mockHttpService.request.mockReturnValue(throwError(() => errorResponse));

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong', password: 'wrong' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toEqual('Unauthorized downstream');
        });
    });
  });

  describe('User Proxy routes', () => {
    it('GET /user -> should proxy to account service', () => {
      const mockResponse: AxiosResponse = {
        data: [{ id: 1, email: 'test' }],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.request.mockReturnValue(of(mockResponse));

      return request(app.getHttpServer())
        .get('/user')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(mockResponse.data);
          expect(mockHttpService.request).toHaveBeenCalledWith(
            expect.objectContaining({
              method: 'GET',
              url: expect.stringContaining('/user'),
            }),
          );
        });
    });
  });
});
