import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-static-files',
      closeBundle() {
        // This runs after everything is built - replace React app with our 3052 version
        setTimeout(() => {
          try {
            // Replace main index.html with our 3052 version
            copyFileSync(resolve(__dirname, 'public/index.html'), resolve(__dirname, 'dist/index.html'))
            copyFileSync(resolve(__dirname, 'public/test_buttons.html'), resolve(__dirname, 'dist/test_buttons.html'))
            copyFileSync(resolve(__dirname, 'public/script.js'), resolve(__dirname, 'dist/script.js'))
            copyFileSync(resolve(__dirname, 'public/simple-wallet.js'), resolve(__dirname, 'dist/simple-wallet.js'))
            copyFileSync(resolve(__dirname, 'public/styles.css'), resolve(__dirname, 'dist/styles.css'))
            console.log('✅ Static files copied to dist/ - React app replaced with 3052 version')
          } catch (error) {
            console.error('❌ Failed to copy static files:', error)
          }
        }, 100)
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ethers: ['ethers']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  preview: {
    port: 4173,
    open: true
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'ethers'],
    exclude: []
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
      util: 'util'
    }
  }
})
