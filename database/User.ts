import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

const User = sqliteTable("users", {
	id: int().primaryKey({ autoIncrement: true }),

	name: text().notNull(),
	email: text().notNull().unique(),
	password: text(),
	provider_name: text(),
	provider_id: text(),
	avatar: text(),
	remember_token: text(),

	created_at: text().default(sql`CURRENT_TIMESTAMP`),
	updated_at: text(),
});

export default User;
