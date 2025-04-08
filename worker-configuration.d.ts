import { Ai, D1Database, KVNamespace } from "@cloudflare/workers-types";

interface Env {
	kv: KVNamespace;
	APP_NAME: "Flying Worker";
	APP_URL: "http://localhost";
	APP_SECRET: "12086fb500fc4bafae7d660773b554c6";
	SESSION_DRIVER: "kv";
	APP_MAINTENANCE_MODE: true;
	QUEUE_MODE: true;
	D1_BINDING_NAME: "DB";
	D1_DB_NAME: "flying-worker";
	KV_BINDING_NAME: "kv";
	DB: D1Database;
	AI: Ai;
}
