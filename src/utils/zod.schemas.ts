import { createZodDto } from 'nestjs-zod';
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
    isDisabled: z
      .boolean()
      .default(false)
      .describe('Whether the user is disabled (cannot perform actions)'),
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

const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100),
  page: z.number().int().min(1),
  total: z.number().int().min(0),
  pages: z.number().int().min(0),
});

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

const BaseSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema?: T) =>
  z.object({
    success: z.boolean(),
    statusCode: z.number(),
    message: z.string(),
    data: dataSchema ? dataSchema.optional() : z.any().optional(),
    timestamp: z.string(),
  });

type BaseSuccessResponseSchemaType<T = z.ZodTypeAny> = z.infer<
  ReturnType<typeof BaseSuccessResponseSchema<z.ZodType<T>>>
>;

function createBaseResponseDto(schema: z.ZodTypeAny, name: string) {
  const responseSchema = BaseSuccessResponseSchema(schema);
  const className = `${name}Dto`;

  const namedClass = {
    [className]: class extends createZodDto(responseSchema) {},
  };

  return namedClass[className];
}

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

const HttpMethodEnum = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
type HttpMethodType = z.infer<typeof HttpMethodEnum>;

const RateLimitRuleSchema = z.object({
  endpoint: z
    .string()
    .min(1)
    .describe('API endpoint, e.g., /api/feedback/upload or /api/feedback/*'),
  method: HttpMethodEnum.describe('HTTP method, default = ALL'),
  limit: z.number().int().min(1).describe('Max requests allowed per window'),
  windowSeconds: z.number().int().min(1).describe('Window duration in seconds'),
});

type RateLimitRuleType = z.infer<typeof RateLimitRuleSchema>;

const deleteRateLimitQuerySchema = z.object({
  endpoint: z.string().min(1),
  method: HttpMethodEnum,
});

type deleteRateLimitSchemaType = z.infer<typeof deleteRateLimitQuerySchema>;

const StoredRuleSchema = z.object({
  endpoint: z.string(),
  method: z.string(),
  limit: z.string(),
  windowSeconds: z.string(),
});

type StoredRuleType = z.infer<typeof StoredRuleSchema>;

export {
  StoredRuleSchema,
  type StoredRuleType,
  HttpMethodEnum,
  type HttpMethodType,
  deleteRateLimitQuerySchema,
  type deleteRateLimitSchemaType,
  type FileSchemaType,
  RateLimitRuleSchema,
  type RateLimitRuleType,
  FileSchema,
  UserSchema,
  type UserSchemaType,
  UserRoleEnum,
  BaseSchema,
  PaginationSchema,
  type BaseSchemaType,
  FeedbackSchema,
  type FeedbackSchemaType,
  FeedbackSentimentEnum,
  BaseSuccessResponseSchema,
  type BaseSuccessResponseSchemaType,
  createBaseResponseDto,
  ErrorDetailsSchema,
  BaseErrorResponseSchema,
  type BaseErrorResponseSchemaType,
  DatabaseErrorSchema,
  type DatabaseErrorSchemaType,
  type ErrorDetailsSchemaType,
};
