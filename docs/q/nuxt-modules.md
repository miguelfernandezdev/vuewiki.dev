---
order: 90
title: "How do Nuxt modules work and when would you create one?"
difficulty: "intermediate"
tags: ["nuxt", "architecture"]
---

Nuxt modules are plugins that run at build time and extend the framework. They can register components, composables, server routes, plugins, and modify the Nuxt/Vite config. The ecosystem is full of them: `@nuxt/ui`, `@nuxt/image`, `@nuxtjs/i18n`, `@pinia/nuxt`.

## Using modules

Install and add to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    ['@nuxt/image', { provider: 'cloudinary' }]
  ]
})
```

That's it. The module's components, composables, and plugins become available automatically.

## Creating a module

Use `defineNuxtModule` with `@nuxt/kit` helpers:

```ts
// modules/analytics/index.ts
import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'

export interface ModuleOptions {
  trackingId: string
  enabled?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'analytics',
    configKey: 'analytics'
  },
  defaults: {
    enabled: true
  },
  setup(options, nuxt) {
    if (!options.enabled) return

    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.analyticsId = options.trackingId

    addPlugin({
      src: resolve('./runtime/plugin'),
      mode: 'client'
    })
  }
})
```

```ts
// modules/analytics/runtime/plugin.ts
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  nuxtApp.hook('page:finish', () => {
    trackPageView(config.public.analyticsId)
  })
})
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['~/modules/analytics'],
  analytics: {
    trackingId: 'UA-123456'
  }
})
```

## What modules can register

| @nuxt/kit helper | Registers |
|---|---|
| `addComponent` | A global component |
| `addComponentsDir` | A directory of components |
| `addImports` | An auto-imported composable/utility |
| `addImportsDir` | A directory of auto-imports |
| `addPlugin` | A client/server/universal plugin |
| `addServerHandler` | A Nitro server route |

```ts
setup(options, nuxt) {
  const { resolve } = createResolver(import.meta.url)

  addComponent({
    name: 'AnalyticsBanner',
    filePath: resolve('./runtime/components/AnalyticsBanner.vue')
  })

  addImports({
    name: 'useTracking',
    from: resolve('./runtime/composables/useTracking')
  })

  addServerHandler({
    route: '/api/analytics',
    handler: resolve('./runtime/server/api/analytics')
  })
}
```

## Module directory structure

```
modules/analytics/
├── index.ts              ← module definition (build time)
└── runtime/
    ├── components/       ← Vue components
    ├── composables/      ← composables for auto-import
    ├── server/           ← Nitro server routes
    └── plugin.ts         ← Nuxt plugin
```

The `runtime/` directory contains code that runs in the app. Everything outside it runs only at build time.

## When to create a module vs a plugin vs a composable

| Need | Use |
|---|---|
| Add build-time config, register components/routes/plugins | Module |
| Run code at app startup (client or server) | Plugin |
| Reusable logic for individual components | Composable |
| Share functionality across multiple Nuxt projects | Module (publishable to npm) |
| One-off project-specific integration | Plugin or composable is usually enough |
