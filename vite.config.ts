import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api/quota': {
        target: 'https://info.xn--42caj4e1a2ame9b2cq0dyo.com',
        changeOrigin: true,
        rewrite: () => '/halfhalf/quota',
        secure: true,
      },
    },
  },
})
