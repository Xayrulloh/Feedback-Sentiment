import { Injectable, type NestMiddleware } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Needed for DI
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import type { EnvType } from 'src/config/env/env-validation';
import type { JWTPayloadType } from 'src/modules/auth/dto/auth.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { RateLimitService } from 'src/modules/rate-limit/rate-limit.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly rl: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = this.rl.normalizePath(req);
    const method = req.method.toUpperCase();

    const rule = await this.rl.findRule(method, path);
    if (!rule) {
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
      } catch (_err) {
        subject = `ip:${req.ip}`;
      }
    } else {
      subject = `ip:${req.ip}`;
    }

    const { allowed, remaining } = await this.rl.enforce(rule, subject);

    res.setHeader('X-RateLimit-Limit', rule.limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (!allowed) {
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
