---
order: 28
title: '¿Por qué mi template ref devuelve null?'
difficulty: 'intermediate'
tags: ['components', 'errors', 'watchers']
summary: 'El elemento no existe en el DOM todavía (o fue eliminado por v-if). Accede a las refs en onMounted o usa un watcher para reaccionar cuando la ref esté disponible.'
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

Ver también: [¿Cómo funcionan las template refs?](/es/q/template-refs) · [¿Cómo tipar template refs en TypeScript?](/es/q/typing-template-refs)

## Referencias

- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [nextTick()](https://vuejs.org/api/general.html#nexttick) - Vue.js docs
- [v-if](https://vuejs.org/api/built-in-directives.html#v-if) - Vue.js docs
