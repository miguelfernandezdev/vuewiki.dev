---
order: 21
title: "¿Cómo planificarías una migración de Vue 2 a Vue 3?"
difficulty: "advanced"
tags: ["migration", "pinia", "vite", "vuex", "v-model", "provide-inject"]
---

Una migración de Vue 2 a Vue 3 no es una reescritura total — es un proceso incremental. Vue 3 proporciona `@vue/compat` (el build de compatibilidad), que ejecuta el código Vue 2 existente sobre el runtime de Vue 3 y registra avisos de deprecación por cada API que hayas utilizado y que haya sido eliminada o modificada. Esto significa que puedes hacer el cambio en un día y seguir teniendo la aplicación funcionando, para luego ir resolviendo los problemas por categorías a lo largo de semanas o meses, a tu propio ritmo.

## Fase 1: Auditoría

Antes de tocar ningún código, necesitas saber con qué estás tratando. Una migración sin inventario previo es adivinar.

Recorre el código y documenta:

- **Número de componentes** — te da una estimación aproximada del tamaño del trabajo que tienes por delante.
- **Mixins** — cada mixin es un composable esperando a existir. Los mixins eran el mecanismo de reutilización de Vue 2, pero ocultan dependencias y provocan colisiones de nombres. En Vue 3 están desaconsejados en favor de los composables.
- **Filtros** — la sintaxis `{{ price | currency }}` ha sido eliminada por completo en Vue 3. Cada filtro debe convertirse en una propiedad computada o en un método.
- **Uso del event bus** — si tienes una instancia global de Vue usada como `bus.$on(...)` / `bus.$off(...)`, esos métodos de instancia ya no existen. Necesitas una estrategia de reemplazo.
- **Stores de Vuex** — Vuex 4 funciona con Vue 3 (como puente), pero el movimiento recomendado a largo plazo es Pinia.
- **Librerías de terceros** — este es habitualmente el mayor riesgo. Comprueba si cada librería tiene una versión compatible con Vue 3. Algunas librerías populares de Vue 2 fueron abandonadas y nunca actualizadas.
- **Directivas personalizadas** — los nombres de los hooks del ciclo de vida de las directivas cambiaron en Vue 3 (`bind` → `beforeMount`, `inserted` → `mounted`, `update` → `updated`, `componentUpdated` → `updated`, `unbind` → `unmounted`).
- **Render functions** — la firma de la función `h` cambió. Las props ahora son planas (sin objetos anidados `attrs`, `on`, `class`). En Vue 3, `h` se importa directamente desde Vue, no se recibe como parámetro.

Esta auditoría te da un alcance real de la migración. Sin ella, descubrirás bloqueos a mitad del proceso cuando sea más difícil recuperarse.

## Fase 2: Preparación (todavía en Vue 2)

Puedes hacer una cantidad significativa de trabajo antes de cambiar a Vue 3. Esto reduce el tamaño de la fase de build de compatibilidad.

**Añade TypeScript de forma gradual.** No necesitas convertirlo todo de una vez. Empieza con los archivos nuevos y los existentes más complejos. TypeScript también detectará errores de tipos que las APIs más estrictas de Vue 3 expondrían de todas formas.

**Extrae los mixins en composables.** Vue 2.7 (la versión final de Vue 2) incluye soporte para la Composition API. Esto significa que puedes escribir `setup()` y composables en Vue 2.7 hoy mismo. Extrae cada mixin a un composable y reemplaza sus usos. Para cuando migres a Vue 3, los composables ya estarán listos.

**Reemplaza el event bus.** Un event bus global es una dependencia implícita que hace que los componentes sean difíciles de razonar. Antes de migrar:

- Para comunicación padre-hijo: usa `props` y `emit` (ya deberías estar haciéndolo).
- Para comunicación entre árboles: usa `provide`/`inject`, o un objeto de estado reactivo (un store de Pinia, o incluso un simple `reactive()` exportado desde un módulo).
- Si necesitas un event bus real, [mitt](https://github.com/developit/mitt) es un reemplazo de 200 bytes que funciona tanto en Vue 2 como en Vue 3.

**Actualiza las dependencias que tienen versiones para Vue 3.** Hazlo antes de cambiar. Actualizar `vue-router` de v3 a v4 y `vuex` de v3 a v4 (o a Pinia) mientras estás en el build de compatibilidad añade una carga cognitiva innecesaria. Hazlo en la fase de preparación.

## Fase 3: Cambiar al build de compatibilidad

Una vez terminada la fase de preparación, instala `@vue/compat` y configura tu bundler para que use un alias de `vue` apuntando a él:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2
          }
        }
      }
    })
  ],
  resolve: {
    alias: {
      vue: '@vue/compat'
    }
  }
})
```

Y en el punto de entrada principal:

```ts
// main.ts
import { createApp, configureCompat } from 'vue'
import App from './App.vue'

configureCompat({
  MODE: 2 // emulate Vue 2 behavior by default
})

