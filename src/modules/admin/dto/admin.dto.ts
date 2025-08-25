import { createZodDto } from 'nestjs-zod';
import { RateLimitRuleSchema, UserSchema } from 'src/utils/zod.schemas';
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

class UpsertRateLimitDto extends createZodDto(RateLimitRuleSchema) {}

const RateLimitRulesResponseSchema = RateLimitRuleSchema;

type RateLimitRulesResponseType = z.infer<typeof RateLimitRulesResponseSchema>;

class RateLimitRulesResponseDto extends createZodDto(
  RateLimitRulesResponseSchema,
) {}

export {
  RateLimitRulesResponseSchema,
  UpsertRateLimitDto,
  type RateLimitRulesResponseType,
  RateLimitRulesResponseDto,
  AdminDisableSuspendResponseSchema,
  AdminDisableSuspendResponseDto,
  type AdminDisableSuspendResponseSchemaType,
};
