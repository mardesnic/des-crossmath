import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/des-crossmath/',
  plugins: [
    react(),
    // Installable from the browser menu, and works offline once loaded.
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true },
      manifest: {
        // A fixed id of its own, so a phone never mixes it up with an earlier
        // install or with the other games on this site.
        id: 'des-crossmath',
        name: 'Cross Math',
        short_name: 'Cross Math',
        description: 'A math crossword puzzle for kids that works offline',
        theme_color: '#d6336c',
        background_color: '#f4f5f7',
        display: 'standalone',
      },
    }),
  ],
});
