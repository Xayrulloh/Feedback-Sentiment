import * as z from 'zod';

// base
const BaseSchema = z.object({
  id: z.string().uuid().describe('Primary key'),
  createdAt: z.coerce.date().describe('When it was created'),
  updatedAt: z.coerce.date().describe('When it was last updated'),
  deletedAt: z.coerce
    .date()
    .nullable()
    .describe(
      'When it was soft deleted, but most of the time it is hard deleted',
    ),
});

type BaseSchemaType = z.infer<typeof BaseSchema>;

// user
const enum UserRoleEnum {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

const UserSchema = z
  .object({
    email: z.string().email().describe('User email account'),
    role: z
      .enum([UserRoleEnum.USER, UserRoleEnum.ADMIN])
      .describe("Role might be either 'USER' or 'ADMIN'"),
    isSuspended: z
      .boolean()
      .default(false)
      .describe('Whether the user is suspended (cannot perform actions)'),
  })
  .merge(BaseSchema);

type UserSchemaType = z.infer<typeof UserSchema>;

// feedback
const enum FeedbackSentimentEnum {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  UNKNOWN = 'unknown',
}

const FeedbackSchema = z
  .object({
    content: z.string().min(3).describe('Feedback content'),
    sentiment: z
      .enum([
        FeedbackSentimentEnum.POSITIVE,
        FeedbackSentimentEnum.NEUTRAL,
        FeedbackSentimentEnum.NEGATIVE,
        FeedbackSentimentEnum.UNKNOWN,
      ])
      .describe('Sentiment of the feedback'),
    confidence: z
      .number()
      .min(0)
      .max(100)
      .describe('Confidence of the sentiment'),
    summary: z.string().describe('Summary of the feedback'),
    userId: z.string().uuid().describe('User ID'),
    fileId: z.string().uuid().nullable().describe('File ID'),
  })
  .merge(BaseSchema);

type FeedbackSchemaType = z.infer<typeof FeedbackSchema>;

// workspace
const WorkspaceSchema = z
  .object({
    name: z.string().min(1).max(255).describe('Workspace name'),
    userId: z.string().uuid().describe('User who owns the workspace'),
  })
  .merge(BaseSchema)
  .describe('Workspace schema');

type WorkspaceSchemaType = z.infer<typeof WorkspaceSchema>;

// file
const FileSchema = z
  .object({
    id: z.string().uuid().describe('File ID'),
    userId: z.string().uuid().describe('User who owns the files'),
    name: z.string().min(1).describe('Original file name'),
    mimeType: z
      .string()
      .min(1)
      .describe('MIME type of the file, e.g. text/csv'),
    size: z.number().positive().describe('File size in bytes'),
    rowCount: z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .optional()
      .describe('Number of rows within the file'),
    extension: z.string().min(1).describe('File extension, e.g. csv'),
  })
  .merge(BaseSchema);

type FileSchemaType = z.infer<typeof FileSchema>;

// interceptors and filters
const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema?: T) =>
  z.object({
    success: z.boolean(),
    statusCode: z.number(),
    message: z.string(),
    data: dataSchema ? dataSchema.optional() : z.any().optional(),
    timestamp: z.string(),
  });

type SuccessResponseSchemaType<T = z.ZodTypeAny> = z.infer<
  ReturnType<typeof SuccessResponseSchema<z.ZodType<T>>>
>;

const ErrorDetailsSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

type ErrorDetailsSchemaType = z.infer<typeof ErrorDetailsSchema>;

const BaseErrorResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    statusCode: z.number(),
    message: z.string(),
    data: dataSchema.nullable(),
    errors: z.array(ErrorDetailsSchema).nullable().optional(),
    timestamp: z.string(),
    path: z.string(),
  });

type BaseErrorResponseSchemaType = z.infer<
  ReturnType<typeof BaseErrorResponseSchema<z.ZodTypeAny>>
>;

const DatabaseErrorSchema = z.object({
  code: z.string().optional(),
  constraint: z.string().optional(),
  detail: z.string().optional(),
  table: z.string().optional(),
  column: z.string().optional(),
});

type DatabaseErrorSchemaType = z.infer<typeof DatabaseErrorSchema>;

// Rate Limit
const enum RateLimitTargetEnum {
  API = 'API',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  LOGIN = 'LOGIN',
}

const RateLimitSchema = z.object({
  target: z.enum([
    RateLimitTargetEnum.API,
    RateLimitTargetEnum.UPLOAD,
    RateLimitTargetEnum.DOWNLOAD,
    RateLimitTargetEnum.LOGIN,
  ]),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .describe('Maximum number of requests allowed per hour'),
});

type RateLimitSchemaType = z.infer<typeof RateLimitSchema>;

// Rate Limit Event

const enum RateLimitErrorEnum {
  TOO_MANY_LOGIN = 'TOO_MANY_LOGIN',
  TOO_MANY_UPLOAD = 'TOO_MANY_UPLOAD',
  TOO_MANY_DOWNLOAD = 'TOO_MANY_DOWNLOAD',
  TOO_MANY_API = 'TOO_MANY_API',
}

const RateLimitEventSchema = z.object({
  userId: z.string().uuid().optional(),
  ip: z.string().ip().optional(),
  email: z.string().email().optional(),
  action: z.enum([
    RateLimitTargetEnum.API,
    RateLimitTargetEnum.UPLOAD,
    RateLimitTargetEnum.DOWNLOAD,
    RateLimitTargetEnum.LOGIN,
  ]),
  error: z.enum([
    RateLimitErrorEnum.TOO_MANY_LOGIN,
    RateLimitErrorEnum.TOO_MANY_UPLOAD,
    RateLimitErrorEnum.TOO_MANY_DOWNLOAD,
    RateLimitErrorEnum.TOO_MANY_API,
  ]),
  details: z.string().optional(),
  timestamp: z.date(),
});

type RateLimitEventSchemaType = z.infer<typeof RateLimitEventSchema>;

// Pagination response and query schemas

const PaginationResponseSchema = z
  .object({
    limit: z.number().int().min(1).max(100),
    page: z.number().int().min(1),
    total: z.number().int().min(0),
    pages: z.number().int().min(0),
  })
  .describe('Pagination response schema');

const PaginationQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
  })
  .describe('Pagination query schema');

export {
  PaginationQuerySchema,
  type FileSchemaType,
  FileSchema,
  UserSchema,
  type UserSchemaType,
  UserRoleEnum,
  BaseSchema,
  PaginationResponseSchema,
  type BaseSchemaType,
  FeedbackSchema,
  type FeedbackSchemaType,
  FeedbackSentimentEnum,
  SuccessResponseSchema,
  type SuccessResponseSchemaType,
  ErrorDetailsSchema,
  BaseErrorResponseSchema,
  type BaseErrorResponseSchemaType,
  DatabaseErrorSchema,
  type DatabaseErrorSchemaType,
  type ErrorDetailsSchemaType,
  RateLimitSchema,
  RateLimitTargetEnum,
  type RateLimitSchemaType,
  RateLimitEventSchema,
  RateLimitErrorEnum,
  type RateLimitEventSchemaType,
  WorkspaceSchema,
  type WorkspaceSchemaType,
};
