import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
// FIXME: Research to fix this, instead of using every time we need better solution
// biome-ignore lint/style/useImportType: Needed for DI
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { UserRoleEnum, type UserSchemaType } from 'src/utils/zod.schemas';
import type {
  AuthAdminResponseSchemaType,
  AuthCredentialsDto,
  AuthUserResponseSchemaType,
} from './dto/auth.dto';

// Give proper Scopes to inject
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async registerUser(
    input: AuthCredentialsDto,
  ): Promise<AuthUserResponseSchemaType> {
    const existingUser = await this.getUser(input.email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
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

  async loginUser(
    input: AuthCredentialsDto,
  ): Promise<AuthUserResponseSchemaType> {
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
  ): Promise<AuthAdminResponseSchemaType> {
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

  async loginAdmin(
    input: AuthCredentialsDto,
  ): Promise<AuthAdminResponseSchemaType> {
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

  private async generateTokens<
    T extends AuthUserResponseSchemaType | AuthAdminResponseSchemaType,
  >(user: Pick<UserSchemaType, 'id' | 'email' | 'role'>): Promise<T> {
    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    if (user.role === UserRoleEnum.ADMIN) {
      return {
        token,
        role: user.role,
        redirectTo: '/admin',
      } as T;
    }

    return {
      token,
      role: user.role,
      redirectTo: '/dashboard',
    } as T;
  }

  async getUser(email: string) {
    return this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, email),
    });
  }
}
