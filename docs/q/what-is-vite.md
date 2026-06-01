---
order: 100
title: "What is Vite and how does it work?"
difficulty: "beginner"
tags: ["tooling"]
---

Vite is a build tool created by Evan You (also the creator of Vue). It serves your code during development using native ES modules, which makes the dev server start instantly regardless of project size. For production, it bundles with Rollup.

## Why Vite is fast in development

Traditional bundlers (Webpack) bundle your entire app before the dev server can start. The bigger the project, the longer you wait.

Vite takes a different approach:

1. The dev server starts immediately, before processing any code
2. When the browser requests a file, Vite transforms it on demand
3. The browser's native `import` statements handle module resolution

```
Traditional bundler:
  all files → bundle → serve → browser

Vite:
  serve immediately → browser requests file → transform on demand
```

This means adding more files to your project doesn't slow down the dev server startup.

## Native ES modules

Vite serves source files as ES modules directly to the browser:

```ts
// The browser sees actual import statements
import { ref } from '/node_modules/.vite/deps/vue.js'
import MyComponent from '/src/components/MyComponent.vue'
```

Vite pre-bundles dependencies (like `vue`, `lodash`) using esbuild, which is written in Go and processes them in milliseconds. Your own source files are served individually and transformed on the fly.

## Hot Module Replacement (HMR)

When you save a file, Vite replaces only that module in the browser without a full page reload:

- Edit a Vue component's template or styles, and you see the change instantly
- Component state is preserved during updates
- HMR is fast regardless of app size because it only processes the changed file, not the entire dependency tree

## Production builds

For production, Vite uses Rollup to create optimized bundles:

```bash
vite build
```

Rollup produces:
- Code-split chunks (dynamic imports become separate files)
- Tree-shaken output (unused exports are removed)
- Minified JavaScript and CSS
- Hashed filenames for cache busting

## Setting up a Vue project with Vite

```bash
npm create vue@latest
```

This uses `create-vue`, which scaffolds a Vite-powered Vue project. The config file is minimal:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
})
```

That's all you need. The `@vitejs/plugin-vue` handles `.vue` single-file components.

## Common Vite config options

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true
  }
})
```

## Vite vs Webpack

| | Vite | Webpack |
|---|---|---|
| Dev server start | Instant (no bundling) | Slow (bundles everything first) |
| HMR speed | Constant (only processes changed file) | Degrades with project size |
| Config | Minimal by default | Verbose, requires loaders and plugins |
| Production bundler | Rollup | Webpack |
| ES modules | Native in dev | Bundled in dev |
| Ecosystem | Growing, Rollup-compatible plugins | Massive, mature |

## Nuxt and Vite

Nuxt 3 uses Vite by default. You don't configure Vite directly in most cases. Nuxt's config wraps Vite under the hood:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    css: {
      preprocessorOptions: {
        scss: { additionalData: '@use "~/assets/scss/vars" as *;' }
      }
    }
  }
})
```
