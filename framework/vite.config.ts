import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import flyingWorker from 'flying-worker/vite'
import path from "path";


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    server: {
      cors: false, // disable Vite's built-in CORS setting
      port: parseInt(env.APP_PORT) || 5173, 
      strictPort: true
    },
    plugins: [
      react(),
      cloudflare(),
      flyingWorker({
        appPath: 'resources/js',
        // outDir: 'dist', // optional, defaults to 'dist'
        // assetsDir: 'assets', // optional, defaults to 'assets'
      })
    ] as PluginOption[],
    publicDir: path.resolve(__dirname, "./public"),
  }
})