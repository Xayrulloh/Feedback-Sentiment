import { createZodDto } from 'nestjs-zod/dto';
import { type UserRoleEnum, UserSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

type JWTPayloadType = {
  sub: string;
  email: string;
  role: UserRoleEnum;
};

const AuthCredentialsSchema = UserSchema.pick({ email: true })
  .merge(
    z.object({
      password: z.string().min(8).describe('User password'),
    }),
  )
  .describe(
    'Credentials for user authentication, including email and password',
  );

const AuthResponseSchema = z.object({
  token: z.string().describe('JWT token'),
  role: z.enum(['USER', 'ADMIN']).describe('User role'),
  redirectTo: z
    .literal('/dashboard')
    .describe('Redirection path after authentication'),
});

class AuthCredentialsDto extends createZodDto(AuthCredentialsSchema) {}
class AuthResponseDto extends createZodDto(AuthResponseSchema) {}

type AuthResponseSchemaType = z.infer<typeof AuthResponseSchema>;

export const AdminAuthResponseSchema = z.object({
  token: z.string().describe('JWT token'),
  role: z.literal('ADMIN').describe('Admin role'),
  redirectTo: z
    .literal('/admin')
    .describe('Redirection path after authentication'),
});

class AdminAuthResponseDto extends createZodDto(AdminAuthResponseSchema) {}

type AdminAuthSchemaType = z.infer<typeof AdminAuthResponseSchema>;

export {
  AuthCredentialsDto,
  AuthResponseDto,
  AdminAuthResponseDto,
  AuthCredentialsSchema,
  AuthResponseSchema,
};
export type { JWTPayloadType, AuthResponseSchemaType, AdminAuthSchemaType };
