---
order: 90
title: "¿Cómo funcionan los módulos de Nuxt y cuándo crearías uno?"
difficulty: "intermediate"
tags: ["nuxt", "architecture"]
---

Los módulos de Nuxt son plugins que se ejecutan en tiempo de build y extienden el framework. Pueden registrar componentes, composables, rutas de servidor, plugins y modificar la configuración de Nuxt/Vite. El ecosistema está lleno de ellos: `@nuxt/ui`, `@nuxt/image`, `@nuxtjs/i18n`, `@pinia/nuxt`.

## Usar módulos

Instala y añade a `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    ['@nuxt/image', { provider: 'cloudinary' }]
  ]
})
```

Eso es todo. Los componentes, composables y plugins del módulo quedan disponibles automáticamente.

## Crear un módulo

Usa `defineNuxtModule` con los helpers de `@nuxt/kit`:

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

## Qué pueden registrar los módulos

| Helper de @nuxt/kit | Registra |
|---|---|
| `addComponent` | Un componente global |
| `addComponentsDir` | Un directorio de componentes |
| `addImports` | Un composable/utilidad con auto-importación |
| `addImportsDir` | Un directorio de auto-importaciones |
| `addPlugin` | Un plugin de cliente/servidor/universal |
| `addServerHandler` | Una ruta de servidor Nitro |

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

## Estructura de directorios de un módulo

```
modules/analytics/
├── index.ts              ← definición del módulo (tiempo de build)
└── runtime/
    ├── components/       ← componentes Vue
    ├── composables/      ← composables para auto-importación
    ├── server/           ← rutas de servidor Nitro
    └── plugin.ts         ← plugin de Nuxt
```

El directorio `runtime/` contiene el código que se ejecuta en la app. Todo lo que está fuera de él solo se ejecuta en tiempo de build.

## Cuándo crear un módulo vs un plugin vs un composable

| Necesidad | Usar |
|---|---|
| Añadir configuración en tiempo de build, registrar componentes/rutas/plugins | Módulo |
| Ejecutar código al iniciar la app (cliente o servidor) | Plugin |
| Lógica reutilizable para componentes individuales | Composable |
| Compartir funcionalidad entre varios proyectos Nuxt | Módulo (publicable en npm) |
| Integración puntual específica del proyecto | Plugin o composable suele ser suficiente |

Ver también: [¿Qué son las layers de Nuxt?](/es/q/nuxt-layers) · [¿Cómo funcionan los auto-imports en Nuxt?](/es/q/nuxt-auto-imports) · [¿Cuál es la convención de estructura de directorios de Nuxt?](/es/q/nuxt-directory-structure)

## Referencias

- [Modules](https://nuxt.com/docs/guide/concepts/modules) - Nuxt docs
- [Module Author Guide](https://nuxt.com/docs/guide/going-further/modules) - Nuxt docs
- [@nuxt/kit](https://nuxt.com/docs/api/kit) - Nuxt docs
