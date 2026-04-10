import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csurf from 'csurf';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      maxAge: 3600 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      domain:
        process.env.NODE_ENV === 'production' ? '.revsticks.ch' : undefined,
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    // console.log('CSRF Middleware: Checking CSRF token');
    // console.log('CSRF Middleware: Request cookies:', req.cookies);
    // console.log('CSRF Middleware: Headers:', req.headers);
    this.csrfProtection(req, res, (err) => {
      if (err) {
        console.error('CSRF Middleware Error:', err);
      }
      next(err);
    });
  }
}
