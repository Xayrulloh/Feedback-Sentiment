import { relations } from 'drizzle-orm';
import { integer } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { UserRoleEnum } from 'src/utils/zod.schemas';
import { FeedbackSentimentEnum } from 'src/utils/zod.schemas';

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

export const userSchema = pgTable('users', {
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: DrizzleUserRoleEnum('role').notNull(),
  ...baseSchema,
});

export const fileSchema = pgTable('files', {
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  ...baseSchema,
});

export const feedbackSchema = pgTable('feedbacks', {
  userId: uuid('user_id').notNull(),
  fileId: uuid('file_id'), 
  content: text('content').notNull(),
  sentiment: DrizzleFeedbackSentimentEnum('sentiment').notNull(),
  confidence: integer('confidence').notNull(),
  summary: text('summary').notNull(),
  ...baseSchema,
});

// relations
export const usersRelations = relations(userSchema, ({ many }) => ({
  feedbackSchema: many(feedbackSchema, { relationName: 'feedbacks_user_id_users_id_fk' }),
  fileSchema: many(fileSchema, { relationName: 'files_user_id_users_id_fk' }),
}));

export const filesRelations = relations(fileSchema, ({ many, one }) => ({
  feedbackSchema: many(feedbackSchema, {
    relationName: 'feedbacks_file_id_files_id_fk',
  }),
  user: one(userSchema, {
    fields: [fileSchema.userId],
    references: [userSchema.id],
    relationName: 'files_user_id_users_id_fk',
  }),
}));

export const feedbacksRelations = relations(feedbackSchema, ({ one }) => ({
  fileSchema: one(fileSchema, {
    fields: [feedbackSchema.fileId],
    references: [fileSchema.id],
    relationName: 'feedbacks_file_id_files_id_fk',
  }),
  user: one(userSchema, {
    fields: [feedbackSchema.userId],
    references: [userSchema.id],
    relationName: 'feedbacks_user_id_users_id_fk',
  }),
}));
