import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Needed for DI
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';

@Injectable()
export class SocketMiddleware {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly configService: ConfigService,
  ) {}

  async use(socket: Socket, next: (err?: Error) => void) {
    const user = await this.authenticate(socket).catch((error) => {
      const message =
        error instanceof UnauthorizedException
          ? error.message
          : 'Authentication failed';
      next(new Error(message));
      return null;
    });

    if (!user) return;

    socket.data.user = user;
    next();
  }

  private async authenticate(socket: Socket) {
    const token = socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('No token provided');

    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const decoded = jwt.verify(token, secret) as { sub: string; role: string };

    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.id, decoded.sub),
    });

    if (!user) throw new UnauthorizedException('User not found');

    return user;
  }
}
