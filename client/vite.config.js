import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  if (command === 'build') {
    const value = process.env.VITE_API_URL || env.VITE_API_URL
    if (!value) throw new Error('Set VITE_API_URL before building')
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) {
      throw new Error('VITE_API_URL must be a backend origin without /api or credentials')
    }
  }
  return { plugins: [react()] }
})
