import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Viene integrado en Node.js

export default defineConfig({
  plugins: [react()],
  base: '/PresupuestosFront_b/', 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Le dice a Vite que @ es igual a la carpeta src
    },
  },
})