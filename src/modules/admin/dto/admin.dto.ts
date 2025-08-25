import { createZodDto } from 'nestjs-zod';
import { RateLimitSchema, UserSchema } from 'src/utils/zod.schemas';
import type z from 'zod';

const AdminDisableSuspendResponseSchema = UserSchema.describe(
  'Response schema for admin disable/suspend operations',
);

class AdminDisableSuspendResponseDto extends createZodDto(
  AdminDisableSuspendResponseSchema,
) {}

type AdminDisableSuspendResponseSchemaType = z.infer<
  typeof AdminDisableSuspendResponseSchema
>;

// rate limiter

const RateLimitUpsertSchema = RateLimitSchema;

class RateLimitUpsertDto extends createZodDto(RateLimitUpsertSchema) {}

type RateLimitUpsertSchemaType = z.infer<typeof RateLimitUpsertSchema>;

const RateLimitGetSchema = RateLimitSchema.array();

class RateLimitGetDto extends createZodDto(RateLimitGetSchema) {}

type RateLimitGetSchemaType = z.infer<typeof RateLimitGetSchema>;

export {
  AdminDisableSuspendResponseSchema,
  AdminDisableSuspendResponseDto,
  type AdminDisableSuspendResponseSchemaType,
  RateLimitUpsertSchema,
  RateLimitUpsertDto,
  type RateLimitUpsertSchemaType,
  RateLimitGetSchema,
  RateLimitGetDto,
  type RateLimitGetSchemaType,
};
