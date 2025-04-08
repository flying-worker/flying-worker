import { sql } from "drizzle-orm";
import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import User from "./User";

const RolePermission = sqliteTable("role_permissions", {
	id: int().primaryKey({ autoIncrement: true }),

	user_id: integer()
		.notNull()
		.references(() => User.id),
	role: text().notNull(),
	permissions: text(),

	created_at: text().default(sql`CURRENT_TIMESTAMP`),
	updated_at: text(),
});

export default RolePermission;
