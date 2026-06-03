---
order: 148
title: "¿Qué son los auto-imports en Nuxt y cómo funcionan?"
difficulty: "beginner"
tags: ["nuxt", "tooling", "vueuse", "watchers"]
summary: "Nuxt importa automáticamente las APIs de Vue, composables, utilidades y componentes. Nunca escribes imports para ellos."
---

Nuxt importa automáticamente las APIs de Vue, los composables de Nuxt, tus propios composables, utilidades y componentes. Nunca escribirás `import { ref } from 'vue'` ni `import { useFetch } from '#app'` en un proyecto Nuxt. Todo está disponible directamente.

## Qué se importa automáticamente

**APIs de Vue** (ref, computed, watch, lifecycle hooks, etc.):

```vue
<script setup>
const count = ref(0)
const doubled = computed(() => count.value * 2)

watch(count, (val) => console.log(val))

onMounted(() => console.log('listo'))
</script>
```

**Composables de Nuxt** (useFetch, useRoute, useState, useHead, etc.):

```vue
<script setup>
const route = useRoute()
const config = useRuntimeConfig()
const { data } = await useFetch('/api/posts')

useHead({ title: 'Mi página' })
useSeoMeta({ description: 'Descripción de la página' })
</script>
```

**Tus composables** de `composables/`:

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
const { user, isLoggedIn } = useAuth() // sin import necesario
</script>
```

**Tus utilidades** de `utils/`:

```ts
// utils/format.ts
export function formatDate(date: Date) {
  return date.toLocaleDateString()
}
```

```vue
<script setup>
const date = formatDate(new Date()) // sin import necesario
</script>
```

**Componentes** de `components/`:

```vue
<template>
  <!-- sin import necesario -->
  <AppHeader />
  <BaseButton>Click</BaseButton>
</template>
```

## Cómo se nombran los componentes

La estructura de directorios se mapea a nombres de componentes:

```
components/
├── AppHeader.vue          → <AppHeader />
├── base/
│   └── Button.vue         → <BaseButton />
└── form/
    ├── Input.vue          → <FormInput />
    └── Select.vue         → <FormSelect />
```

La ruta de la carpeta se convierte en el prefijo. Puedes desactivarlo con `pathPrefix: false` en la configuración.

## Carga diferida de componentes

Añade el prefijo `Lazy` a cualquier componente y se convierte en un chunk separado, cargado solo cuando se renderiza:

```vue
<template>
  <LazyHeavyChart v-if="showChart" />
  <button @click="showChart = true">Mostrar gráfico</button>
</template>
```

No necesitas crear una versión "Lazy" separada. Nuxt genera la variante lazy automáticamente para cada componente.

## Reglas de escaneo de archivos

Solo los archivos del nivel superior de `composables/` y `utils/` se escanean:

```
composables/
├── useAuth.ts         → importado automáticamente
├── useCounter.ts      → importado automáticamente
└── helpers/
    └── validate.ts    → NO importado automáticamente
```

Para incluir archivos anidados, reexporta desde un `index.ts` o configura el escaneo:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    dirs: ['composables', 'composables/**']
  }
})
```

## Auto-imports en el servidor

`server/utils/` funciona igual para las rutas del servidor:

```ts
// server/utils/db.ts
export function getDb() {
  return createPool(process.env.DATABASE_URL)
}

// server/api/users.get.ts — sin import necesario
export default defineEventHandler(() => {
  const db = getDb()
  return db.query('SELECT * FROM users')
})
```

## Auto-importar librerías de terceros

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

## Imports explícitos con #imports

Cuando necesitas ser explícito (tests, archivos externos, claridad), importa desde `#imports`:

```ts
import { ref, useFetch, useRoute } from '#imports'
```

## Desactivar los auto-imports

```ts
export default defineNuxtConfig({
  imports: {
    autoImport: false // desactiva todos los auto-imports
  }
})
```

Tras desactivarlo, debes importar todo manualmente, incluidas las APIs de Vue.

Ver también: [¿Cuál es la convención de estructura de directorios de Nuxt?](/es/q/nuxt-directory-structure) · [¿Cómo funcionan los módulos de Nuxt?](/es/q/nuxt-modules) · [¿Qué es un composable?](/es/q/what-is-a-composable)

## Referencias

- [Auto-imports](https://nuxt.com/docs/guide/concepts/auto-imports) - Nuxt docs
- [composables/ Directory](https://nuxt.com/docs/guide/directory-structure/composables) - Nuxt docs
- [unimport](https://github.com/unjs/unimport) - GitHub
