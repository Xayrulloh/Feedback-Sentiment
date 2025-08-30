import { createZodDto } from 'nestjs-zod';
import { PaginationResponseSchema, UserSchema } from 'src/utils/zod.schemas';
import * as z from 'zod';

// ==================== Query ====================

const UserQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Number of users to fetch per page'),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('Page number for pagination'),
});

class UserQueryDto extends createZodDto(UserQuerySchema) {}

const UserSearchQuerySchema = z.object({
  email: z.string().trim().min(3).describe('Email substring to search for'),
});

class UserSearchQueryDto extends createZodDto(UserSearchQuerySchema) {}

// ==================== Response ====================

const UserResponseSchema = z.object({
  users: UserSchema.array().describe('List of users'),
  pagination: PaginationResponseSchema.optional().describe(
    'Pagination metadata',
  ),
});

class UserResponseDto extends createZodDto(UserResponseSchema) {}

const UserSearchResponseSchema = UserSchema.array().describe(
  'List of users matching search criteria',
);

class UserSearchResponseDto extends createZodDto(UserSearchResponseSchema) {}

export {
  UserQuerySchema,
  UserQueryDto,
  UserSearchQuerySchema,
  UserSearchQueryDto,
  UserResponseSchema,
  UserResponseDto,
  UserSearchResponseSchema,
  UserSearchResponseDto,
};
