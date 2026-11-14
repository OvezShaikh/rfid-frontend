import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Unostar RFID Tracking',
        short_name: 'Unostar',
        description: 'Packaging Pool Tracking System',
        theme_color: '#102A43',
        background_color: '#F9FAFB',
        display: 'standalone',
        icons: [
          {
            src: 'ulogo.png',
            sizes: '192x192',
            type: 'image/jpeg'
          }
        ]
      },
      workbox: {
        // ✅ 1. FIX: Increase the limit to 5MB so the build passes
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
          }
        ]
      }
    })
  ],
  // ✅ 2. LONG-TERM FIX: Automatically split your app into smaller files
  build: {
    chunkSizeWarningLimit: 1000, // Suppress the warning for chunks up to 1MB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put all node_modules into separate files
          if (id.includes('node_modules')) {
            // Split MUI (Material UI)
            if (id.includes('@mui')) {
              return 'mui-vendor';
            }
            // Split Charts
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts-vendor';
            }
            // Split React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Everything else
            return 'vendor';
          }
        }
      }
    }
  }
});