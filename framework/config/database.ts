import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import { getEnv } from "flying-worker/core";
import { DatabaseConfig } from "flying-worker/type-declaration";
import * as schema from "../app/models";

export const databaseConfig: DatabaseConfig = {
	default: "d1",

	connections: {
		d1: {
			connection: () => drizzle(getEnv("DB") as D1Database, { schema }),
		},
	},
};
