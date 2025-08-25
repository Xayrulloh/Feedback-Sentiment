import { z } from 'zod';

// FIXME: Move them to admin part
const ActivityTypeEnum = z.enum([
  'FAILED_LOGIN',
  'RAPID_REQUEST',
  'UNUSUAL_ACTIVITY',
]);
type ActivityType = z.infer<typeof ActivityTypeEnum>;

const SuspiciousActivityEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  activityType: ActivityTypeEnum,
  details: z.string().optional(),
  timestamp: z.date(),
});
type SuspiciousActivityEventSchemaType = z.infer<
  typeof SuspiciousActivityEventSchema
>;

const WebSocketEventSchema = z.object({
  event: z.string(),
  data: z.union([
    SuspiciousActivityEventSchema,
    z.number().int().nonnegative(),
  ]),
});
type WebSocketEventSchemaType = z.infer<typeof WebSocketEventSchema>;

export {
  ActivityTypeEnum,
  type ActivityType,
  SuspiciousActivityEventSchema,
  type SuspiciousActivityEventSchemaType,
  WebSocketEventSchema,
  type WebSocketEventSchemaType,
};
