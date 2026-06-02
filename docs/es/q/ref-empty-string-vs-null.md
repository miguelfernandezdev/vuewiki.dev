---
order: 151
title: "¿Por qué inicializar un ref de búsqueda con '' en lugar de null?"
difficulty: "beginner"
tags: ["reactivity", "errors"]
---

Cuando se enlaza un [ref](https://vuejs.org/api/reactivity-core.html#ref) a un input con [v-model](https://vuejs.org/guide/components/v-model.html), el input siempre produce un string. Si se inicializa el ref como `null`, el tipo es `Ref<string | null>` y cada consumidor necesita comprobar si es null. Si se inicializa como `''` (string vacío), el tipo es `Ref<string>`, que coincide con lo que produce el input. Sin comprobaciones de null, sin type narrowing, sin casos extremos.

## El problema con null

```vue
<script setup>
const search = ref<string | null>(null)
</script>

<template>
  <input v-model="search" placeholder="Search..." />
</template>
```

En el momento en que el usuario escribe algo, `search` se convierte en un string. Pero antes de que el usuario interactúe, es `null`. Cada computed o watcher que lo use debe gestionar ambos casos:

```ts
// Hay que gestionar null en todas partes
const filtered = computed(() => {
  if (search.value === null) return items.value
  return items.value.filter(i => i.name.includes(search.value!))
  //                                                        ^ aserción de no-null necesaria
})

// O con optional chaining
const hasQuery = computed(() => (search.value?.length ?? 0) > 0)
```

## La solución: empezar con string vacío

```vue
<script setup>
const search = ref('')
</script>

<template>
  <input v-model="search" placeholder="Search..." />
</template>
```

```ts
// Limpio, sin comprobaciones de null
const filtered = computed(() => {
  if (!search.value) return items.value
  return items.value.filter(i => i.name.includes(search.value))
})

const hasQuery = computed(() => search.value.length > 0)
```

Un string vacío es falsy, por lo que `if (!search.value)` captura tanto "vacío" como "sin input" sin necesitar `=== null`.

## TypeScript queda más limpio

```ts
// Con null: el tipo es string | null
const search = ref<string | null>(null)
search.value.toLowerCase()  // Error de TS: posiblemente null
search.value!.toLowerCase() // funciona pero no es seguro

// Con string vacío: el tipo es string
const search = ref('')
search.value.toLowerCase()  // funciona, sin aserción necesaria
```

Cada llamada a `.length`, `.includes()`, `.toLowerCase()`, `.trim()` y `.startsWith()` funciona sin guardas de null.

## Lo mismo aplica a otros inputs de formulario

```ts
// Preferir valores por defecto vacíos que coincidan con el tipo de salida del input
const name = ref('')         // input de texto → string
const bio = ref('')          // textarea → string
const quantity = ref(0)      // input numérico → number
const isActive = ref(false)  // checkbox → boolean
const selected = ref('')     // select → string
const tags = ref<string[]>([]) // multi-select → array
```

Cada valor por defecto coincide con el tipo que produce el control de formulario. No se necesita `null`.

## Cuándo null SÍ es apropiado

Usar `null` cuando "sin valor" es semánticamente diferente de "vacío":

```ts
// El usuario no se ha cargado todavía (null) vs el usuario no existe (undefined)
const user = ref<User | null>(null)

// Selector de fecha: ninguna fecha seleccionada todavía
const selectedDate = ref<Date | null>(null)

// Respuesta de API que aún no ha llegado
const { data } = useFetch<Product[]>('/api/products')
// data es Ref<Product[] | null> — null significa "aún no cargado"
```

En estos casos, `null` comunica "todavía no tenemos este dato", que es diferente de un valor por defecto vacío. Pero para inputs de formulario que siempre producen un valor, empezar con la versión vacía de ese tipo.

Ver también: [¿Por qué olvidar .value con ref provoca bugs?](/es/q/ref-value-gotcha) · [¿Cuál es la diferencia entre ref y reactive?](/es/q/ref-vs-reactive)

## Referencias

- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [v-model — Vue guide](https://vuejs.org/guide/components/v-model.html)
- [Form Input Bindings — Vue guide](https://vuejs.org/guide/essentials/forms.html)
