---
order: 166
title: '¿Cuáles son los principales puntos de fricción al migrar de Nuxt 2 a Nuxt 3?'
difficulty: 'advanced'
tags: ['nuxt', 'migration', 'pinia', 'vueuse', 'vuex', 'provide-inject']
summary: 'Fricción principal: Vuex a Pinia, asyncData a composables, ecosistema de terceros roto y trampas de reactividad de Composition API.'
---

Hay cuatro ejes de fricción: la gestión de estado (de Vuex a Pinia requiere repensar el flujo de datos, no solo la sintaxis), la obtención de datos (de asyncData/fetch a composables), el ecosistema (librerías de terceros sin soporte para Vue 3) y el cambio a la Composition API (convenciones de equipo, perder `this`, nuevas particularidades de reactividad). La migración debe ser incremental, usando Nuxt Bridge como paso intermedio.

## 1. De Vuex a Pinia

No es un buscar y reemplazar. El modelo mental cambia por completo:

```ts
// Nuxt 2: Vuex con mutations, módulos con namespace
// store/user.js
export const state = () => ({ user: null })
export const mutations = {
  SET_USER(state, user) {
    state.user = user
  }
}
export const actions = {
  async fetchUser({ commit }, id) {
    const user = await this.$axios.$get(`/users/${id}`)
    commit('SET_USER', user)
  }
}
```

```ts
// Nuxt 3: store de Pinia
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)

  async function fetchUser(id: number) {
    user.value = await $fetch(`/api/users/${id}`)
  }

  return { user, fetchUser }
})
```

Qué cambia:

- Las mutations desaparecen. Las acciones modifican el estado directamente.
- Los módulos con namespace se convierten en stores independientes que se importan entre sí.
- `this.$store.dispatch('user/fetchUser', id)` pasa a ser `useUserStore().fetchUser(id)`.
- Los nombres de acciones en formato string se convierten en llamadas de función tipadas.
- El store ya no es un singleton global con estructura rígida, es un composable.

La fricción es organizativa: cada componente que usa `this.$store` o `mapState`/`mapGetters` necesita reescribirse.

## 2. Obtención de datos

Cada patrón de obtención de datos cambia:

```ts
// Nuxt 2: asyncData recibe un objeto context
export default {
  async asyncData({ $axios, params, error }) {
    try {
      const user = await $axios.$get(`/users/${params.id}`)
      return { user }
    } catch (e) {
      error({ statusCode: 404 })
    }
  }
}
```

```vue
<!-- Nuxt 3: composables en script setup -->
<script setup>
const route = useRoute()
const { data: user, error } = await useFetch(`/api/users/${route.params.id}`)
</script>
```

<PlaygroundLink code="<script setup>
const route = useRoute()
const { data: user, error } = await useFetch(`/api/users/${route.params.id}`)
</script>" />

Qué cambia:

- `asyncData` y `fetch` (la opción de componente de Nuxt 2) no existen.
- El objeto `context` (`{ $axios, store, redirect, error }`) desaparece. Cada capacidad es ahora un composable separado (`useRoute`, `useRouter`, `navigateTo`, `useFetch`).
- `$axios` se reemplaza normalmente por `$fetch` (integrado en Nuxt 3 via ofetch).
- El manejo de errores usa `createError` o el ref `error` de `useFetch`.

## 3. Middleware

```ts
// Nuxt 2: basado en context
export default function ({ store, redirect }) {
  if (!store.state.auth.loggedIn) {
    redirect('/login')
  }
}
```

