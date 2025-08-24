import { createZodDto } from 'nestjs-zod';
import { RateLimitRuleSchema, deleteRateLimitQuerySchema } from 'src/utils/zod.schemas';
import z from 'zod';

export class UpsertRateLimitDto extends createZodDto(RateLimitRuleSchema) {}

export class DeleteRateLimitQueryDto extends createZodDto(deleteRateLimitQuerySchema) {}

export const RateLimitRulesResponseSchema = z.object({
    rules: RateLimitRuleSchema.array()
})

export type RateLimitRulesResponseType = z.infer<typeof RateLimitRulesResponseSchema>;

export class RateLimitRulesResponseDto extends createZodDto(RateLimitRulesResponseSchema){}