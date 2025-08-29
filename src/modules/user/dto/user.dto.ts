import { createZodDto } from 'nestjs-zod';
import { PaginationSchema, UserSchema } from 'src/utils/zod.schemas';
import * as z from 'zod';

// ==================== Query ====================

/**
 * Query parameters for fetching a paginated list of users
 */
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

/**
 * Query parameters for searching users by email
 */
const UserSearchQuerySchema = z.object({
  email: z.string().trim().min(3).describe('Email substring to search for'),
});

class UserSearchQueryDto extends createZodDto(UserSearchQuerySchema) {}

// ==================== Response ====================

/**
 * Response containing a list of users with optional pagination
 */
const UserResponseSchema = z.object({
  users: UserSchema.array().describe('List of users'),
  pagination: PaginationSchema.optional().describe('Pagination metadata'),
});

class UserResponseDto extends createZodDto(UserResponseSchema) {}

/**
 * Response containing a list of users matching a search query
 */
const UserSearchResponseSchema = UserSchema.array().describe(
  'List of users matching search criteria',
);

class UserSearchResponseDto extends createZodDto(UserSearchResponseSchema) {}

// ==================== Exports ====================

export {
  // Query
  UserQuerySchema,
  UserQueryDto,
  UserSearchQuerySchema,
  UserSearchQueryDto,
  // Response
  UserResponseSchema,
  UserResponseDto,
  UserSearchResponseSchema,
  UserSearchResponseDto,
};
