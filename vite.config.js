import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimisations de build
    rollupOptions: {
      output: {
        // Séparation intelligente des chunks pour un meilleur cache
        manualChunks: {
          // Dépendances React dans un chunk séparé
          'vendor-react': ['react', 'react-dom'],
          // Chakra UI dans un chunk séparé (grosse bibliothèque)
          'vendor-chakra': ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
          // Bibliothèque de graphiques dans un chunk séparé
          'vendor-charts': ['recharts'],
          // Firebase dans un chunk séparé
          'vendor-firebase': ['firebase/auth', 'firebase/app'],
        },
      },
    },
    // Optimisation des chunks
    chunkSizeWarningLimit: 1000,
  },
  // Optimisation des performances de développement
  server: {
    // Pré-bundling des dépendances pour accélérer le rechargement
    hmr: {
      overlay: true,
    },
  },
  // Optimisations des dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', '@chakra-ui/react', 'recharts'],
  },
})
