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

const AuthUserResponseSchema = z.object({
  token: z.string().describe('JWT token'),
  role: z.literal('USER').describe('User role'),
  redirectTo: z
    .literal('/dashboard')
    .describe('Redirection path after authentication'),
});

class AuthCredentialsDto extends createZodDto(AuthCredentialsSchema) {}
class AuthUserResponseDto extends createZodDto(AuthUserResponseSchema) {}

type AuthUserResponseSchemaType = z.infer<typeof AuthUserResponseSchema>;

export const AuthAdminResponseSchema = z.object({
  token: z.string().describe('JWT token'),
  role: z.literal('ADMIN').describe('Admin role'),
  redirectTo: z
    .literal('/admin')
    .describe('Redirection path after authentication'),
});

class AuthAdminResponseDto extends createZodDto(AuthAdminResponseSchema) {}

type AuthAdminResponseSchemaType = z.infer<typeof AuthAdminResponseSchema>;

export {
  AuthCredentialsDto,
  AuthUserResponseDto,
  AuthAdminResponseDto,
  AuthCredentialsSchema,
  AuthUserResponseSchema,
};
export type {
  JWTPayloadType,
  AuthUserResponseSchemaType,
  AuthAdminResponseSchemaType,
};
