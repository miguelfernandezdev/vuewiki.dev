---
order: 2
title: "¿Cuál es la diferencia entre ref y reactive?"
difficulty: "beginner"
tags: ["reactivity", "composition-api"]
---

- **[`ref`](https://vuejs.org/api/reactivity-core.html#ref)**: envuelve cualquier valor (primitivo u objeto). Se accede con `.value` en JS/TS, pero NO en las plantillas.
- **[`reactive`](https://vuejs.org/api/reactivity-core.html#reactive)**: solo para objetos/arrays. No necesita `.value`, pero NO PUEDES reasignar el objeto completo.

```ts
const count = ref(0)          // count.value = 1
const user = ref({ name: '' }) // user.value.name = 'Ana'

const state = reactive({ count: 0, name: '' })  // state.count = 1
// state = { count: 1, name: '' }  ❌ NO SE PUEDE reasignar
```

**Regla general:** Usa `ref` para todo (es más flexible). Usa `reactive` solo cuando tengas un objeto con varias propiedades que siempre van juntas.

Ver también: [¿Cuál es la diferencia entre computed y watch?](/es/q/computed-vs-watch) · [¿Cuál es la diferencia entre watch y watchEffect?](/es/q/watch-vs-watcheffect)

## Referencias

- [ref](https://vuejs.org/api/reactivity-core.html#ref) - Vue.js docs
- [reactive](https://vuejs.org/api/reactivity-core.html#reactive) - Vue.js docs
- [Fundamentos de la reactividad](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) - Vue.js docs
