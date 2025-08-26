import { createZodDto } from 'nestjs-zod';
import { PaginationSchema, UserSchema } from 'src/utils/zod.schemas';
import * as z from 'zod';

const UserResponseSchema = z.object({
  users: UserSchema.array(),
  pagination: PaginationSchema.optional(),
});

type UserResponseSchemaType = z.infer<typeof UserResponseSchema>;

class UserResponseDto extends createZodDto(UserResponseSchema) {}

const UserQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

class UserQueryDto extends createZodDto(UserQuerySchema) {}

const UserSearchQuerySchema = z.object({
  email: z.string().email().describe('Email to search for'),
});

class UserSearchQueryDto extends createZodDto(UserSearchQuerySchema) {}

const UserSearchResponseSchema = UserSchema.array();
type UserSearchResponseSchemaType = z.infer<typeof UserSearchResponseSchema>;

export {
  UserResponseSchema,
  type UserResponseSchemaType,
  UserResponseDto,
  UserQuerySchema,
  UserQueryDto,
  UserSearchQuerySchema,
  UserSearchQueryDto,
  UserSearchResponseSchema,
  type UserSearchResponseSchemaType,
};
