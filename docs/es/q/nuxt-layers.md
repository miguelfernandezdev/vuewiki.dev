---
order: 162
title: "¿Qué son los layers de Nuxt y cuándo usarlos?"
difficulty: "advanced"
tags: ["nuxt", "architecture"]
summary: "Los layers son apps Nuxt parciales que extiendes via config. Comparten componentes, composables, páginas y configuración entre proyectos."
---

Los layers permiten compartir aplicaciones Nuxt parciales entre proyectos. Un layer puede incluir componentes, composables, páginas, layouts, middleware, plugins, rutas de servidor y configuración. Son el modelo de herencia de Nuxt: tu proyecto extiende uno o más layers, y todo se fusiona automáticamente.

## Usar un layer

Añádelo a `extends` en tu configuración:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [
    '@my-org/base-layer',          // desde npm
    '../shared-layer',              // directorio local
    'github:user/repo#main',       // desde git
  ]
})
```

Todo lo que el layer ofrece (componentes, composables, páginas, etc.) queda disponible en tu proyecto sin configuración adicional.

## Crear un layer

Un layer es un proyecto Nuxt mínimo con un `nuxt.config.ts`:

```
my-layer/
├── nuxt.config.ts
├── components/
│   ├── BaseButton.vue
│   └── BaseCard.vue
├── composables/
│   └── useTheme.ts
├── layouts/
│   └── default.vue
├── server/
│   └── api/
│       └── health.get.ts
└── package.json
```

```ts
// my-layer/nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui']
})
```

El proyecto consumidor obtiene todos los componentes, composables, layouts y rutas de servidor del layer, además de los módulos que este declara.

## Sobreescribir archivos del layer

Tu proyecto siempre tiene prioridad sobre el layer. Si el layer provee `components/BaseButton.vue` y tú creas el mismo archivo, tu versión tiene precedencia.

Orden de prioridad (de mayor a menor):
1. Los archivos de tu proyecto
2. Los layers auto-detectados del directorio `~~/layers` (ordenados alfabéticamente, Z tiene mayor prioridad que A)
3. Los layers en `extends` (la primera entrada gana sobre las siguientes)

## Layers auto-detectados

Coloca layers en un directorio `layers/` y Nuxt los descubre automáticamente:

```
my-app/
├── layers/
│   ├── base/
│   │   ├── nuxt.config.ts
│   │   └── components/
│   └── theme/
│       ├── nuxt.config.ts
│       └── composables/
├── nuxt.config.ts
└── pages/
```

No hace falta ninguna configuración en `extends` para estos.

## Ejemplo práctico: layer de tema

Un tema reutilizable compartido entre varias apps:

```ts
// theme-layer/app.config.ts
export default defineAppConfig({
  theme: {
    primaryColor: '#00dc82',
    darkMode: false
  }
})
```

```ts
// theme-layer/composables/useTheme.ts
export function useTheme() {
  const config = useAppConfig()
  const isDark = useState('dark', () => config.theme.darkMode)
  const toggle = () => isDark.value = !isDark.value
  return { isDark, toggle }
}
```

La app consumidora sobreescribe solo lo que necesita:

```ts
// my-app/app.config.ts
export default defineAppConfig({
  theme: {
    primaryColor: '#ff6347' // sobreescribe; darkMode sigue siendo false
  }
})
```

## Publicar como paquete npm

```json
{
  "name": "@my-org/base-layer",
  "version": "1.0.0",
  "type": "module",
  "main": "./nuxt.config.ts",
  "dependencies": {
    "@nuxt/ui": "^3.0.0"
  }
}
```

Cualquier proyecto puede entonces ejecutar `npm install @my-org/base-layer` y extenderlo.

## Crear un nuevo layer

```bash
npx nuxi init --template layer my-layer
```

## Layers vs módulos

| | Layer | Módulo |
|---|---|---|
| Qué es | Una app Nuxt parcial (archivos y configuración) | Un plugin en tiempo de build (código que se ejecuta durante el build) |
| Puede proveer | Componentes, páginas, layouts, composables, rutas de servidor, configuración | Cualquier cosa mediante la API programática de @nuxt/kit |
| Fusión | Basada en archivos, automática | Programática, explícita |
| Sobreescribir | Reemplaza el archivo en tu proyecto | Configura mediante opciones del módulo |
| Úsalo cuando | Compartas una app base, sistema de diseño o preset entre proyectos | Añadas una capacidad (analíticas, autenticación, optimización de imágenes) |

Ver también: [¿Cómo funcionan los módulos de Nuxt?](/es/q/nuxt-modules) · [¿Cuál es la convención de estructura de directorios de Nuxt?](/es/q/nuxt-directory-structure) · [¿Cómo desplegar una app Nuxt?](/es/q/nuxt-deployment)

## Referencias

- [Layers](https://nuxt.com/docs/getting-started/layers) - Nuxt docs
- [Extending a Layer](https://nuxt.com/docs/guide/going-further/layers) - Nuxt docs
- [nuxt.config extends](https://nuxt.com/docs/api/nuxt-config#extends) - Nuxt docs
