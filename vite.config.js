import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // plugins: [
  //   react(),
  //   tailwindcss(),
  //   babel({ presets: [reactCompilerPreset()] })
  // ],
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),

    {
      name: 'redirect-base-without-slash',

      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/dock_mgmt_v1') {
            res.statusCode = 302
            res.setHeader('Location', '/dock_mgmt_v1/')
            res.end()
            return
          }

          next()
        })
      }
    }
  ],
  base: '/dock_mgmt_v1/',
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
