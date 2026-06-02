---
order: 155
title: "¿Cómo funciona el renderizado híbrido (route rules) en Nuxt?"
difficulty: "intermediate"
tags: ["nuxt", "ssr", "performance"]
summary: "routeRules permite combinar prerender, ISR, SWR y SPA por ruta en la misma app Nuxt."
---

El renderizado híbrido permite combinar estrategias de renderizado por ruta dentro de la misma app Nuxt. Una página de marketing puede pre-renderizarse en tiempo de build, el blog puede usar ISR y el panel de administración puede ser solo del cliente. Todo se configura en `routeRules`.

## routeRules en nuxt.config.ts

```ts
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },
    '/about': { prerender: true },
    '/blog/**': { isr: 3600 },
    '/admin/**': { ssr: false },
    '/api/**': { cors: true },
  }
})
```

Cada clave es un patrón de ruta. Los patrones glob (`**`) coinciden con rutas anidadas.

## Reglas disponibles

| Regla | Qué hace |
|---|---|
| `prerender: true` | Genera HTML estático en tiempo de build |
| `ssr: false` | Solo en el cliente (SPA para esa ruta) |
| `isr: number` | Incremental Static Regeneration, caché durante N segundos |
| `swr: number \| true` | Stale-While-Revalidate, sirve el contenido antiguo y actualiza en segundo plano |
| `cache: { maxAge: number }` | Caché de respuesta del servidor con TTL |
| `redirect: string` | Redirección HTTP |
| `cors: true` | Añade cabeceras CORS |
| `headers: object` | Cabeceras de respuesta personalizadas |

## Cuándo usar cada estrategia

**Prerender** para contenido que cambia en el momento del despliegue:

```ts
routeRules: {
  '/': { prerender: true },
  '/pricing': { prerender: true },
  '/docs/**': { prerender: true },
}
```

**ISR** para contenido que cambia periódicamente pero no necesita ser en tiempo real:

```ts
routeRules: {
  '/blog/**': { isr: 3600 },       // regenerar cada hora
  '/products/**': { isr: 600 },    // regenerar cada 10 minutos
}
```

La primera petición tras expirar el caché dispara una regeneración en segundo plano. Los usuarios siempre reciben una respuesta rápida desde el caché.

**SWR** es similar a ISR pero siempre sirve la versión antigua mientras revalida:

```ts
routeRules: {
  '/feed': { swr: true },           // TTL por defecto
  '/leaderboard': { swr: 300 },     // ventana de 5 minutos
}
```

**Solo cliente** para páginas detrás de autenticación o sin necesidad de SEO:

```ts
routeRules: {
  '/admin/**': { ssr: false },
  '/dashboard/**': { ssr: false },
}
```

## Route rules inline (por página)

En lugar de configurarlo todo en `nuxt.config.ts`, puedes definir las reglas directamente en la página:

```vue
<!-- pages/about.vue -->
<script setup>
defineRouteRules({
  prerender: true
})
</script>
```

Esto mantiene la estrategia de renderizado junto a la página que la usa.

## Combinación de reglas

Las reglas se pueden combinar. Una ruta puede tener caché, cabeceras y CORS a la vez:

```ts
routeRules: {
  '/api/public/**': {
    cors: true,
    cache: { maxAge: 60 },
    headers: { 'X-Custom': 'value' }
  }
}
```

## ISR vs SWR vs prerender

| | prerender | ISR | SWR |
|---|---|---|---|
| Cuándo se genera el HTML | En tiempo de build | Primera petición, luego por intervalo | Primera petición, luego por intervalo |
| Se muestra contenido desactualizado | Nunca (hasta el próximo despliegue) | Solo mientras se regenera | Siempre (actualiza en segundo plano) |
| Requiere servidor | No (archivos estáticos) | Sí | Sí |
| Adecuado para | Landing pages, documentación | Posts de blog, páginas de producto | Feeds, dashboards |

Ver también: [¿Cuáles son los modos de renderizado en Nuxt?](/es/q/nuxt-rendering-modes) · [¿Cómo desplegar una app Nuxt?](/es/q/nuxt-deployment) · [¿Cómo funciona el data fetching en Nuxt?](/es/q/nuxt-data-fetching)

## Referencias

- [Hybrid Rendering](https://nuxt.com/docs/guide/concepts/rendering#hybrid-rendering) - Nuxt docs
- [Route Rules](https://nuxt.com/docs/api/nuxt-config#routerules) - Nuxt docs
- [Nitro Route Rules](https://nitro.build/config#routerules) - Nitro docs
