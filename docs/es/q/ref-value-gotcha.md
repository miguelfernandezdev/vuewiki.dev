---
order: 32
title: "¿Por qué olvidar .value con ref provoca bugs?"
difficulty: "beginner"
tags: ["reactivity", "errors"]
---

Porque `ref()` envuelve tu valor dentro de un objeto. Los datos reales viven en `.value`, no en el ref en sí. Si se olvida `.value` en JavaScript, se está operando sobre el objeto envolvente, no sobre los datos.

```ts
const count = ref(0)

count++             // no hace nada útil, estás incrementando un objeto
count = 5           // reasigna la variable, pierde la reactividad por completo
console.log(count)  // "[object Object]", no 0

const items = ref([1, 2, 3])
items.push(4)       // TypeError: push is not a function
```

La forma correcta:

```ts
const count = ref(0)

count.value++             // 1
count.value = 5           // 5
console.log(count.value)  // 5

const items = ref([1, 2, 3])
items.value.push(4)       // [1, 2, 3, 4]
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
