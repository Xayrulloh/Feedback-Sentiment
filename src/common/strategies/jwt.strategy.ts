import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from 'src/database/schema';
import { DrizzleAsyncProvider } from "src/database/drizzle.provider";
import { and, eq, isNull } from "drizzle-orm";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req && req.cookies) {
          return req.cookies['access_token'] || null;
        }
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.db.query.users.findFirst({
      where: and(
        eq(schema.users.id, payload.sub),
        isNull(schema.users.deletedAt)
      ),
    });

    if (!user) throw new UnauthorizedException('Please log in to continue');

    return user;
  }
}
