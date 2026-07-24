/**
 * Ambient types for the virtual modules provided by the flying-worker Vite
 * plugin (`flying-worker/vite`). Resolved at build time by the plugin, not by
 * node resolution.
 */
declare module "virtual:flying-worker/manifest" {
	const manifest: Record<
		string,
		{ file: string; css?: string[]; imports?: string[] }
	>;
	export default manifest;
}
