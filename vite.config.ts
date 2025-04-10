import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./"),
			"@react": path.resolve(__dirname, "./resources/react"),
		},
	},
	ssr: {
		resolve: {
			externalConditions: ["workerd", "worker", "browser"],
		},
	},
	plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
