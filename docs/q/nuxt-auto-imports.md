---
order: 148
title: "What is auto-imports in Nuxt and how does it work?"
difficulty: "beginner"
tags: ["nuxt", "tooling", "vueuse", "watchers"]
---

Nuxt automatically imports Vue APIs, Nuxt composables, your own composables, utilities, and components. You never write `import { ref } from 'vue'` or `import { useFetch } from '#app'` in a Nuxt project. Everything is available directly.

## What gets auto-imported

**Vue APIs** (ref, computed, watch, lifecycle hooks, etc.):

```vue
<script setup>
const count = ref(0)
const doubled = computed(() => count.value * 2)

watch(count, (val) => console.log(val))

onMounted(() => console.log('ready'))
</script>
```

**Nuxt composables** (useFetch, useRoute, useState, useHead, etc.):

```vue
<script setup>
const route = useRoute()
const config = useRuntimeConfig()
const { data } = await useFetch('/api/posts')

useHead({ title: 'My Page' })
useSeoMeta({ description: 'Page description' })
</script>
```

**Your composables** from `composables/`:

```ts
// composables/useAuth.ts
export function useAuth() {
  const user = useState<User | null>('user', () => null)
  const isLoggedIn = computed(() => !!user.value)
  return { user, isLoggedIn }
}
```

```vue
<script setup>
const { user, isLoggedIn } = useAuth() // no import needed
</script>
```

**Your utilities** from `utils/`:

```ts
// utils/format.ts
export function formatDate(date: Date) {
  return date.toLocaleDateString()
}
```

```vue
<script setup>
const date = formatDate(new Date()) // no import needed
</script>
```

**Components** from `components/`:

```vue
<template>
  <!-- no import needed -->
  <AppHeader />
  <BaseButton>Click</BaseButton>
</template>
```

## How components are named

Directory structure maps to component names:

```
components/
├── AppHeader.vue          → <AppHeader />
├── base/
│   └── Button.vue         → <BaseButton />
└── form/
    ├── Input.vue          → <FormInput />
    └── Select.vue         → <FormSelect />
```

The folder path becomes the prefix. You can disable this with `pathPrefix: false` in the config.

## Lazy loading components

Prefix any component with `Lazy` and it becomes code-split into its own chunk, loaded only when rendered:

```vue
<template>
  <LazyHeavyChart v-if="showChart" />
  <button @click="showChart = true">Show chart</button>
</template>
```

You don't create a separate "Lazy" version. Nuxt generates the lazy variant automatically for every component.

## File scanning rules

Only top-level files in `composables/` and `utils/` are scanned:

```
composables/
├── useAuth.ts         → auto-imported
├── useCounter.ts      → auto-imported
└── helpers/
    └── validate.ts    → NOT auto-imported
```

To include nested files, either re-export from an `index.ts` or configure scanning:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    dirs: ['composables', 'composables/**']
  }
})
```

## Server auto-imports

`server/utils/` works the same way for server routes:

```ts
// server/utils/db.ts
export function getDb() {
  return createPool(process.env.DATABASE_URL)
}

// server/api/users.get.ts — no import needed
export default defineEventHandler(() => {
  const db = getDb()
  return db.query('SELECT * FROM users')
})
```

## Auto-importing third-party libraries

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    presets: [
      {
        from: '@vueuse/core',
        imports: ['useMouse', 'useWindowSize']
      },
      {
        from: 'date-fns',
        imports: ['format', 'parseISO']
      }
    ]
  }
})
```

## Explicit imports with #imports

When you need to be explicit (tests, external files, clarity), import from `#imports`:

```ts
import { ref, useFetch, useRoute } from '#imports'
```

## Disabling auto-imports

```ts
export default defineNuxtConfig({
  imports: {
    autoImport: false // disable all auto-imports
  }
})
```

After disabling, you must import everything manually, including Vue APIs.

See also: [What is the Nuxt directory structure?](/q/nuxt-directory-structure) · [How do Nuxt modules work?](/q/nuxt-modules) · [What is a composable?](/q/what-is-a-composable)

## References

- [Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports) - Nuxt docs
- [composables/ Directory](https://nuxt.com/docs/guide/directory-structure/composables) - Nuxt docs
- [unimport](https://github.com/unjs/unimport) - GitHub
