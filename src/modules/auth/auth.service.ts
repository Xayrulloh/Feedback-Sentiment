import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { UserRoleEnum, type UserSchemaType } from 'src/utils/zod.schemas';
import type {
  AuthAdminResponseDto,
  AuthCredentialsDto,
  AuthUserResponseDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async registerUser(input: AuthCredentialsDto): Promise<AuthUserResponseDto> {
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

  async loginUser(input: AuthCredentialsDto): Promise<AuthUserResponseDto> {
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
  ): Promise<AuthAdminResponseDto> {
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

  async loginAdmin(input: AuthCredentialsDto): Promise<AuthAdminResponseDto> {
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
    T extends AuthUserResponseDto | AuthAdminResponseDto,
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
      } as T; //we use as T here because we are returning a generic type based on runtime conditions, and TypeScript can’t infer which of the two
      //  (AuthUserResponseDto | AuthAdminResponseDto) applies without the assertion.
    }

    return {
      token,
      role: user.role,
      redirectTo: '/dashboard',
    } as T; //we use as T here because we are returning a generic type based on runtime conditions, and TypeScript can’t infer which of the two
      //  (AuthUserResponseDto | AuthAdminResponseDto) applies without the assertion.
  }

  async getUser(email: string) {
    return this.db.query.usersSchema.findFirst({
      where: eq(schema.usersSchema.email, email),
    });
  }
}