```ts
// Nuxt 3: basado en composables
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

El parámetro `context` desaparece por completo. Se usan composables en su lugar. `redirect()` pasa a ser `navigateTo()`. El middleware de servidor es ahora un concepto separado en `server/middleware/`.

## 4. Plugins

```ts
// Nuxt 2: inject en el context
export default function ({ app }, inject) {
  inject('analytics', new Analytics())
}
// Uso: this.$analytics.track(...)
```

```ts
// Nuxt 3: provide a través de nuxtApp
export default defineNuxtPlugin((nuxtApp) => {
  const analytics = new Analytics()
  nuxtApp.provide('analytics', analytics)
})
// Uso: const { $analytics } = useNuxtApp()
```

Cada plugin que usaba `inject` necesita reescribirse. Los componentes que accedían a valores inyectados mediante `this.$algo` ahora usan `useNuxtApp()`.

## 5. Ecosistema de terceros

Muchas librerías de Vue 2 / Nuxt 2 no sobrevivieron la transición:

| Librería                    | Estado                                                                            |
| --------------------------- | --------------------------------------------------------------------------------- |
| `vue-class-component`       | Descontinuada, sin equivalente en Vue 3                                           |
| `vue-property-decorator`    | Descontinuada                                                                     |
| `vuetify@2`                 | Vuetify 3 existe, pero la migración tardó años                                    |
| `@nuxtjs/axios`             | Reemplazado por `$fetch` integrado                                                |
| `@nuxtjs/auth`              | Sin versión oficial para Nuxt 3; usa `sidebase/nuxt-auth` o implementación propia |
| Módulos de `nuxt-community` | Algunos migraron, muchos abandonados                                              |

Conviene auditar todas las dependencias al principio. Algunas tienen equivalentes para Nuxt 3, otras necesitan reemplazo y algunas requieren reimplementación personalizada.

## 6. Particularidades de reactividad en la Composition API

Los desarrolladores que vienen de la Options API se encuentran con nuevos problemas:

- Olvidar `.value` en los refs (el error más frecuente)
- Desestructurar objetos `reactive()` pierde la reactividad (hay que usar `toRefs()`)
- `this` no existe en `<script setup>`
- El comportamiento de `watch` es diferente (requiere fuente explícita frente a los watchers de cadena de la Options API)
- `computed` devuelve un ref, no un valor simple

## Estrategia de migración

El enfoque recomendado es incremental, no una reescritura total:

1. **Nuxt Bridge primero**: instala `@nuxt/bridge` en tu proyecto Nuxt 2. Esto te da el runtime de Vue 3 con las APIs de Nuxt 3 (`useFetch`, `useState`, `defineNuxtPlugin`) manteniendo el código existente funcionando.

2. **Migrar la gestión de estado**: de Vuex a Pinia. Esto puede hacerse mientras se sigue en Bridge.

3. **Migrar componentes de forma incremental**: convierte de la Options API a `<script setup>` un componente a la vez. Ambos estilos funcionan en paralelo.

4. **Migrar la obtención de datos**: reemplaza `asyncData`/`fetch` por `useFetch`/`useAsyncData`.

5. **Migrar middleware y plugins**: reemplaza los patrones de `context` por composables.

6. **Migrar módulos**: reescribe con `@nuxt/kit` si tienes módulos propios.

7. **Eliminar Bridge**: cambia a Nuxt 3 completo, actualiza `nuxt.config.ts`, ejecuta el pase de pruebas final.

8. **Eliminar APIs obsoletas**: `$listeners`, el bus de eventos `$on`/`$off`, los filtros, `$set`/`$delete`.

Las pruebas en cada paso son fundamentales. Añade tests end-to-end para los flujos críticos antes de empezar la migración, para tener una red de seguridad.

Ver también: [¿Cuáles son las diferencias entre Nuxt 2 y Nuxt 3?](/es/q/nuxt2-vs-nuxt3) · [¿Cómo funcionan los auto-imports en Nuxt?](/es/q/nuxt-auto-imports) · [¿Cómo funciona el data fetching en Nuxt?](/es/q/nuxt-data-fetching)

## Referencias

- [Nuxt 2 to Nuxt 3 Migration](https://nuxt.com/docs/migration/overview) - Nuxt docs
- [Nuxt Bridge](https://nuxt.com/docs/bridge/overview) - Nuxt docs
- [Configuration](https://nuxt.com/docs/migration/configuration) - Nuxt docs
