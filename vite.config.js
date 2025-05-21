// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // alle verzoeken naar /api/… worden doorgestuurd naar CoinGecko
      '/api': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api/v3'),
      },
    },
  },
});
