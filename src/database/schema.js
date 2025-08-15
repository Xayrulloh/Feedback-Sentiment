"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbacks = exports.folders = exports.users = exports.DrizzleFeedbackSentimentEnum = exports.DrizzleUserRoleEnum = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var pg_core_2 = require("drizzle-orm/pg-core");
var pg_core_3 = require("drizzle-orm/pg-core");
var zod_schemas_1 = require("src/utils/zod.schemas");
var zod_schemas_2 = require("src/utils/zod.schemas");
// enums
exports.DrizzleUserRoleEnum = (0, pg_core_2.pgEnum)('user_role', [
    zod_schemas_1.UserRoleEnum.USER,
    zod_schemas_1.UserRoleEnum.ADMIN,
]);
exports.DrizzleFeedbackSentimentEnum = (0, pg_core_2.pgEnum)('sentiment', [
    zod_schemas_2.FeedbackSentimentEnum.NEGATIVE,
    zod_schemas_2.FeedbackSentimentEnum.NEUTRAL,
    zod_schemas_2.FeedbackSentimentEnum.POSITIVE,
    zod_schemas_2.FeedbackSentimentEnum.UNKNOWN
]);
var baseSchema = {
    id: (0, pg_core_3.uuid)('id').primaryKey().defaultRandom(),
    createdAt: (0, pg_core_3.timestamp)('created_at', { mode: 'date', withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_3.timestamp)('updated_at', { mode: 'date', withTimezone: true })
        .defaultNow()
        .notNull(),
    deletedAt: (0, pg_core_3.timestamp)('deleted_at', { mode: 'date', withTimezone: true }),
};
exports.users = (0, pg_core_3.pgTable)('users', __assign({ email: (0, pg_core_3.text)('email').notNull().unique(), passwordHash: (0, pg_core_3.text)('password_hash').notNull(), role: (0, exports.DrizzleUserRoleEnum)('role').notNull() }, baseSchema));
exports.folders = (0, pg_core_3.pgTable)('folders', __assign({ userId: (0, pg_core_3.uuid)('user_id').notNull().references(function () { return exports.users.id; }, { onDelete: 'cascade' }), name: (0, pg_core_3.text)('name').notNull() }, baseSchema));
exports.feedbacks = (0, pg_core_3.pgTable)('feedbacks', __assign({ userId: (0, pg_core_3.uuid)('user_id')
        .notNull()
        .references(function () { return exports.users.id; }, { onDelete: 'cascade' }), folderId: (0, pg_core_3.uuid)('folder_id').references(function () { return exports.folders.id; }, { onDelete: 'cascade' }), content: (0, pg_core_3.text)('content').notNull(), sentiment: (0, exports.DrizzleFeedbackSentimentEnum)('sentiment'), confidence: (0, pg_core_1.integer)('confidence'), summary: (0, pg_core_3.text)('summary') }, baseSchema));
