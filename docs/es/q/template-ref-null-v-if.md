---
order: 36
title: "¿Por qué mi template ref devuelve null?"
difficulty: "intermediate"
tags: ["components", "errors"]
---

Porque el elemento todavía no existe en el DOM (o ha sido eliminado por `v-if`). Los template refs apuntan a elementos DOM reales, así que si el elemento no está montado, el ref es `null`.

```vue
<script setup lang="ts">
const inputEl = ref<HTMLInputElement | null>(null)
const showInput = ref(true)

watchEffect(() => {
  inputEl.value.focus() // TypeError cuando showInput es false
})
</script>

<template>
  <input v-if="showInput" ref="inputEl" />
  <button @click="showInput = !showInput">Alternar</button>
</template>
```

Cuando `showInput` se vuelve `false`, Vue elimina el `<input>` del DOM y establece `inputEl.value` a `null`. El `watchEffect` se vuelve a ejecutar y falla.

## Cómo solucionarlo

**Opción 1:** Protege con una comprobación de null.

```ts
watchEffect(() => {
  inputEl.value?.focus()
})
```

**Opción 2:** Usa `watch` sobre el propio ref para que solo se dispare cuando aparezca el elemento.

```ts
watch(inputEl, (el) => {
  if (el) {
    el.focus()
  }
})
```

**Opción 3:** Usa `v-show` en lugar de `v-if` si necesitas acceso persistente. `v-show` mantiene el elemento en el DOM (solo lo oculta con CSS), así que el ref nunca es null.

```vue
<input v-show="showInput" ref="inputEl" />
```

**Opción 4 (Vue 3.5+):** Usa `useTemplateRef` para una API más clara.

```vue
<script setup lang="ts">
const input = useTemplateRef<HTMLInputElement>('my-input')

watchEffect(() => {
  input.value?.focus()
})
</script>

<template>
  <input v-if="showInput" ref="my-input" />
</template>
```

La comprobación de null sigue siendo necesaria, pero el tipado y el nombre son más explícitos.
