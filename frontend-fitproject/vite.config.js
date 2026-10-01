import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'FitProject',
      short_name: 'FitProject',
      description: 'Menú del campus y seguimiento de alimentación para estudiantes.',
      theme_color: '#10241f',
      background_color: '#f4f7f2',
      icons: [
        { src: '/images/emblem.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
      display: 'standalone',
      lang: 'es',
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: false,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
})