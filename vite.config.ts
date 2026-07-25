import { defineConfig } from 'vite'

export default defineConfig({
  // Keep production assets relative so the build works under GitHub Pages' /stylizer/ path.
  base: './',
})
