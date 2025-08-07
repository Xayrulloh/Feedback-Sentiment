// src/database/schema.ts
import { feedbacks } from './feedbacks.schema';
import { users } from './users.schema';

export * from './users.schema';
export * from './feedbacks.schema';

export const userSchema = {
  users,
};

export const feedbackSchema = {
  feedbacks,
};

export const schema = {
  ...userSchema,
  ...feedbackSchema,
};

export type UserSchema = typeof userSchema;
export type FeedbackSchema = typeof feedbackSchema;
export type Schema = typeof schema;
