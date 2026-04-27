import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Chinavut/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        calculator: resolve(__dirname, 'calculator.html'),
        admin: resolve(__dirname, 'backend/index.html'),
        quote: resolve(__dirname, 'quote.html'),
        detail: resolve(__dirname, 'detail.html'),
        resetPassword: resolve(__dirname, 'reset-password.html'),
        ledProducts: resolve(__dirname, 'led-products.html'),
        service: resolve(__dirname, 'service.html'),
        public_home: resolve(__dirname, 'public/public-calculator/public-calculator.html'),
        public_service: resolve(__dirname, 'public/public-service/public-service.html'),
      },
    },
  },
})
