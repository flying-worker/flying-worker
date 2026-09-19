/**
 * Stand-in for `virtual:flying-worker/manifest`, which is produced by the Vite
 * plugin at build time and so does not exist under vitest. Aliased in
 * vitest.config.ts.
 */
export default {} as Record<string, { file: string; css?: string[]; imports?: string[] }>
