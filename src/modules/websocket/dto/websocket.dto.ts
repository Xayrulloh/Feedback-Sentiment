import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UserActivitySchema = z.object({
  userId: z.string().uuid('Invalid UUID format for userId'),
  email: z.string().email('Invalid email format'),
  connectedAt: z.date(),
  lastActivity: z.date(),
  socketId: z.string().min(1, 'Socket ID is required'),
});

const SuspiciousActivitySchema = z.object({
  id: z.string().uuid('Invalid UUID format for id'),
  userId: z.string().uuid('Invalid UUID format for userId').optional(),
  email: z.string().email('Invalid email format').optional(),
  activityType: z.enum([
    'FAILED_LOGIN',
    'MULTIPLE_LOGIN_ATTEMPTS',
    'DISABLED_USER_ACCESS',
    'SUSPENDED_USER_ACCESS',
    'UNAUTHORIZED_ACCESS_ATTEMPT',
    'SUSPICIOUS_IP_CHANGE',
    'RAPID_REQUEST_PATTERN',
    'SESSION_HIJACK_ATTEMPT',
  ]),
  details: z.record(z.any()).default({}),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  resolved: z.boolean().default(false),
  resolvedBy: z.string().uuid().optional(),
  resolvedAt: z.date().optional(),
});

const AdminNotificationSchema = z.object({
  type: z.enum(['USER_JOINED', 'USER_LEFT', 'SUSPICIOUS_ACTIVITY', 'SYSTEM_ALERT']),
  data: z.union([UserActivitySchema, SuspiciousActivitySchema, z.record(z.any())]),
  timestamp: z.date(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  message: z.string().optional(),
});

const GetActiveUsersDto = z.object({
  includeInactive: z.boolean().default(false),
});

const GetSuspiciousActivitiesDto = z.object({
  limit: z.number().int().min(1).max(500).default(50),
  userId: z.string().uuid().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  activityType: z.enum([
    'FAILED_LOGIN',
    'MULTIPLE_LOGIN_ATTEMPTS',
    'DISABLED_USER_ACCESS',
    'SUSPENDED_USER_ACCESS',
    'UNAUTHORIZED_ACCESS_ATTEMPT',
    'SUSPICIOUS_IP_CHANGE',
    'RAPID_REQUEST_PATTERN',
    'SESSION_HIJACK_ATTEMPT',
  ]).optional(),
  resolved: z.boolean().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
});

const CreateSuspiciousActivityDto = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  activityType: z.enum([
    'FAILED_LOGIN',
    'MULTIPLE_LOGIN_ATTEMPTS',
    'DISABLED_USER_ACCESS',
    'SUSPENDED_USER_ACCESS',
    'UNAUTHORIZED_ACCESS_ATTEMPT',
    'SUSPICIOUS_IP_CHANGE',
    'RAPID_REQUEST_PATTERN',
    'SESSION_HIJACK_ATTEMPT',
  ]),
  details: z.record(z.any()).default({}),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

const CleanupInactiveUsersDto = z.object({
  thresholdMinutes: z.number().int().min(5).max(1440).default(30), 
});

const GetUserActivityDto = z.object({
  userId: z.string().uuid('Invalid UUID format for userId'),
});

const ResolveSuspiciousActivityDto = z.object({
  activityId: z.string().uuid('Invalid UUID format for activityId'),
  resolvedBy: z.string().uuid('Invalid UUID format for resolvedBy'),
  resolution: z.string().min(1, 'Resolution description is required'),
});

class UserActivitySchemaDto extends createZodDto(UserActivitySchema) {}
class SuspiciousActivitySchemaDto extends createZodDto(SuspiciousActivitySchema) {}
class AdminNotificationSchemaDto extends createZodDto(AdminNotificationSchema) {}
class GetActiveUsersSchemaDto extends createZodDto(GetActiveUsersDto) {}
class GetSuspiciousActivitiesSchemaDto extends createZodDto(GetSuspiciousActivitiesDto) {}
class CreateSuspiciousActivitySchemaDto extends createZodDto(CreateSuspiciousActivityDto) {}
class CleanupInactiveUsersSchemaDto extends createZodDto(CleanupInactiveUsersDto) {}
class GetUserActivitySchemaDto extends createZodDto(GetUserActivityDto) {}
class ResolveSuspiciousActivitySchemaDto extends createZodDto(ResolveSuspiciousActivityDto) {}

type UserActivitySchemaType = z.infer<typeof UserActivitySchema>;
type SuspiciousActivitySchemaType = z.infer<typeof SuspiciousActivitySchema>;
type AdminNotificationSchemaType = z.infer<typeof AdminNotificationSchema>;
type GetActiveUsersType = z.infer<typeof GetActiveUsersDto>;
type GetSuspiciousActivitiesType = z.infer<typeof GetSuspiciousActivitiesDto>;
type CreateSuspiciousActivityType = z.infer<typeof CreateSuspiciousActivityDto>;
type CleanupInactiveUsersType = z.infer<typeof CleanupInactiveUsersDto>;
type GetUserActivityType = z.infer<typeof GetUserActivityDto>;
type ResolveSuspiciousActivityType = z.infer<typeof ResolveSuspiciousActivityDto>;

export {
  UserActivitySchema,
  SuspiciousActivitySchema,
  AdminNotificationSchema,
  GetActiveUsersDto,
  GetSuspiciousActivitiesDto,
  CreateSuspiciousActivityDto,
  CleanupInactiveUsersDto,
  GetUserActivityDto,
  ResolveSuspiciousActivityDto,
  UserActivitySchemaDto,
  SuspiciousActivitySchemaDto,
  AdminNotificationSchemaDto,
  GetActiveUsersSchemaDto,
  GetSuspiciousActivitiesSchemaDto,
  CreateSuspiciousActivitySchemaDto,
  CleanupInactiveUsersSchemaDto,
  GetUserActivitySchemaDto,
  ResolveSuspiciousActivitySchemaDto,
  type UserActivitySchemaType,
  type SuspiciousActivitySchemaType,
  type AdminNotificationSchemaType,
  type GetActiveUsersType,
  type GetSuspiciousActivitiesType,
  type CreateSuspiciousActivityType,
  type CleanupInactiveUsersType,
  type GetUserActivityType,
  type ResolveSuspiciousActivityType,
};