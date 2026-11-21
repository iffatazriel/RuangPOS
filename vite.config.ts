import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({ plugins: [react(), tailwindcss(), VitePWA({ registerType: 'autoUpdate', manifest: { name: 'RuangPOS — Kasir UMKM', short_name: 'RuangPOS', lang: 'id', start_url: '/', display: 'standalone', background_color: '#121212', theme_color: '#121212', icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] }, workbox: { globPatterns: ['**/*.{js,css,html,png,woff2}'] } })] })
