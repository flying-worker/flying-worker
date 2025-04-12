import type { Config } from "@react-router/dev/config";

export default {
	appDirectory: "./resources/react",
	ssr: true, // Server-side render by default, to enable SPA mode set this to `false`
	future: {
		unstable_viteEnvironmentApi: true,
	},
} satisfies Config;
