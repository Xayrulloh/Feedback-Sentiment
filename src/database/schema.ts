import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
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
  RateLimitErrorEnum,
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

export const DrizzleRateLimitErrorEnum = pgEnum('rate_limit_error', [
  RateLimitErrorEnum.TOO_MANY_LOGIN,
  RateLimitErrorEnum.TOO_MANY_UPLOAD,
  RateLimitErrorEnum.TOO_MANY_DOWNLOAD,
  RateLimitErrorEnum.TOO_MANY_API,
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
  isSuspended: boolean('is_suspended').notNull().default(false),
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
}, (table) => [
  index('idx_files_user_id').on(table.userId),
]);

export const feedbacksSchema = pgTable('feedbacks', {
  contentHash: varchar('content_hash', { length: 64 }).notNull().unique(),
  content: text('content').notNull(),
  sentiment: DrizzleFeedbackSentimentEnum('sentiment').notNull(),
  confidence: integer('confidence').notNull(),
  summary: text('summary').notNull(),
  ...baseSchema,
},  (table) => [
    index('idx_feedbacks_sentiment').on(table.sentiment),
  ],);

export const usersFeedbacksSchema = pgTable(
  'users_feedbacks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    feedbackId: uuid('feedback_id').notNull(),
    fileId: uuid('file_id').references(() => filesSchema.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_users_feedbacks_user_id').on(table.userId),
    index('idx_users_feedbacks_feedback_id').on(table.feedbackId),
    index('idx_users_feedbacks_file_id').on(table.fileId),
  ],
);

export const rateLimitsSchema = pgTable('rate_limits', {
  target: DrizzleRateLimitTargetEnum('target').unique().notNull(),
  limit: integer('limit').notNull(),
  ...baseSchema,
});

export const suspiciousActivitySchema = pgTable('suspicious_activity', {
  userId: uuid('user_id').references(() => usersSchema.id, {
    onDelete: 'set null',
  }),
  email: varchar('email', { length: 255 }),
  ip: varchar('ip', { length: 45 }),
  action: DrizzleRateLimitTargetEnum('action').notNull(),
  error: DrizzleRateLimitErrorEnum('error').notNull(),
  details: text('details'),
  ...baseSchema,
},  (table) => [
    index('idx_suspicious_activity_user_id').on(table.userId),
    index('idx_suspicious_activity_email').on(table.email),
  ],);

// relations
export const usersRelations = relations(usersSchema, ({ many }) => ({
  usersFeedbacks: many(usersFeedbacksSchema, {
    relationName: 'users_feedbacks_user_id_users_id_fk',
  }),
  files: many(filesSchema, { relationName: 'files_user_id_users_id_fk' }),
}));

export const filesRelations = relations(filesSchema, ({ many, one }) => ({
  usersFeedbacks: many(usersFeedbacksSchema, {
    relationName: 'users_feedbacks_file_id_files_id_fk',
  }),
  user: one(usersSchema, {
    fields: [filesSchema.userId],
    references: [usersSchema.id],
    relationName: 'files_user_id_users_id_fk',
  }),
}));

export const usersFeedbacksRelations = relations(
  usersFeedbacksSchema,
  ({ one }) => ({
    user: one(usersSchema, {
      fields: [usersFeedbacksSchema.userId],
      references: [usersSchema.id],
      relationName: 'users_feedbacks_user_id_users_id_fk',
    }),
    feedback: one(feedbacksSchema, {
      fields: [usersFeedbacksSchema.feedbackId],
      references: [feedbacksSchema.id],
      relationName: 'users_feedbacks_feedback_id_feedbacks_id_fk',
    }),
    file: one(filesSchema, {
      fields: [usersFeedbacksSchema.fileId],
      references: [filesSchema.id],
      relationName: 'users_feedbacks_file_id_files_id_fk',
    }),
  }),
);
