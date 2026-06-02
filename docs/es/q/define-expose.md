---
order: 56
title: "¿Qué es defineExpose y cuándo es necesario?"
difficulty: "intermediate"
tags: ["composition-api", "components"]
summary: "Los componentes con script setup están cerrados por defecto. defineExpose expone explícitamente propiedades y métodos a las template refs del padre."
---

Los componentes que usan [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html) están cerrados por defecto. Un padre que obtiene una template ref a un componente hijo recibe un objeto vacío a menos que el hijo exponga explícitamente propiedades con [`defineExpose`](https://vuejs.org/api/sfc-script-setup.html#defineexpose). Este es un cambio deliberado respecto a la [Options API](https://vuejs.org/guide/introduction.html#options-api), donde `this.$refs.child` daba acceso completo a toda la instancia.

## El problema

```vue
<!-- Counter.vue -->
<script setup>
import { ref } from 'vue'

const count = ref(0)
function reset() { count.value = 0 }
</script>

<template>
  <span>{{ count }}</span>
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import { useTemplateRef, onMounted } from 'vue'
const counterRef = useTemplateRef('counter')

onMounted(() => {
  console.log(counterRef.value.count) // undefined
  counterRef.value.reset()            // TypeError: not a function
})
</script>

<template>
  <Counter ref="counter" />
</template>
```

El padre ve `{}` porque no se expuso nada.

## La solución

```vue
<!-- Counter.vue -->
<script setup>
import { ref } from 'vue'

const count = ref(0)
const internalState = ref('private')

function reset() { count.value = 0 }

defineExpose({ count, reset })
// internalState permanece privado
</script>
```

Ahora el padre puede acceder a `count` y `reset()`, pero no a `internalState`. Tú controlas la API pública de forma explícita.

## Caso de uso habitual: envolver elementos nativos

Los wrappers de input suelen exponer métodos imperativos como `focus` y `blur`:

```vue
<!-- BaseInput.vue -->
<script setup>
import { ref } from 'vue'

const inputEl = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => inputEl.value?.focus(),
  blur: () => inputEl.value?.blur()
})
</script>

<template>
  <input ref="inputEl" v-bind="$attrs" />
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import { useTemplateRef } from 'vue'

const input = useTemplateRef('search')

function openSearch() {
  input.value?.focus()
}
</script>

<template>
  <BaseInput ref="search" placeholder="Search..." />
  <button @click="openSearch">Search</button>
</template>
```

## Cuándo usar defineExpose

| Situación | ¿Usar defineExpose? |
|---|---|
| El padre necesita llamar a métodos imperativos (focus, reset, validate) | Sí |
| El padre necesita leer el estado del hijo para coordinarse | Sí, pero considera si props/emit es mejor |
| Flujo de datos normal padre-hijo | No, usa props y emit |
| Una librería de formularios necesita llamar a validate() en los inputs hijo | Sí |

Las refs de componentes crean un acoplamiento estrecho. Prefiere props y emit para el flujo de datos, y reserva `defineExpose` para acciones genuinamente imperativas que no encajan en un patrón declarativo.

Ver también: [¿Cómo funcionan los template refs?](/es/q/template-refs) · [¿Cuáles son todas las macros del compilador en Vue?](/es/q/compiler-macros)

## Referencias

- [defineExpose](https://vuejs.org/api/sfc-script-setup.html#defineexpose) - Vue.js docs
- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [script setup](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
