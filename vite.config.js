import { defineConfig } from 'vite';

// Served from https://rexzchen.github.io/PhD-Simulator/ on Pages, and from / in dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/PhD-Simulator/' : '/',
  build: { target: 'es2022' },
}));
