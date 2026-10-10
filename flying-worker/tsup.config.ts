import { defineConfig } from "tsup";

/**
 * Build config for publishing `flying-worker` to npm.
 *
 * During development the example app consumes `./src/*` directly (see the
 * `exports` map), so this build only runs for publish. Virtual modules
 * (provided by the app's Vite plugin) and peer deps are left external.
 */
export default defineConfig({
	entry: [
		"src/index.ts",
		"src/core/index.ts",
		"src/route/index.ts",
		"src/auth/index.ts",
		"src/database/index.ts",
		"src/inertia/index.ts",
		"src/inertia/vite-plugin.ts",
		"src/session/index.ts",
		"src/middlewares/index.ts",
		"src/cookie/index.ts",
		"src/storage/index.ts",
		"src/supports/index.ts",
		"src/renderer.tsx",
		"src/type-declaration/index.ts",
		"src/type-declaration/storage.ts",
		"src/zod-schema/index.ts",
		"src/validation/index.ts",
	],
	format: ["esm"],
	dts: true,
	clean: true,
	target: "esnext",
	outDir: "dist",
	external: [
		/^virtual:/,
		"hono",
		"react",
		"react-dom",
		"@inertiajs/react",
		"drizzle-orm",
		"@cloudflare/workers-types",
	],
});
