import { text } from "drizzle-orm/pg-core";
import { _baseSchema } from "./base-schema";
import { pgTable } from "drizzle-orm/pg-core";


export const users = pgTable  ('users', {
    ..._baseSchema,
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<'user' | 'admin'>().notNull(),
});