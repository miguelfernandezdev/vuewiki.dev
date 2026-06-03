---
order: 121
title: "What is tree-shaking and how does Vue 3 support it?"
difficulty: "intermediate"
tags: ["performance", "tooling", "vite", "watchers", "v-model", "provide-inject", "suspense", "teleport"]
summary: "Bundlers remove unused exports at build time. Vue 3 uses named exports (import { ref }) so unused APIs are stripped. Vue 2's global API prevented this."
---

Tree-shaking is a build-time optimization where the bundler (Vite/Rollup, webpack) removes unused code from the final output. If you import `ref` and `computed` but never use `watch`, the bundler strips `watch` from the production build. Vue 3 was rewritten specifically to support this. Vue 2's global API (`Vue.component`, `Vue.use`, `Vue.mixin`) made everything a single import, so the bundler couldn't remove anything.

## How it works

Bundlers analyze ES module `import`/`export` statements statically. If an exported function is never imported anywhere in the dependency graph, it's "dead code" and gets removed:

```ts
// Vue exports everything as named exports
import { ref, computed } from 'vue'

// The bundler sees that ref and computed are used
// watch, watchEffect, provide, inject, etc. are NOT imported
// → they get removed from the final bundle
```

This only works with ES modules (`import`/`export`). CommonJS (`require()`) is dynamic and can't be analyzed statically, so tree-shaking doesn't apply.

## Vue 2 vs Vue 3

Vue 2 used a global singleton:

```ts
// Vue 2: everything hangs off the Vue constructor
import Vue from 'vue'

Vue.component('MyComponent', { ... })
Vue.use(VueRouter)
Vue.mixin({ ... })
Vue.directive('focus', { ... })
```

Importing `Vue` pulls in the entire runtime, including features you never use (transition, keep-alive, v-model on components, Suspense). The bundler can't know what `Vue.use(SomePlugin)` might access internally, so it keeps everything.

Vue 3 uses named exports:

```ts
// Vue 3: import only what you use
import { createApp, ref, computed, watch } from 'vue'
import { createRouter } from 'vue-router'
```

Each API is a separate export that the bundler can trace. If your app never uses `<Transition>`, the transition runtime code is removed from the build.

## Impact on bundle size

Vue 3's runtime core is approximately 10 KB gzipped when tree-shaken (a minimal app using `ref`, `computed`, and the template compiler; actual size varies by features used). Vue 2's runtime was around 23 KB gzipped regardless of which features you used (varies by version and build configuration).

The features most often removed by tree-shaking:

| Feature | Removed if unused |
|---|---|
| `<Transition>` / `<TransitionGroup>` | Yes |
| `<KeepAlive>` | Yes |
| `<Suspense>` | Yes |
| `<Teleport>` | Yes |
| `v-model` on components | Yes |
| `v-show` directive | Yes |
| Reactivity APIs (`watch`, `watchEffect`, etc.) | Yes, per function |
| Lifecycle hooks (`onMounted`, etc.) | Yes, per hook |

## What breaks tree-shaking

1. **Side effects in module scope**: code that runs on import, even if no export is used:

```ts
// This runs when the module is imported, even if nothing is used
console.log('module loaded')
window.__INIT__ = true

export function unused() { ... }
```

The bundler can't remove this module because it has side effects. Libraries mark themselves as side-effect-free in `package.json`:

```json
{
  "sideEffects": false
}
```

2. **Dynamic imports with variables**: the bundler can't resolve dynamic strings:

```ts
// BAD: bundler can't analyze this
const module = await import(`./modules/${name}.ts`)

// GOOD: explicit paths let the bundler create chunks
const module = await import('./modules/auth.ts')
```

3. **Re-exporting everything**: barrel files that export everything prevent selective removal:

```ts
// If index.ts re-exports 50 components and you import 1,
// some bundlers keep all 50 unless each is properly isolated
export * from './ComponentA.vue'
export * from './ComponentB.vue'
// ... 48 more
```

## Checking your bundle

Use `rollup-plugin-visualizer` (Vite) or `webpack-bundle-analyzer` to see what's included:

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({ open: true })
  ]
})
```

This generates an interactive treemap showing each module's size in the final bundle, making it easy to spot unused code that wasn't tree-shaken.

See also: [What is Vite?](/q/what-is-vite) · [How would you implement lazy loading and code splitting?](/q/lazy-loading-code-splitting) · [How would you optimize performance in a Vue app?](/q/performance-optimization)

## References

- [Tree-shaking](https://vuejs.org/guide/best-practices/performance.html#reduce-bundle-size) - Vue.js docs
- [Build Optimizations](https://vite.dev/guide/build.html) - Vite docs
- [Tooling](https://vuejs.org/guide/scaling-up/tooling.html) - Vue.js docs
