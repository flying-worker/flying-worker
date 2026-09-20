import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Supplied by the Vite plugin at build time; stubbed so the Inertia
      // module can be imported under test.
      'virtual:flying-worker/manifest': fileURLToPath(
        new URL('./src/inertia/__tests__/manifest-stub.ts', import.meta.url),
      ),
    },
  },
})
