import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as schema from 'src/database/schema';
import * as bcrypt from 'bcrypt';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';

import { and, eq, isNull } from 'drizzle-orm';
import { UserRoleEnum, UserSchemaType } from 'src/utils/zod.schemas';
import { AuthCredentialsDto, AuthResponseSchemaType } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async register(input: AuthCredentialsDto): Promise<AuthResponseSchemaType> {
    const existing = await this.getUser(input.email);

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const [newUser] = await this.db
      .insert(schema.userSchema)
      .values({
        email: input.email,
        passwordHash: passwordHash,
        role: UserRoleEnum.USER,
      })
      .returning();

    return this.generateTokens(newUser);
  }

  async login(input: AuthCredentialsDto): Promise<AuthResponseSchemaType> {
    const user = await this.getUser(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async generateTokens(
    user: Pick<UserSchemaType, 'id' | 'email' | 'role'>,
  ): Promise<AuthResponseSchemaType> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
    });

    return {
      token,
      role: user.role,
      redirectTo: '/dashboard',
    };
  }

  async getUser(email: string) {
    return this.db.query.userSchema.findFirst({
      where: and(eq(schema.userSchema.email, email), isNull(schema.userSchema.deletedAt)),
    });
  }
}
