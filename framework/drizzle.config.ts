import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config.
 *
 * - `db:generate` reads the schema below and emits SQL migrations into ./migrations.
 * - Migrations are applied to Cloudflare D1 via wrangler (see package.json scripts),
 *   not by drizzle-kit, so no D1 credentials are needed for the generate step.
 * - `db:studio` (optional) needs Cloudflare account credentials; set
 *   CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_DATABASE_ID / CLOUDFLARE_D1_TOKEN to use it.
 */
export default defineConfig({
	schema: "./app/models/index.ts",
	out: "./migrations",
	dialect: "sqlite",
	driver: "d1-http",
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
		databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? "",
		token: process.env.CLOUDFLARE_D1_TOKEN ?? "",
	},
});
