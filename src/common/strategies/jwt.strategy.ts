import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/database/schema';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import { and, eq, isNull } from 'drizzle-orm';
import { type ConfigService } from '@nestjs/config';
import { EnvType } from 'src/config/env/env-validation';
import { JWTPayloadType } from 'src/modules/auth/dto/auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    protected configService: ConfigService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req && req.cookies) {
          return req.cookies['access_token'] || null;
        }
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<EnvType['JWT_SECRET']>(
        'JWT_SECRET'
      ) as string,
    });
  }

  async validate(payload: JWTPayloadType) {
    const user = await this.db.query.users.findFirst({
      where: and(
        eq(schema.users.id, payload.sub),
        isNull(schema.users.deletedAt),
      ),
    });

    if (!user) throw new UnauthorizedException('Please log in to continue');

    return user;
  }
}
