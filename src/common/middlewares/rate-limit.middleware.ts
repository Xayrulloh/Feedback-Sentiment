import { Injectable, UnauthorizedException, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { RateLimitService } from 'src/modules/rate-limit/rate-limit.service';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import type { JWTPayloadType } from 'src/modules/auth/dto/auth.dto';
import { EnvType } from 'src/config/env/env-validation';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly rl: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = this.rl.normalizePath(req);
    const method = req.method.toUpperCase();

    console.log(`[RateLimitMiddleware] Request path: ${path}, method: ${method}`);

    const rule = await this.rl.findRule(method, path);
    if (!rule) {
          console.log('[RateLimitMiddleware] No rule found for this route');
          return next();
    } 

    const authHeader = req.headers.authorization;
    let subject: string;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = jwt.verify(
          token,
          this.configService.get<EnvType>('JWT_SECRET'),
        ) as JWTPayloadType;

        subject = `user:${payload.sub}`;
        (req as any).user = payload;
        console.log('[RateLimitMiddleware] User extracted from JWT:', payload);
      } catch (err) {
        subject = `ip:${req.ip}`; // fallback to IP if token invalid
        console.log('[RateLimitMiddleware] Invalid JWT, falling back to IP:', req.ip);
      }
    } else {
      subject = `ip:${req.ip}`;
      console.log('[RateLimitMiddleware] No JWT, using IP as subject:', req.ip);
    }

    const { allowed, remaining } = await this.rl.enforce(rule, subject);

     console.log(`[RateLimitMiddleware] Rate limit check: allowed=${allowed}, remaining=${remaining}`);

    res.setHeader('X-RateLimit-Limit', rule.limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (!allowed) {
        console.log('[RateLimitMiddleware] Rate limit exceeded for subject:', subject);
      return res.status(429).json({
        success: false,
        statusCode: 429,
        message: 'Too Many Requests',
        timestamp: new Date().toISOString(),
        path,
      });
    }

    next();
  }
}
