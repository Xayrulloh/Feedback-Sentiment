import { createZodDto } from 'nestjs-zod/dto';
import { UserRoleEnum, UserSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

type JWTPayloadType = {
  sub: string;
  email: string;
  role: UserRoleEnum;
};

const AuthCredentialsSchema = UserSchema.pick({ email: true }).merge(
  z.object({
    password: z.string().min(8).describe('User password'),
  }),
);

class AuthCredentialsDto extends createZodDto(AuthCredentialsSchema) {}

const AuthResponseSchema = z.object({
  token: z.string().describe('JWT token'),
  role: z.enum(['USER', 'ADMIN']).describe('User role'),
  redirectTo: z
    .literal('/dashboard')
    .describe('Redirection path after authentication'),
});

class AuthResponseDto extends createZodDto(AuthResponseSchema) {}

type AuthResponseSchemaType = z.infer<typeof AuthResponseSchema>;

// TODO: make all as grouped (first enums, then zod schemas, then zod dtos, then types)

export {
  AuthCredentialsDto,
  AuthResponseDto,
  AuthCredentialsSchema,
  AuthResponseSchema,
};
export type { JWTPayloadType, AuthResponseSchemaType };
