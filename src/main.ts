import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser'; // Add this import
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

dotenv.config();

class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'https://www.revsticks.ch',
          'https://revsticks.ch',
          'https://stage.revsticks.ch',
          'https://www.stage.revsticks.ch',
          'http://api-stage.revsticks.ch',
          'https://api-stage.revsticks.ch',
          'http://api.revsticks.ch',
          'https://api.revsticks.ch',
        ],
        credentials: true,
      },
      allowEIO3: true, // Allow Socket.IO v3 clients
      path: '/socket.io', // Ensure path matches the gateway
    });
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new CustomIoAdapter(app));

  app.use(bodyParser.json({ limit: '500mb' }));
  app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Strip unknown properties
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use(cookieParser());

  // Configure CORS
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://www.revsticks.ch',
        'https://revsticks.ch',
        'https://stage.revsticks.ch',
        'https://www.stage.revsticks.ch',
        'http://api-stage.revsticks.ch',
        'https://api-stage.revsticks.ch',
        'http://api.revsticks.ch',
        'https://api.revsticks.ch',
      ];

      // For requests with no origin (like mobile apps or Postman)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'Origin',
    ],
    exposedHeaders: ['X-CSRF-Token'],
  });

  const server = await app.listen(process.env.PORT || 3000);
  server.setTimeout(300000); // 5 minutes timeout for large uploads
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
