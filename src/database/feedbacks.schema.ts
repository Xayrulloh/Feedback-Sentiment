import { _baseSchema } from "./base-schema";
import { pgTable } from "drizzle-orm/pg-core";
import { text } from "drizzle-orm/pg-core";
import {integer} from "drizzle-orm/pg-core";
import { users } from "./users.schema";
import { uuid } from "drizzle-orm/pg-core";

export const feedbacks = pgTable('feedback', {
    ..._baseSchema,
    userId: uuid('user_id').notNull().references(() => users.id),
    content: text('content').notNull(),
    sentiment: text('sentiment').$type<'positive' | 'neutral' | 'negative' | 'unknown'>().notNull(),
    confidence: integer('confidence').notNull(),
});