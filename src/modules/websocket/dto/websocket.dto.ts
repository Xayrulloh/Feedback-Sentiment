import { SuspiciousActivityEventSchema } from 'src/modules/admin/dto/admin.dto';
import { z } from 'zod';

const WebSocketEventSchema = z.object({
  event: z.string(),
  data: z.union([
    SuspiciousActivityEventSchema,
    z.number().int().nonnegative(),
  ]),
});
type WebSocketEventSchemaType = z.infer<typeof WebSocketEventSchema>;

export { WebSocketEventSchema, type WebSocketEventSchemaType };
