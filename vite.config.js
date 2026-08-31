import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// This app is used by field assessors in Madison County with little to no
// signal. The PWA plugin precaches the app shell so it opens and works with
// zero connectivity; all data capture is handled separately via IndexedDB
// (see src/db.js), which needs no network at all.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Ceres Flood Damage Assessment',
        short_name: 'Flood Assess',
        description: 'Offline-first flood damage assessment for chicken farms — Madison County',
        theme_color: '#14211E',
        background_color: '#14211E',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ]
});
