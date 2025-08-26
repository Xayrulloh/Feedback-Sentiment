import { createZodDto } from 'nestjs-zod';
import { RateLimitSchema, UserSchema } from 'src/utils/zod.schemas';
import z from 'zod';

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

// Monitoring

const MetricsSchema = z.object({
  uploads: z.number().int().nonnegative(),
  apiUsage: z.array(
    z.object({
      method: z.string(),
      endpoint: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  errorRates: z.array(
    z.object({
      method: z.string(),
      endpoint: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
});

type MetricsSchemaType = z.infer<typeof MetricsSchema>;

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
  MetricsSchema,
  type MetricsSchemaType,
};
