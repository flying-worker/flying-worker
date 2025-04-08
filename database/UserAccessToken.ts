import { sql } from "drizzle-orm";
import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import User from "./User";

/**
 * this table will be used only for api authentication
 */
const UserAccessToken = sqliteTable("user_access_token", {
	id: int().primaryKey({ autoIncrement: true }),

	user_id: integer()
		.notNull()
		.references(() => User.id),
	name: text(),
	token: text().notNull(),

	permissions: text(),

	last_used_at: text(),
	expires_at: text(),

	created_at: text().default(sql`CURRENT_TIMESTAMP`),
	updated_at: text(),
});

export default UserAccessToken;
