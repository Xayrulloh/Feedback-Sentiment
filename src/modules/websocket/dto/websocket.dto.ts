import { createZodDto } from 'nestjs-zod';
import { RateLimitEventSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

const WebSocketEventSchema = z
  .object({
    event: z.string(),
    data: z.union([RateLimitEventSchema, z.number().int().nonnegative()]),
  })
  .describe(
    'The event payload, either a rate limit event or a non-negative number',
  );

class WebSocketEventSchemaDto extends createZodDto(WebSocketEventSchema) {}

export { WebSocketEventSchema, WebSocketEventSchemaDto };
