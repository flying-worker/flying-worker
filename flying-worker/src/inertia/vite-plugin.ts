import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, UserConfig } from 'vite'

interface FlyingWorkerOptions {
  appPath: string
  outDir?: string
  assetsDir?: string
}

const VIRTUAL_MANIFEST = 'virtual:flying-worker/manifest'
const RESOLVED = '\0' + VIRTUAL_MANIFEST

export default function flyingWorker(options: FlyingWorkerOptions): Plugin {
  const { appPath, outDir = 'dist', assetsDir = 'assets' } = options
  const appEntry = path.join(appPath, 'app.jsx')
  const pagesPath = path.join(appPath, 'Pages')

  return {
    name: 'flying-worker',

    config: (): UserConfig => ({
      build: {
        outDir,
        assetsDir,
        manifest: true,
        rollupOptions: {
          input: appEntry,
          output: {
            assetFileNames: `${assetsDir}/[name]-[hash][extname]`,
            manualChunks(id: string) {
              if (id.includes(`/${pagesPath}/`)) {
                const segments = id.split('/')
                const fileName = segments[segments.length - 1]
                const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
                return `Pages_${fileNameWithoutExt}`
              }
            },
          },
        },
      },
    }),

    resolveId(id) {
      if (id === VIRTUAL_MANIFEST) return RESOLVED
    },

    load(id) {
      if (id !== RESOLVED) return
      const manifestPath = path.resolve(`${outDir}/client/.vite/manifest.json`)
      if (fs.existsSync(manifestPath)) {
        return `export default ${fs.readFileSync(manifestPath, 'utf8')}`
      }
      return `export default {}`
    },
  }
}
