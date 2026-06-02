---
order: 100
title: "¿Qué es Vite y cómo funciona?"
difficulty: "beginner"
tags: ["tooling", "vite"]
---

Vite es una herramienta de compilación creada por Evan You (también el creador de Vue). Sirve tu código durante el desarrollo usando módulos ES nativos, lo que hace que el servidor de desarrollo arranque al instante independientemente del tamaño del proyecto. Para producción, empaqueta con Rollup.

## Por qué Vite es rápido en desarrollo

Los empaquetadores tradicionales (Webpack) empaquetan toda tu aplicación antes de que el servidor de desarrollo pueda arrancar. Cuanto mayor es el proyecto, más tiempo de espera.

Vite adopta un enfoque diferente:

1. El servidor de desarrollo arranca inmediatamente, antes de procesar ningún código
2. Cuando el navegador solicita un archivo, Vite lo transforma bajo demanda
3. Las instrucciones `import` nativas del navegador gestionan la resolución de módulos

```
Empaquetador tradicional:
  todos los archivos → empaquetar → servir → navegador

Vite:
  servir inmediatamente → el navegador solicita un archivo → transformar bajo demanda
```

Añadir más archivos a tu proyecto no ralentiza el arranque del servidor de desarrollo.

## Módulos ES nativos

Vite sirve los archivos fuente como módulos ES directamente al navegador:

```ts
// El navegador ve instrucciones import reales
import { ref } from '/node_modules/.vite/deps/vue.js'
import MyComponent from '/src/components/MyComponent.vue'
```

Vite pre-empaqueta las dependencias (como `vue`, `lodash`) usando esbuild, que está escrito en Go y las procesa en milisegundos. Tus propios archivos fuente se sirven individualmente y se transforman al vuelo.

## Hot Module Replacement (HMR)

Cuando guardas un archivo, Vite reemplaza solo ese módulo en el navegador sin recargar la página completa:

- Edita el template o los estilos de un componente Vue y ves el cambio al instante
- El estado del componente se preserva durante las actualizaciones
- El HMR es rápido independientemente del tamaño de la app porque solo procesa el archivo modificado, no todo el árbol de dependencias

## Compilaciones de producción

Para producción, Vite usa Rollup para crear bundles optimizados:

```bash
vite build
```

Rollup produce:
- Chunks con división de código (las importaciones dinámicas se convierten en archivos separados)
- Salida con tree-shaking (las exportaciones no usadas se eliminan)
- JavaScript y CSS minificados
- Nombres de archivo con hash para la invalidación de caché

## Configurar un proyecto Vue con Vite

```bash
npm create vue@latest
```

Esto usa `create-vue`, que genera un proyecto Vue con Vite. El archivo de configuración es mínimo:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
})
```

Eso es todo lo que necesitas. `@vitejs/plugin-vue` gestiona los Single-File Components `.vue`.

## Opciones de configuración comunes de Vite

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
| Arranque del servidor de desarrollo | Instantáneo (sin empaquetar) | Lento (lo empaqueta todo antes) |
| Velocidad del HMR | Constante (solo procesa el archivo modificado) | Empeora con el tamaño del proyecto |
| Configuración | Mínima por defecto | Detallada, requiere loaders y plugins |
| Empaquetador de producción | Rollup | Webpack |
| Módulos ES | Nativos en desarrollo | Empaquetados en desarrollo |
| Ecosistema | En crecimiento, plugins compatibles con Rollup | Masivo y maduro |

## Nuxt y Vite

Nuxt 3 usa Vite por defecto. En la mayoría de los casos no configuras Vite directamente. La configuración de Nuxt envuelve Vite internamente:

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

Ver también: [¿Cómo funciona el tree-shaking en Vue 3?](/es/q/tree-shaking-vue3) · [¿Cómo implementar la carga diferida y la división de código?](/es/q/lazy-loading-code-splitting) · [¿Cómo crear un proyecto Vue desde cero?](/es/q/create-vue-project)

## Referencias

- [Vite](https://vite.dev/) - Vite docs
- [Getting Started](https://vite.dev/guide/) - Vite docs
- [Tooling](https://vuejs.org/guide/scaling-up/tooling.html) - Vue.js docs
