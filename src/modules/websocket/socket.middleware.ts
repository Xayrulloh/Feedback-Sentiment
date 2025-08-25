import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Needed for DI
import { ConfigService } from '@nestjs/config';
// biome-ignore lint/style/useImportType: Needed for DI
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Socket } from 'socket.io';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';

@Injectable()
export class SocketMiddleware {
  private readonly jwtSecret: string;

  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  async use(socket: Socket, next: (err?: Error) => void): Promise<void> {
    try {
      const user = await this.authenticate(socket);
      socket.data.user = user;

      next();
    } catch (error) {
      const message =
        error instanceof UnauthorizedException
          ? error.message
          : 'Authentication failed';

      next(new Error(message));
    }
  }

  private async authenticate(socket: Socket) {
    const token = socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const decoded = await this.jwtService.verifyAsync<{
      sub: string;
      role: string;
    }>(token, {
      secret: this.jwtSecret,
    });

    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.id, decoded.sub),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
