import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: set VITE_BASE=/your-repo-name/ when deploying
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/csg-celebrate/',
})
