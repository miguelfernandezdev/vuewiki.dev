---
order: 64
title: '¿Por qué olvidar .value con ref provoca bugs?'
difficulty: 'beginner'
tags: ['reactivity', 'errors']
summary: 'ref() envuelve el valor en un objeto. Accédelo via .value en script. Olvidar .value significa que operas sobre el wrapper, no sobre los datos.'
---

Porque [ref()](https://vuejs.org/api/reactivity-core.html#ref) envuelve tu valor dentro de un objeto. Los datos reales viven en `.value`, no en el ref en sí. Si se olvida `.value` en JavaScript, se está operando sobre el objeto envolvente, no sobre los datos.

```ts
const count = ref(0)

count++ // no hace nada útil, estás incrementando un objeto
count = 5 // reasigna la variable, pierde la reactividad por completo
console.log(count) // "[object Object]", no 0

const items = ref([1, 2, 3])
items.push(4) // TypeError: push is not a function
```

La forma correcta:

```ts
const count = ref(0)

count.value++ // 1
count.value = 5 // 5
console.log(count.value) // 5

const items = ref([1, 2, 3])
items.value.push(4) // [1, 2, 3, 4]
```

## La excepción en el template

En `<template>`, Vue desenvuelve los refs automáticamente. NO se escribe `.value` ahí.

```vue
<template>
  <!-- .value NO se necesita aquí -->
  <p>{{ count }}</p>
  <button @click="count++">Increment</button>
</template>
```

Esta inconsistencia (`.value` en script, sin `.value` en template) es la fuente de confusión número 1 para quienes aprenden Vue 3. TypeScript ayuda a detectarlo pronto porque los tipos no coincidirán si se olvida `.value`.

Ver también: [¿Por qué reactive() no funciona con primitivos?](/es/q/reactive-with-primitives) · [¿Cuál es la diferencia entre ref y reactive?](/es/q/ref-vs-reactive)

## Referencias

- [ref() - Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Reactivity Fundamentals - Vue guide](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Template Refs - Vue guide](https://vuejs.org/guide/essentials/template-refs.html)
