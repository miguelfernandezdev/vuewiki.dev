---
order: 11
title: "¿Cuál es la diferencia entre watch y watchEffect?"
difficulty: "intermediate"
tags: ["reactivity", "composition-api"]
---

- **[`watch`](https://vuejs.org/api/reactivity-core.html#watch)**: observa fuentes específicas. Recibe los valores anterior y nuevo. Solo se ejecuta cuando cambian las fuentes explícitas.
- **[`watchEffect`](https://vuejs.org/api/reactivity-core.html#watcheffect)**: detecta dependencias automáticamente. Se ejecuta de forma inmediata y vuelve a ejecutarse cuando cambia cualquier dependencia reactiva.

```ts
// watch: explícito
watch(count, (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`)
})

// watch: múltiples fuentes
watch([firstName, lastName], ([newFirst, newLast]) => {
  console.log(`${newFirst} ${newLast}`)
})

// watchEffect: seguimiento automático
watchEffect(() => {
  // Se vuelve a ejecutar automáticamente cuando count.value cambia
  console.log(`count is ${count.value}`)
})
```

**Cuándo usar cada uno:**

- `watch` cuando necesitas el valor anterior, o cuando necesitas controlar exactamente qué observas
- `watchEffect` para efectos secundarios simples que dependen de datos reactivos

Ver también: [¿Cuál es la diferencia entre computed y watch?](/es/q/computed-vs-watch) · [¿Cuál es la diferencia entre ref y reactive?](/es/q/ref-vs-reactive)

## Referencias

- [watch](https://vuejs.org/api/reactivity-core.html#watch) - Vue.js docs
- [watchEffect](https://vuejs.org/api/reactivity-core.html#watcheffect) - Vue.js docs
- [Watchers](https://vuejs.org/guide/essentials/watchers.html) - Vue.js docs
