import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: Needed for DI
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { and, eq, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { UserRoleEnum, type UserSchemaType } from 'src/utils/zod.schemas';
import type {
  AuthCredentialsDto,
  AuthResponseSchemaType,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async register(input: AuthCredentialsDto): Promise<AuthResponseSchemaType> {
    const existingUser = await this.getUser(input.email);

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const [newUser] = await this.db
      .insert(schema.usersSchema)
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

  async registerAdmin(
    input: AuthCredentialsDto,
  ): Promise<AuthResponseSchemaType> {
    const existingUser = await this.getUser(input.email);

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const [newAdmin] = await this.db
      .insert(schema.usersSchema)
      .values({
        email: input.email,
        passwordHash,
        role: UserRoleEnum.ADMIN,
      })
      .returning();

    return this.generateTokens(newAdmin);
  }

  async loginAdmin(input: AuthCredentialsDto): Promise<AuthResponseSchemaType> {
    const user = await this.getUser(input.email);

    if (!user || user.role !== UserRoleEnum.ADMIN) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid admin credentials');
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

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      role: user.role,
      redirectTo: user.role === 'ADMIN' ? '/admin' : '/dashboard',
    };
  }

  async getUser(email: string) {
    return this.db.query.usersSchema.findFirst({
      where: and(
        eq(schema.usersSchema.email, email),
        isNull(schema.usersSchema.deletedAt),
      ),
    });
  }
}
