import { createZodDto } from 'nestjs-zod/dto';
import { type UserRoleEnum, UserSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

// ==================== Types ====================

type JWTPayloadType = {
  sub: string;
  email: string;
  role: UserRoleEnum;
};

// ==================== Credentials ====================

const AuthCredentialsSchema = UserSchema.pick({ email: true })
  .merge(
    z.object({
      password: z.string().min(8).describe('User password'),
    }),
  )
  .describe('Auth credentials data');

// ==================== User Auth ====================

const AuthUserResponseSchema = z
  .object({
    token: z.string().describe('JWT access token'),
    role: z.literal('USER').describe('User role'),
    redirectTo: z.literal('/dashboard').describe('Redirect path after login'),
  })
  .describe('Response data after login or register');

// ==================== Admin Auth ====================

const AuthAdminResponseSchema = z
  .object({
    token: z.string().describe('JWT access token'),
    role: z.literal('ADMIN').describe('Admin role'),
    redirectTo: z.literal('/admin').describe('Redirect path after login'),
  })
  .describe('Response data after admin login or register');

class AuthAdminResponseDto extends createZodDto(AuthAdminResponseSchema) {}
class AuthCredentialsDto extends createZodDto(AuthCredentialsSchema) {}
class AuthUserResponseDto extends createZodDto(AuthUserResponseSchema) {}

export {
  AuthCredentialsSchema,
  AuthCredentialsDto,
  AuthUserResponseSchema,
  AuthUserResponseDto,
  AuthAdminResponseSchema,
  AuthAdminResponseDto,
  type JWTPayloadType,
};
