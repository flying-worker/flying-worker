import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./migrations",
	schema: "./database",
	dialect: "sqlite",
	driver: "d1-http",
});
