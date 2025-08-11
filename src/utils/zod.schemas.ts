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
    summary: z.string(),
    userId: z.string().uuid().describe('User ID'),
    folderId: z.string().uuid().nullable().describe('Folder ID'),
  })
  .merge(BaseSchema);

type FeedbackSchemaType = z.infer<typeof FeedbackSchema>;

export {
  UserSchema,
  type UserSchemaType,
  UserRoleEnum,
  BaseSchema,
  type BaseSchemaType,
  FeedbackSchema,
  type FeedbackSchemaType,
  FeedbackSentimentEnum,
};
