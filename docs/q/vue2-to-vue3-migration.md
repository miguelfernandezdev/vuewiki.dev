---
order: 168
title: "How would you plan a Vue 2 to Vue 3 migration?"
difficulty: "advanced"
tags: ["migration", "pinia", "vite", "vuex", "v-model", "provide-inject"]
summary: "Use @vue/compat (compatibility build) to run Vue 2 code on Vue 3 runtime. Fix deprecation warnings incrementally — it's not a rewrite."
---

A Vue 2 to Vue 3 migration is not a rewrite — it is an incremental process. Vue 3 provides `@vue/compat` (the compatibility build), which runs your existing Vue 2 code on the Vue 3 runtime and logs deprecation warnings for every API you are using that has been removed or changed. This means you can flip the switch one day and still have a working application, then fix issues category by category over weeks or months, at your own pace.

## Phase 1: Audit

Before touching any code, you need to know what you are dealing with. A migration without an inventory is guesswork.

Go through your codebase and document:

- **Number of components** — gives you a rough size estimate for the effort ahead.
- **Mixins** — each mixin is a composable waiting to happen. Mixins were Vue 2's reuse mechanism but they hide dependencies and cause naming collisions. In Vue 3, they are discouraged in favor of composables.
- **Filters** — `{{ price | currency }}` syntax is completely removed in Vue 3. Every filter needs to become a computed property or a method.
- **Event bus usage** — if you have a global Vue instance used as `bus.$on(...)` / `bus.$off(...)`, those instance methods no longer exist. You need a replacement strategy.
- **Vuex stores** — Vuex 4 works with Vue 3 (as a bridge), but the recommended long-term move is Pinia.
- **Third-party libraries** — this is often the biggest risk. Check each library for a Vue 3-compatible version. Some popular Vue 2 libraries were abandoned and never updated.
- **Custom directives** — directive lifecycle hooks were renamed in Vue 3 (`bind` → `beforeMount`, `inserted` → `mounted`, `update` → `beforeUpdate`, `componentUpdated` → `updated`, `unbind` → `unmounted`).
- **Render functions** — the `h` function signature changed. Props are now flat (no nested `attrs`, `on`, `class` objects). In Vue 3, `h` is imported directly from Vue, not received as a parameter.

This audit gives you a real migration scope. Without it, you will discover blockers mid-migration when it is harder to recover.

## Phase 2: Preparation (still on Vue 2)

You can do a significant amount of work before switching to Vue 3 at all. This reduces the size of the compatibility build phase.

**Add TypeScript gradually.** You do not need to convert everything at once. Start with new files and the most complex existing ones. TypeScript will also catch type errors that Vue 3's stricter APIs would surface anyway.

**Extract mixins into composables.** Vue 2.7 (the final Vue 2 release) ships Composition API support. This means you can write `setup()` and composables in Vue 2.7 today. Extract each mixin into a composable and replace its usages. By the time you migrate to Vue 3, the composables are already done.

**Replace the event bus.** A global event bus is an implicit dependency that makes components hard to reason about. Before migrating:

- For parent-child communication: use `props` and `emit` (you should already be doing this).
- For cross-tree communication: use `provide`/`inject`, or a reactive state object (a Pinia store, or even a simple `reactive()` exported from a module).
- If you need a real event bus, [mitt](https://github.com/developit/mitt) is a 200-byte replacement that works in both Vue 2 and Vue 3.

**Update dependencies that have Vue 3 versions.** Do this before switching. Updating `vue-router` from v3 to v4 and `vuex` from v3 to v4 (or to Pinia) while on the compatibility build adds unnecessary cognitive load. Do it in preparation.

## Phase 3: Switch to the compatibility build

Once the preparation phase is done, install `@vue/compat` and configure your bundler to alias `vue` to it:

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

And in your main entry point:

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

`MODE: 2` tells the compat build to behave as close to Vue 2 as possible, while logging a warning every time you use a deprecated API. Your app should still run. Now open the browser console and start working through the warnings.

You can also disable compat for specific features once they are fixed, to confirm no regressions:

```ts
configureCompat({
  MODE: 2,
  FILTERS: false,         // confirmed: no filters remain
  INSTANCE_EVENT_EMITTER: false // confirmed: no $on/$off usage remains
})
```

This gives you a per-feature migration checklist enforced at runtime.

## What changes: the most impactful API removals

| Vue 2 | Vue 3 | Migration path |
| --- | --- | --- |
| Filters (`\|` pipe syntax) | Removed | Use a computed property or a utility method |
| `$on` / `$off` / `$once` | Removed | Use mitt, or provide/inject for cross-component events |
| `$listeners` | Removed | Merged into `$attrs` — use `v-bind="$attrs"` |
| `$set` / `$delete` | Removed | Proxy-based reactivity is automatic — no longer needed |
| Mixins | Discouraged | Extract into composables |
| Vuex | Optional | Pinia is the recommended replacement |
| Options API | Still supported | `<script setup>` is the recommended modern alternative |
| `Vue.extend` | Removed | Use `defineComponent` |
| `v-model` (one prop) | Multiple `v-model` bindings | Minor syntax change, backwards compatible for the basic case |

The removals that affect the most codebases in practice are filters, `$listeners`, and the event bus. Prioritize those.

## Phase 4: Remove the compatibility build

Once your browser console shows zero `[Vue warn]` messages related to compatibility, you are ready to drop `@vue/compat` entirely.

Switch back to regular `vue`:

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

After removing the compat build, run your full test suite. This is where any silent issues surface — things the compat build was silently fixing but no longer warned about. Fix failures before moving on.

At this point your application is running on standard Vue 3. You can then continue migrating components to `<script setup>` + TypeScript at your own pace, since the Options API still works in Vue 3.

## Risk areas to monitor

**Third-party libraries without Vue 3 support.** This is the most common blocker. Libraries like `vue-awesome-swiper`, older versions of `vue-i18n`, or UI component libraries that were never updated can halt a migration entirely. Always audit this in Phase 1. If a library has no Vue 3 version, you need to find a replacement before starting.

**Custom directives.** All lifecycle hook names changed. A directive that worked in Vue 2 will silently do nothing in Vue 3 if the hooks are still using the old names. The compat build warns about this, but it is easy to miss.

**Render functions.** If you have components using render functions manually, the `h` API changed significantly. In Vue 2, `h` receives nested objects (`{ attrs: {}, on: {}, class: '' }`). In Vue 3, props are flat:

```ts
// Vue 2
h('div', { attrs: { id: 'app' }, on: { click: handler } }, children)

// Vue 3
h('div', { id: 'app', onClick: handler }, children)
```

**Vuex modules with complex getters.** If you are migrating to Pinia, getter composition works differently. Pinia getters receive the store state directly and can access other stores by importing them — there is no `rootState` or `rootGetters`. Complex Vuex module trees need careful mapping.

---

See also: [What are the differences between Nuxt 2 and Nuxt 3?](/q/nuxt2-vs-nuxt3) · [What are the friction points migrating from Nuxt 2 to Nuxt 3?](/q/nuxt2-to-nuxt3-friction) · [What are common anti-patterns in large Vue codebases?](/q/vue-anti-patterns)

## References

- [Migration Guide](https://v3-migration.vuejs.org/) - Vue.js docs
- [Migration Build](https://v3-migration.vuejs.org/migration-build.html) - Vue.js docs
- [Breaking Changes](https://v3-migration.vuejs.org/breaking-changes/) - Vue.js docs
