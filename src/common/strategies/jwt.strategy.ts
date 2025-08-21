import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: Needed for DI
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvType } from 'src/config/env/env-validation';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type { JWTPayloadType } from 'src/modules/auth/dto/auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    protected configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<EnvType['JWT_SECRET']>(
        'JWT_SECRET',
      ) as string,
    });
  }

  async validate(payload: JWTPayloadType) {
    const user = await this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.id, payload.sub),
    });

    if (!user) {
      throw new UnauthorizedException('Please log in to continue');
    }

    if (user.isDisabled) {
      throw new ForbiddenException('User account is disabled');
    }

    if (user.deletedAt) {
      throw new ForbiddenException('User account is suspended');
    }

    return user;
  }
}
