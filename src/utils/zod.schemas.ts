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

const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema?: T) =>
  z.object({
    success: z.boolean(),
    statusCode: z.number(),
    message: z.string(),
    data: dataSchema ? dataSchema.optional() : z.any().optional(),
    timestamp: z.string(),
  });

type ApiSuccessResponseSchemaType<T = z.ZodTypeAny> = z.infer<
  ReturnType<typeof ApiSuccessResponseSchema<z.ZodType<T>>>
>;

const ApiErrorResponseSchema = z.object({
  success: z.boolean().default(false),
  statusCode: z.number(),
  message: z.string(),
  errors: z
    .array(
      z.object({
        field: z.string().optional(),
        message: z.string(),
        code: z.string().optional(),
      }),
    )
    .optional(),
  timestamp: z.string(),
});

type ApiErrorResponseSchemaType = z.infer<typeof ApiErrorResponseSchema>;

function createSuccessApiResponseDto(schema: z.ZodTypeAny, name: string) {
  const responseSchema = ApiSuccessResponseSchema(schema);
  const className = `ApiResponse${name}Dto`;

  const namedClass = {
    [className]: class extends createZodDto(responseSchema) {},
  };

  return namedClass[className];
}

export {
  UserSchema,
  type UserSchemaType,
  UserRoleEnum,
  BaseSchema,
  PaginationSchema,
  type BaseSchemaType,
  FeedbackSchema,
  type FeedbackSchemaType,
  FeedbackSentimentEnum,
  ApiSuccessResponseSchema,
  type ApiSuccessResponseSchemaType,
  createSuccessApiResponseDto,
  ApiErrorResponseSchema,
  type ApiErrorResponseSchemaType,
};
