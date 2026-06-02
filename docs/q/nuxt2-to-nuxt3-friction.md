---
order: 166
title: "What are the main friction points when migrating Nuxt 2 to Nuxt 3?"
difficulty: "advanced"
tags: ["nuxt", "migration", "pinia", "vueuse", "vuex", "provide-inject"]
---

There are four axes of friction: state management (Vuex to Pinia requires rethinking data flow, not just syntax), data fetching (asyncData/fetch to composables), the ecosystem (third-party libraries without Vue 3 support), and the Composition API shift (team conventions, losing `this`, new reactivity gotchas). The migration should be incremental, ideally using Nuxt Bridge as a stepping stone.

## 1. Vuex to Pinia

This is not a find-and-replace. The entire mental model changes:

```ts
// Nuxt 2: Vuex with mutations, namespaced modules
// store/user.js
export const state = () => ({ user: null })
export const mutations = {
  SET_USER(state, user) { state.user = user }
}
export const actions = {
  async fetchUser({ commit }, id) {
    const user = await this.$axios.$get(`/users/${id}`)
    commit('SET_USER', user)
  }
}
```

```ts
// Nuxt 3: Pinia store
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)

  async function fetchUser(id: number) {
    user.value = await $fetch(`/api/users/${id}`)
  }

  return { user, fetchUser }
})
```

What changes:
- Mutations are gone. Actions modify state directly.
- Namespaced modules become independent stores that import each other.
- `this.$store.dispatch('user/fetchUser', id)` becomes `useUserStore().fetchUser(id)`.
- String-based action names become typed function calls.
- The store is no longer a global singleton with a rigid structure, it's a composable.

The friction is organizational: every component that uses `this.$store` or `mapState`/`mapGetters` needs rewriting.

## 2. Data fetching

Every data-fetching pattern changes:

```ts
// Nuxt 2: asyncData receives a context object
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
<!-- Nuxt 3: composables in script setup -->
<script setup>
const route = useRoute()
const { data: user, error } = await useFetch(`/api/users/${route.params.id}`)
</script>
```

What changes:
- `asyncData` and `fetch` (the Nuxt 2 component option) don't exist.
- The `context` object (`{ $axios, store, redirect, error }`) is gone. Each capability is now a separate composable (`useRoute`, `useRouter`, `navigateTo`, `useFetch`).
- `$axios` is typically replaced by `$fetch` (built into Nuxt 3 via ofetch).
- Error handling uses `createError` or the `error` ref from `useFetch`.

## 3. Middleware

```ts
// Nuxt 2: context-based
export default function ({ store, redirect }) {
  if (!store.state.auth.loggedIn) {
    redirect('/login')
  }
}
```

```ts
// Nuxt 3: composable-based
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useAuth()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
```

The `context` parameter disappears entirely. You use composables instead. `redirect()` becomes `navigateTo()`. Server middleware is now a separate concept in `server/middleware/`.

## 4. Plugins

```ts
// Nuxt 2: inject into context
export default function ({ app }, inject) {
  inject('analytics', new Analytics())
}
// Usage: this.$analytics.track(...)
```

```ts
// Nuxt 3: provide through nuxtApp
export default defineNuxtPlugin((nuxtApp) => {
  const analytics = new Analytics()
  nuxtApp.provide('analytics', analytics)
})
// Usage: const { $analytics } = useNuxtApp()
```

Every plugin that used `inject` needs rewriting. Components that accessed injected values through `this.$something` now use `useNuxtApp()`.

## 5. Third-party ecosystem

Many Vue 2 / Nuxt 2 libraries didn't survive the transition:

| Library | Status |
|---|---|
| `vue-class-component` | Dead, no Vue 3 equivalent |
| `vue-property-decorator` | Dead |
| `vuetify@2` | Vuetify 3 exists but the migration took years |
| `@nuxtjs/axios` | Replaced by built-in `$fetch` |
| `@nuxtjs/auth` | No official Nuxt 3 version, use `sidebase/nuxt-auth` or build custom |
| `nuxt-community` modules | Some migrated, many abandoned |

You need to audit every dependency early. Some have Nuxt 3 equivalents, some need replacement, some need custom reimplementation.

## 6. Composition API reactivity gotchas

Developers coming from Options API hit new issues:

- Forgetting `.value` on refs (the most common mistake)
- Destructuring `reactive()` objects loses reactivity (need `toRefs()`)
- `this` doesn't exist in `<script setup>`
- `watch` behavior differs (explicit source required vs Options API string watchers)
- `computed` returns a ref, not a plain value

## Migration strategy

The recommended approach is incremental, not a big-bang rewrite:

1. **Nuxt Bridge first**: install `@nuxt/bridge` in your Nuxt 2 project. This gives you Vue 3 runtime with Nuxt 3 APIs (`useFetch`, `useState`, `defineNuxtPlugin`) while keeping your existing code running.

2. **Migrate state management**: Vuex to Pinia. This can happen while still on Bridge.

3. **Migrate components incrementally**: convert from Options API to `<script setup>` one component at a time. Both styles work side by side.

4. **Migrate data fetching**: replace `asyncData`/`fetch` with `useFetch`/`useAsyncData`.

5. **Migrate middleware and plugins**: replace `context` patterns with composables.

6. **Migrate modules**: rewrite with `@nuxt/kit` if you have custom modules.

7. **Remove Bridge**: switch to full Nuxt 3, update `nuxt.config.ts`, run final test pass.

8. **Remove deprecated APIs**: `$listeners`, `$on`/`$off` event bus, filters, `$set`/`$delete`.

Testing at every step is critical. Add e2e tests for critical flows before starting the migration so you have a safety net.

See also: [What are the differences between Nuxt 2 and Nuxt 3?](/q/nuxt2-vs-nuxt3) · [How do auto-imports work in Nuxt?](/q/nuxt-auto-imports) · [How does data fetching work in Nuxt?](/q/nuxt-data-fetching)

## References

- [Nuxt 2 to Nuxt 3 Migration](https://nuxt.com/docs/migration/overview) - Nuxt docs
- [Nuxt Bridge](https://nuxt.com/docs/bridge/overview) - Nuxt docs
- [Configuration](https://nuxt.com/docs/migration/configuration) - Nuxt docs
