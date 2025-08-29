import { createZodDto } from 'nestjs-zod';
import {
  BaseSchema,
  RateLimitErrorEnum,
  RateLimitSchema,
  RateLimitTargetEnum,
  UserSchema,
} from 'src/utils/zod.schemas';
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

// TODO: describe
const RateLimitUpsertSchema = RateLimitSchema;

class RateLimitUpsertDto extends createZodDto(RateLimitUpsertSchema) {}

// FIXME: REMOVE ALL TYPE THINGS FROM ALL .dto.ts FILES AND USE DTO INSTEAD (not RateLimitUpsertSchemaType but RateLimitUpsertDto)
type RateLimitUpsertSchemaType = z.infer<typeof RateLimitUpsertSchema>;

// TODO: describe
const RateLimitGetSchema = RateLimitSchema.array();

class RateLimitGetDto extends createZodDto(RateLimitGetSchema) {}

type RateLimitGetSchemaType = z.infer<typeof RateLimitGetSchema>;

// Monitoring

// TODO: describe
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

// Suspicious Activities

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
type SuspiciousActivityResponseSchemaType = z.infer<
  typeof SuspiciousActivityResponseSchema
>;

class SuspiciousActivityResponseDto extends createZodDto(
  SuspiciousActivityResponseSchema,
) {}

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
  SuspiciousActivityResponseSchema,
  type SuspiciousActivityResponseSchemaType,
  SuspiciousActivityResponseDto,
};
