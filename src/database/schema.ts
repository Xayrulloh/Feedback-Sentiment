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

export const users = pgTable('users', {
  // TODO: need to put Schema after the name
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: DrizzleUserRoleEnum('role').notNull(),
  ...baseSchema,
});

export const folders = pgTable('folders', {
  // TODO: need to put Schema after the name and change the name to file
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  ...baseSchema,
});

export const feedbacks = pgTable('feedbacks', {
  // TODO: need to put Schema after the name
  userId: uuid('user_id').notNull(),
  folderId: uuid('folder_id'),
  content: text('content').notNull(),
  sentiment: DrizzleFeedbackSentimentEnum('sentiment').notNull(),
  confidence: integer('confidence').notNull(),
  summary: text('summary').notNull(),
  ...baseSchema,
});

// relations
export const usersRelations = relations(users, ({ many }) => ({
  feedbacks: many(feedbacks, { relationName: 'feedbacks_user_id_users_id_fk' }),
  folders: many(folders, { relationName: 'folders_user_id_users_id_fk' }),
}));

export const foldersRelations = relations(folders, ({ many, one }) => ({
  feedbacks: many(feedbacks, {
    relationName: 'feedbacks_folder_id_folders_id_fk',
  }),
  user: one(users, {
    fields: [folders.userId],
    references: [users.id],
    relationName: 'folders_user_id_users_id_fk',
  }),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  folder: one(folders, {
    fields: [feedbacks.folderId],
    references: [folders.id],
    relationName: 'feedbacks_folder_id_folders_id_fk',
  }),
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.id],
    relationName: 'feedbacks_user_id_users_id_fk',
  }),
}));
