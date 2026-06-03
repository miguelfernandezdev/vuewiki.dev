---
order: 146
title: '¿Qué es Nuxt y qué modos de renderizado admite?'
difficulty: 'beginner'
tags: ['nuxt']
summary: 'Nuxt soporta SSR (por defecto), SPA, SSG y renderizado híbrido. Usa routeRules para combinar estrategias por ruta.'
---

Nuxt es un framework full-stack construido sobre Vue. Añade server-side rendering, enrutamiento basado en archivos, auto-importaciones, utilidades de obtención de datos y un motor de servidor (Nitro) de serie. Su principal diferenciador es que puedes elegir cómo se renderiza cada página: en el servidor, en el cliente, en tiempo de build o una combinación de los tres.

## Renderizado universal (SSR, por defecto)

El servidor ejecuta tu código Vue, genera HTML y lo envía al navegador. Después carga JavaScript e hidrata la página para hacerla interactiva.

```ts
// nuxt.config.ts — este es el valor por defecto
export default defineNuxtConfig({
  ssr: true
})
```

El navegador muestra el contenido de inmediato (bueno para SEO y rendimiento percibido) y luego Vue toma el control para la interactividad.

## Renderizado del lado del cliente (SPA)

El servidor envía un HTML vacío y Vue renderiza todo en el navegador.

```ts
export default defineNuxtConfig({
  ssr: false
})
```

Más sencillo de desarrollar (sin restricciones de SSR), más barato de alojar (archivos estáticos), pero sin contenido en el HTML inicial. Úsalo para dashboards, paneles de administración y apps detrás de autenticación donde el SEO no importa.

## Generación estática (SSG)

Pre-renderiza las páginas a HTML en tiempo de build. El resultado es un conjunto de archivos estáticos que puedes desplegar en cualquier lugar.

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/blog/**': { prerender: true }
  }
})
```

O genera el sitio completo con `nuxt generate`.

## Renderizado híbrido (el verdadero potencial)

Combina modos de renderizado por ruta usando `routeRules`. Cada ruta puede tener su propia estrategia:

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/blog/**': { isr: 3600 },
    '/admin/**': { ssr: false },
    '/api/**': { cors: true }
  }
})
```

| Regla             | Qué hace                                                           |
| ----------------- | ------------------------------------------------------------------ |
| `prerender: true` | Genera HTML estático en tiempo de build                            |
| `ssr: false`      | Solo en el cliente (SPA)                                           |
| `isr: 3600`       | Incremental Static Regeneration, regenera cada hora                |
| `swr: true`       | Stale-While-Revalidate, sirve el caché y regenera en segundo plano |

También puedes definir route rules inline en una página:

```vue
<script setup>
defineRouteRules({ prerender: true })
</script>
```

## Contenido solo en el cliente

Cuando partes de una página no pueden ejecutarse en el servidor (APIs del navegador, widgets de terceros):

```vue
<template>
  <ClientOnly>
    <BrowserOnlyChart />
    <template #fallback>
      <p>Cargando gráfico...</p>
    </template>
  </ClientOnly>
</template>
```

En el script, usa `import.meta.server` e `import.meta.client` para bifurcar la lógica:

```ts
if (import.meta.client) {
  window.addEventListener('resize', handleResize)
}
```

## Cuándo usar cada modo

| Escenario                               | Modo de renderizado      |
| --------------------------------------- | ------------------------ |
| Sitio de marketing, blog, documentación | SSG (`prerender: true`)  |
| E-commerce con precios dinámicos        | ISR o SWR                |
| Dashboard detrás de login               | SPA (`ssr: false`)       |
| Páginas dinámicas con SEO importante    | SSR (por defecto)        |
| Combinación de todo lo anterior         | Híbrido con `routeRules` |

Ver también: [¿Cómo funciona el renderizado híbrido en Nuxt?](/es/q/nuxt-hybrid-rendering) · [¿Cómo desplegar una app Nuxt?](/es/q/nuxt-deployment) · [¿Cómo funciona el data fetching en Nuxt?](/es/q/nuxt-data-fetching)

## Referencias

- [Rendering](https://nuxt.com/docs/guide/concepts/rendering) - Nuxt docs
- [Route Rules](https://nuxt.com/docs/api/nuxt-config#routerules) - Nuxt docs
- [Prerendering](https://nuxt.com/docs/getting-started/prerendering) - Nuxt docs
