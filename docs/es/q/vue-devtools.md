---
order: 7
title: "¿Cómo ayudan las Vue DevTools con la depuración?"
difficulty: "beginner"
tags: ["tooling", "pinia", "vite"]
---

Vue DevTools es una extensión de navegador (Chrome, Firefox, Edge) y un plugin de Vite independiente que te permite inspeccionar tu aplicación Vue en tiempo de ejecución. Puedes ver el árbol de componentes, el estado reactivo, los stores de Pinia, las rutas y los datos de rendimiento sin añadir `console.log` por todas partes.

## Instalación

**Extensión de navegador** (Vue 3):

Instala "Vue.js devtools" desde la Chrome Web Store o Firefox Add-ons. Se activa automáticamente cuando detecta una aplicación Vue en la página.

**Plugin de Vite** (se abre en un panel dentro de tu aplicación):

```bash
npm install -D vite-plugin-vue-devtools
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()]
})
```

En Nuxt 3, las devtools están integradas. Actívalas con:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true }
})
```

## Inspector de componentes

El árbol de componentes muestra cada componente de tu aplicación con su jerarquía. Selecciona un componente para ver:

- **Props**: valores actuales, tipos, si son requeridos
- **Estado reactivo**: refs, objetos reactive, valores computed con sus valores actuales
- **Eventos emitidos**: un registro de cada evento que el componente ha emitido
- **Slots**: qué slots se están usando

Puedes editar el estado reactivo directamente en el panel para probar cómo responde la interfaz sin cambiar el código.

## Integración con Pinia

Las DevTools muestran cada store de Pinia con:

- Valores del estado actual (editables en el panel)
- Getters y sus valores computed
- Una línea de tiempo de cada llamada a una acción con argumentos y tiempos
- Depuración con viaje en el tiempo: haz clic en cualquier instantánea de estado anterior para revertir la interfaz a ese punto

Esta es una de las razones principales para usar Pinia sobre composables hechos a mano para estado complejo.

## Pestaña de router

Muestra todas las rutas registradas, la ruta actual con sus parámetros/query/meta, y un historial de navegaciones. Útil para depurar guardias de ruta y coincidencias de rutas dinámicas.

## Línea de tiempo

Un registro cronológico de eventos en tu aplicación:

- Lifecycle hooks de componentes (mounted, updated, unmounted)
- Acciones y mutaciones de Pinia
- Navegaciones de rutas
- Eventos personalizados que emites

Filtra por tipo de evento para centrarte en lo que estás depurando.

## Perfilado de rendimiento

La pestaña de rendimiento mide:

- Tiempo de render de cada componente
- Con qué frecuencia se re-renderiza un componente
- Qué componentes son los más costosos

Úsala para encontrar componentes que se re-renderizan demasiado o tardan demasiado en renderizarse.

## Inspeccionar desde la página

Haz clic en el botón "seleccionar componente" en las DevTools y luego haz clic en cualquier elemento de la página. Las DevTools saltan a ese componente en el árbol. Esto es más rápido que navegar el árbol manualmente para componentes profundamente anidados.

## Flujos de depuración comunes

| Problema | Qué revisar en DevTools |
|---|---|
| La interfaz no se actualiza | Comprueba si el estado reactivo realmente cambió (pestaña de estado) |
| Datos incorrectos mostrados | Inspecciona los props pasados al componente |
| La ruta no coincide | Revisa la pestaña del router para ver rutas registradas y parámetros actuales |
| La acción de Pinia no funciona | Comprueba la línea de tiempo para llamadas a acciones y errores |
| El componente se re-renderiza demasiado | Usa la pestaña de rendimiento para encontrar renders excesivos |
| El evento no llega al padre | Comprueba los eventos emitidos en el componente hijo |

Ver también: [¿Cómo diagnosticar una página lenta?](/es/q/diagnose-slow-page) · [¿Cómo depurar peticiones SSR?](/es/q/debug-ssr-requests) · [¿Cómo optimizar el rendimiento en una app Vue?](/es/q/performance-optimization)

## Referencias

- [Vue DevTools](https://devtools.vuejs.org/) - Vue DevTools docs
- [Debugging](https://vuejs.org/guide/scaling-up/tooling.html#browser-devtools) - Vue.js docs
- [Pinia DevTools](https://pinia.vuejs.org/core-concepts/#devtools) - Pinia docs
