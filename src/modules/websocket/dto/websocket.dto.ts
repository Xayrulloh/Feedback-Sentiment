import { RateLimitEventSchema } from 'src/utils/zod.schemas';
import { z } from 'zod';

// TODO: describe
const WebSocketEventSchema = z.object({
  event: z.string(),
  data: z.union([RateLimitEventSchema, z.number().int().nonnegative()]),
});
type WebSocketEventSchemaType = z.infer<typeof WebSocketEventSchema>;

export { WebSocketEventSchema, type WebSocketEventSchemaType };
