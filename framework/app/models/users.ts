import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Users table.
 *
 * Column shape mirrors `src/type-declaration/model.ts` `User`, so the framework's
 * auth layer can rely on these fields being present.
 */
export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	password: text("password"),
	provider: text("provider"),
	provider_id: text("provider_id"),
	avatar: text("avatar"),
	remember_token: text("remember_token"),
	created_at: text("created_at")
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updated_at: text("updated_at"),
});

export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
