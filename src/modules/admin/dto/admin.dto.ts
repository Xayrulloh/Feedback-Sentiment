import { createZodDto } from 'nestjs-zod';
import {
  BaseSchema,
  RateLimitErrorEnum,
  RateLimitSchema,
  RateLimitTargetEnum,
  UserSchema,
} from 'src/utils/zod.schemas';
import z from 'zod';

// ==================== Admin ====================

const AdminDisableSuspendResponseSchema = UserSchema.describe(
  'Response schema for admin disable/suspend operations',
);

// ==================== Rate Limiter ====================

const RateLimitUpsertSchema = RateLimitSchema.describe(
  'Rrate limit upsert data from request',
);

const RateLimitGetSchema = RateLimitSchema.array().describe(
  'rate limit get schema as an array',
);

// ==================== Monitoring ====================

const MetricsSchema = z
  .object({
    uploads: z.number().int().nonnegative().describe('Total uploads count'),
    apiUsage: z
      .array(
        z.object({
          method: z.string(),
          endpoint: z.string(),
          count: z.number().int().nonnegative(),
        }),
      )
      .describe('API usage per endpoint'),
    errorRates: z
      .array(
        z.object({
          method: z.string(),
          endpoint: z.string(),
          count: z.number().int().nonnegative(),
        }),
      )
      .describe('Error counts per endpoint'),
  })
  .describe('App metrics data');

// ==================== Suspicious Activities ====================

const SuspiciousActivityResponseSchema = z
  .object({
    userId: z.string().uuid().nullable(),
    email: z.string().email().nullable(),
    ip: z.string().max(45).nullable(),
    action: z.enum([
      RateLimitTargetEnum.API,
      RateLimitTargetEnum.DOWNLOAD,
      RateLimitTargetEnum.LOGIN,
      RateLimitTargetEnum.UPLOAD,
    ]),
    error: z.enum([
      RateLimitErrorEnum.TOO_MANY_API,
      RateLimitErrorEnum.TOO_MANY_DOWNLOAD,
      RateLimitErrorEnum.TOO_MANY_LOGIN,
      RateLimitErrorEnum.TOO_MANY_UPLOAD,
    ]),
    details: z.string().nullable(),
  })
  .merge(BaseSchema)
  .array()
  .describe('List of suspicious activities');

// DTOs
class AdminDisableSuspendResponseDto extends createZodDto(
  AdminDisableSuspendResponseSchema,
) {}
class RateLimitUpsertDto extends createZodDto(RateLimitUpsertSchema) {}
class RateLimitGetDto extends createZodDto(RateLimitGetSchema) {}
class MetricsDto extends createZodDto(MetricsSchema) {}
class SuspiciousActivityResponseDto extends createZodDto(
  SuspiciousActivityResponseSchema,
) {}

export {
  AdminDisableSuspendResponseSchema,
  AdminDisableSuspendResponseDto,
  RateLimitUpsertSchema,
  RateLimitUpsertDto,
  RateLimitGetSchema,
  RateLimitGetDto,
  MetricsSchema,
  MetricsDto,
  SuspiciousActivityResponseSchema,
  SuspiciousActivityResponseDto,
};
