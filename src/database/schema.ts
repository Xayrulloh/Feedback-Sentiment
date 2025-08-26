import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  FeedbackSentimentEnum,
  RateLimitTargetEnum,
  UserRoleEnum,
} from 'src/utils/zod.schemas';

// enums
export const DrizzleUserRoleEnum = pgEnum('user_role', [
  UserRoleEnum.USER,
  UserRoleEnum.ADMIN,
]);

export const DrizzleFeedbackSentimentEnum = pgEnum('sentiment', [
  FeedbackSentimentEnum.NEGATIVE,
  FeedbackSentimentEnum.NEUTRAL,
  FeedbackSentimentEnum.POSITIVE,
  FeedbackSentimentEnum.UNKNOWN,
]);

export const DrizzleRateLimitTargetEnum = pgEnum('rate_limit_target', [
  RateLimitTargetEnum.API,
  RateLimitTargetEnum.UPLOAD,
  RateLimitTargetEnum.DOWNLOAD,
  RateLimitTargetEnum.LOGIN,
]);

// schemas
const baseSchema = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
};

export const usersSchema = pgTable('users', {
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: DrizzleUserRoleEnum('role').notNull(),
  isDisabled: boolean('is_disabled').notNull().default(false),
  ...baseSchema,
});

export const filesSchema = pgTable('files', {
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  mimeType: varchar('mime_type', { length: 255 }).notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  rowCount: integer('row_count'),
  extension: varchar('extension', { length: 50 }).notNull(),
  ...baseSchema,
});

export const feedbacksSchema = pgTable('feedbacks', {
  userId: uuid('user_id').notNull(),
  fileId: uuid('file_id').references(() => filesSchema.id, {
    onDelete: 'cascade',
  }),
  content: text('content').notNull(),
  sentiment: DrizzleFeedbackSentimentEnum('sentiment').notNull(),
  confidence: integer('confidence').notNull(),
  summary: text('summary').notNull(),
  ...baseSchema,
});

export const rateLimitsSchema = pgTable('rate_limits', {
  target: DrizzleRateLimitTargetEnum('target').unique().notNull(),
  limit: integer('limit').notNull(),
  ...baseSchema,
});

// relations
export const usersRelations = relations(usersSchema, ({ many }) => ({
  feedbacks: many(feedbacksSchema, {
    relationName: 'feedbacks_user_id_users_id_fk',
  }),
  files: many(filesSchema, { relationName: 'files_user_id_users_id_fk' }),
}));

export const filesRelations = relations(filesSchema, ({ many, one }) => ({
  feedbacks: many(feedbacksSchema, {
    relationName: 'feedbacks_file_id_files_id_fk',
  }),
  user: one(usersSchema, {
    fields: [filesSchema.userId],
    references: [usersSchema.id],
    relationName: 'files_user_id_users_id_fk',
  }),
}));

export const feedbacksRelations = relations(feedbacksSchema, ({ one }) => ({
  file: one(filesSchema, {
    fields: [feedbacksSchema.fileId],
    references: [filesSchema.id],
    relationName: 'feedbacks_file_id_files_id_fk',
  }),
  user: one(usersSchema, {
    fields: [feedbacksSchema.userId],
    references: [usersSchema.id],
    relationName: 'feedbacks_user_id_users_id_fk',
  }),
}));
