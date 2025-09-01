import { createZodDto } from 'nestjs-zod';
import { PaginationResponseSchema, UserSchema } from 'src/utils/zod.schemas';
import * as z from 'zod';

// ==================== Query ====================

//User Query schema
const UserQuerySchema = z
  .object({
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
  })
  .describe('User Query schema');

//Request user search email data
const UserSearchQuerySchema = z
  .object({
    email: z.string().trim().min(3).describe('Email substring to search for'),
  })
  .describe('Request user search email data');

// ==================== Response ====================

//Users response data with pagination
const UserResponseSchema = z
  .object({
    users: UserSchema.array().describe('List of users'),
    pagination: PaginationResponseSchema.optional().describe(
      'Pagination metadata',
    ),
  })
  .describe('Users response data with pagination');

//List of users matching search criteria
const UserSearchResponseSchema = UserSchema.array().describe(
  'List of users matching search criteria',
);

class UserQueryDto extends createZodDto(UserQuerySchema) {}
class UserSearchResponseDto extends createZodDto(UserSearchResponseSchema) {}
class UserSearchQueryDto extends createZodDto(UserSearchQuerySchema) {}
class UserResponseDto extends createZodDto(UserResponseSchema) {}

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