const app = createApp(App)
app.mount('#app')
```

`MODE: 2` le dice al build de compatibilidad que se comporte lo más parecido posible a Vue 2, mientras registra un aviso cada vez que uses una API deprecada. La aplicación debería seguir funcionando. Ahora abre la consola del navegador y empieza a resolver los avisos.

También puedes desactivar la compatibilidad para funcionalidades específicas una vez que estén corregidas, para confirmar que no hay regresiones:

```ts
configureCompat({
  MODE: 2,
  FILTERS: false,         // confirmed: no filters remain
  INSTANCE_EVENT_EMITTER: false // confirmed: no $on/$off usage remains
})
```

Esto te da una lista de verificación de migración por funcionalidad, aplicada en tiempo de ejecución.

## Qué cambia: las eliminaciones de API más importantes

| Vue 2 | Vue 3 | Ruta de migración |
| --- | --- | --- |
| Filtros (sintaxis de pipe `\|`) | Eliminados | Usa una propiedad computada o un método utilitario |
| `$on` / `$off` / `$once` | Eliminados | Usa mitt, o provide/inject para eventos entre componentes |
| `$listeners` | Eliminado | Se fusiona con `$attrs` — usa `v-bind="$attrs"` |
| `$set` / `$delete` | Eliminados | La reactividad basada en Proxy es automática — ya no son necesarios |
| Mixins | Desaconsejados | Extrae a composables |
| Vuex | Opcional | Pinia es el reemplazo recomendado |
| Options API | Todavía soportada | `<script setup>` es la alternativa moderna recomendada |
| `Vue.extend` | Eliminado | Usa `defineComponent` |
| `v-model` (una sola prop) | Múltiples bindings de `v-model` | Cambio menor de sintaxis, compatible hacia atrás para el caso básico |

Las eliminaciones que afectan a más proyectos en la práctica son los filtros, `$listeners` y el event bus. Prioriza esas.

## Fase 4: Eliminar el build de compatibilidad

Una vez que la consola del navegador no muestre ningún mensaje `[Vue warn]` relacionado con la compatibilidad, estás listo para eliminar `@vue/compat` por completo.

Vuelve al `vue` normal:

```ts
// vite.config.ts — remove the alias block
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()]
})
```

```ts
// main.ts — remove configureCompat
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

Tras eliminar el build de compatibilidad, ejecuta toda tu suite de tests. Aquí es donde emergen los problemas silenciosos — cosas que el build de compatibilidad corregía sin avisar y que ya no corrige. Resuelve los fallos antes de continuar.

En este punto tu aplicación está ejecutándose sobre Vue 3 estándar. Puedes continuar migrando componentes a `<script setup>` + TypeScript a tu propio ritmo, ya que la Options API sigue funcionando en Vue 3.

## Áreas de riesgo a vigilar

**Librerías de terceros sin soporte para Vue 3.** Este es el bloqueo más habitual. Librerías como `vue-awesome-swiper`, versiones antiguas de `vue-i18n`, o librerías de componentes UI que nunca fueron actualizadas pueden detener una migración por completo. Audita siempre esto en la Fase 1. Si una librería no tiene versión para Vue 3, necesitas encontrar un reemplazo antes de empezar.

**Directivas personalizadas.** Todos los nombres de los hooks del ciclo de vida cambiaron. Una directiva que funcionaba en Vue 2 no hará nada en Vue 3 si los hooks siguen usando los nombres anteriores. El build de compatibilidad avisa de esto, pero es fácil pasarlo por alto.

**Render functions.** Si tienes componentes que usan render functions manualmente, la API de `h` cambió de forma significativa. En Vue 2, `h` recibe objetos anidados (`{ attrs: {}, on: {}, class: '' }`). En Vue 3, las props son planas:

```ts
// Vue 2
h('div', { attrs: { id: 'app' }, on: { click: handler } }, children)

// Vue 3
h('div', { id: 'app', onClick: handler }, children)
```

**Módulos de Vuex con getters complejos.** Si estás migrando a Pinia, la composición de getters funciona de forma diferente. Los getters de Pinia reciben el estado del store directamente y pueden acceder a otros stores importándolos — no existe `rootState` ni `rootGetters`. Los árboles complejos de módulos Vuex requieren un mapeo cuidadoso.

---

Ver también: [¿Cuáles son las diferencias entre Nuxt 2 y Nuxt 3?](/es/q/nuxt2-vs-nuxt3) · [¿Cuáles son los puntos de fricción al migrar de Nuxt 2 a Nuxt 3?](/es/q/nuxt2-to-nuxt3-friction) · [¿Cuáles son los anti-patrones más comunes en proyectos grandes de Vue?](/es/q/vue-anti-patterns)

## Referencias

- [Migration Guide](https://v3-migration.vuejs.org/) - Vue.js docs
- [Migration Build](https://v3-migration.vuejs.org/migration-build.html) - Vue.js docs
- [Breaking Changes](https://v3-migration.vuejs.org/breaking-changes/) - Vue.js docs
