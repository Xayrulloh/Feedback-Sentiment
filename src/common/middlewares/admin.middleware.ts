import {
  ForbiddenException,
  Inject,
  Injectable,
  type NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { NextFunction, Response } from 'express';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { SuspiciousActivityEventSchema } from 'src/modules/websocket/dto/websocket.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { SocketGateway } from 'src/modules/websocket/websocket.gateaway';
import type { AuthenticatedRequest } from 'src/shared/types/request-with-user';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  private requestTimestamps = new Map<string, number[]>();
  private readonly TIME_WINDOW = 60 * 1000;
  private readonly MAX_REQUESTS = 5;

  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly socketGateway: SocketGateway,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, req.body?.email || req.user?.email),
    });

    const suspiciousActivities = this.detectSuspiciousActivity(req, res);

    if (suspiciousActivities.length > 0) {
      suspiciousActivities.forEach((activity) => {
        const event = SuspiciousActivityEventSchema.parse({
          id: uuidv4(),
          userId: user?.id,
          email: user?.email || req.body?.email,
          activityType: activity.type,
          details: activity.details,
          timestamp: new Date(),
        });

        this.socketGateway.notifyAdmin({
          event: 'suspiciousActivity',
          data: event,
        });
      });
    }

    if (!user) {
      return next();
    }

    if (user.isDisabled) {
      throw new UnauthorizedException('User account is disabled');
    }

    if (user.deletedAt) {
      throw new ForbiddenException('User account is suspended');
    }

    next();
  }

  private detectSuspiciousActivity(req: AuthenticatedRequest, res: Response) {
    const activities: { type: string; details: string }[] = [];
    const user = req.user;

    if (this.isRapidRequest(req)) {
      activities.push({
        type: 'RAPID_REQUEST',
        details: `Multiple requests from IP ${req.ip}/${req.user?.id} within short timeframe`,
      });
    }

    if (req.path.includes('login') && res.statusCode === 401) {
      activities.push({
        type: 'FAILED_LOGIN',
        details: `Failed login attempt for ${req.body.email || 'unknown email'}`,
      });
    }

    if (user?.isDisabled) {
      activities.push({
        type: 'UNUSUAL_ACTIVITY',
        details: `Disabled user ${user.email} attempted access`,
      });
    }

    if (user?.deletedAt) {
      activities.push({
        type: 'UNUSUAL_ACTIVITY',
        details: `Suspended user ${user.email} attempted access`,
      });
    }

    return activities;
  }

  private isRapidRequest(req: AuthenticatedRequest): boolean {
    const identifier = req.ip || req.user?.id || 'unknown';
    if (identifier === 'unknown') return false;

    const now = Date.now();
    const timestamps = this.requestTimestamps.get(identifier) || [];
    const recentTimestamps = timestamps.filter(
      (t) => now - t < this.TIME_WINDOW,
    );

    recentTimestamps.push(now);

    this.requestTimestamps.set(identifier, recentTimestamps);

    return recentTimestamps.length > this.MAX_REQUESTS;
  }
}
