import { execSync } from 'node:child_process';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
// The version shown in Settings: the date and short hash of the last
// commit, so every deploy gets a new one without bumping anything.
const git = (args: string) => {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};
const version =
  [git('log -1 --format=%cs'), git('rev-parse --short HEAD')]
    .filter(Boolean)
    .join(' · ') || 'dev';

export default defineConfig({
  define: { __VERSION__: JSON.stringify(version) },
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
        name: 'Crossmath',
        short_name: 'Crossmath',
        description: 'A math crossword puzzle for kids that works offline',
        theme_color: '#d6336c',
        background_color: '#f4f5f7',
        display: 'standalone',
      },
    }),
  ],
});
