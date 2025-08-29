import { createZodDto } from 'nestjs-zod/dto';
import { UserRoleEnum, UserSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

// ==================== Types ====================

/**
 * JWT payload type embedded in the access token
 */
type JWTPayloadType = {
  sub: string;
  email: string;
  role: UserRoleEnum;
};

// ==================== Credentials ====================

/**
 * DTO for user login credentials (email + password)
 */
const AuthCredentialsSchema = UserSchema.pick({ email: true }).merge(
  z.object({
    password: z.string().min(8).describe('User password'),
  }),
);

class AuthCredentialsDto extends createZodDto(AuthCredentialsSchema) {}

// ==================== User Auth ====================

/**
 * Response DTO returned after user login
 */
const AuthUserResponseSchema = z.object({
  token: z.string().describe('JWT access token'),
  role: z.literal('USER').describe('User role'),
  redirectTo: z.literal('/dashboard').describe('Redirect path after login'),
});

class AuthUserResponseDto extends createZodDto(AuthUserResponseSchema) {}

// ==================== Admin Auth ====================

/**
 * Response DTO returned after admin login
 */
const AuthAdminResponseSchema = z.object({
  token: z.string().describe('JWT access token'),
  role: z.literal('ADMIN').describe('Admin role'),
  redirectTo: z.literal('/admin').describe('Redirect path after login'),
});

class AuthAdminResponseDto extends createZodDto(AuthAdminResponseSchema) {}

// ==================== Exports ====================

export {
  // Credentials
  AuthCredentialsSchema,
  AuthCredentialsDto,
  // User Auth
  AuthUserResponseSchema,
  AuthUserResponseDto,
  // Admin Auth
  AuthAdminResponseSchema,
  AuthAdminResponseDto,
};
export type { JWTPayloadType };
