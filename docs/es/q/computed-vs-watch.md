---
order: 79
title: '¿Cuál es la diferencia entre computed y watch?'
difficulty: 'advanced'
tags: ['reactivity', 'composition-api', 'watchers']
summary: 'computed deriva un valor cacheado de datos reactivos (puro, sin efectos). watch ejecuta efectos secundarios cuando fuentes específicas cambian (APIs, DOM).'
---

Ambos reaccionan a cambios en datos reactivos, pero sirven para propósitos fundamentalmente distintos. Equivocarse lleva a estado duplicado (usar `watch` donde `computed` bastaría) o efectos secundarios inesperados (usar `computed` para cosas que no deberían ser puras).

## computed: derivar valores

Un [`computed`](https://vuejs.org/api/reactivity-core.html#computed) calcula un valor a partir de otros datos reactivos. Tiene caché, y Vue solo lo recalcula cuando sus dependencias cambian realmente. Se lee como una variable, nunca se llama como una función.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const firstName = ref('Ana')
const lastName = ref('García')

const fullName = computed(() => `${firstName.value} ${lastName.value}`)
// fullName.value === 'Ana García'
// Se recalcula solo cuando firstName o lastName cambian
</script>

<template>
  <p>{{ fullName }}</p>
</template>
```

Piensa en `computed` como una fórmula en una celda de hoja de cálculo. Celda C1 = A1 + B1. No la "ejecutas". Simplemente siempre tiene la respuesta correcta.

## watch: reaccionar a cambios

Un [`watch`](https://vuejs.org/api/reactivity-core.html#watch) ejecuta código **en respuesta** a un cambio. No devuelve un valor. Realiza efectos secundarios como llamadas a la API, manipulación del DOM, escrituras en localStorage o eventos de analítica.

```ts
import { ref, watch } from 'vue'

const searchQuery = ref('')

watch(searchQuery, async (newQuery, oldQuery) => {
  if (newQuery.length < 3) return
  const results = await fetch(`/api/search?q=${newQuery}`)
  // Actualizar resultados, registrar analítica, etc.
})
```

Recibes tanto el valor nuevo como el anterior, y puedes hacer trabajo asíncrono dentro. Un `computed` no puede hacer ninguna de las dos cosas.

## La regla de decisión

Pregúntate: **"¿Estoy calculando un valor o haciendo algo?"**

| Pregunta                                                              | Respuesta | Usar       |
| --------------------------------------------------------------------- | --------- | ---------- |
| ¿Necesito un valor derivado en la plantilla?                          | Sí        | `computed` |
| ¿Necesito obtener datos cuando algo cambia?                           | Sí        | `watch`    |
| ¿Necesito el valor anterior?                                          | Sí        | `watch`    |
| ¿Necesito escribir en localStorage/cookies?                           | Sí        | `watch`    |
| ¿Puede el resultado expresarse como una función pura de las entradas? | Sí        | `computed` |

## El error más común

Usar `watch` + `ref` para hacer lo que `computed` hace de forma gratuita:

```ts
// ❌ Sincronización manual con watch — estado duplicado, fácil de desincronizar
const items = ref<Item[]>([])
const activeCount = ref(0)

watch(
  items,
  (val) => {
    activeCount.value = val.filter((i) => i.active).length
  },
  { deep: true }
)

// ✅ Usa computed — siempre sincronizado, con caché, sin estado extra
const activeCount = computed(() => items.value.filter((i) => i.active).length)
```

Si te encuentras escribiendo un `watch` que asigna un `ref` a un valor derivado, reemplázalo con un `computed`.

Ver también: [¿Cuál es la diferencia entre watch y watchEffect?](/es/q/watch-vs-watcheffect) · [¿Cuál es la diferencia entre ref y reactive?](/es/q/ref-vs-reactive)

## Referencias

- [Computed Properties](https://vuejs.org/guide/essentials/computed.html) - Vue.js docs
- [Watchers](https://vuejs.org/guide/essentials/watchers.html) - Vue.js docs
- [computed()](https://vuejs.org/api/reactivity-core.html#computed) - Vue.js docs
- [watch()](https://vuejs.org/api/reactivity-core.html#watch) - Vue.js docs
