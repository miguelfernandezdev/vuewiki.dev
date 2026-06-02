---
order: 26
title: "¿Cuál es la diferencia entre computed y watch?"
difficulty: "advanced"
tags: ["reactivity", "composition-api"]
---

| | [`computed`](https://vuejs.org/api/reactivity-core.html#computed) | [`watch`](https://vuejs.org/api/reactivity-core.html#watch) |
|---|---|---|
| **Propósito** | Derivar un valor | Ejecutar efectos secundarios |
| **Retorna** | Sí, devuelve un valor | No |
| **Caché** | Sí (recalcula solo si cambian las dependencias) | No |
| **Timing** | Síncrono, lazy | Puede ser asíncrono |
| **Ejemplo** | `fullName = computed(() => first + last)` | `watch(route, () => fetchData())` |

**Regla:** Si necesitas un valor derivado → `computed`. Si necesitas HACER algo cuando cambia un valor (llamada a la API, localStorage, logging) → `watch`.

Ver también: [¿Cuál es la diferencia entre watch y watchEffect?](/es/q/watch-vs-watcheffect) · [¿Cuál es la diferencia entre ref y reactive?](/es/q/ref-vs-reactive)

## Referencias

- [computed](https://vuejs.org/api/reactivity-core.html#computed) - Vue.js docs
- [watch](https://vuejs.org/api/reactivity-core.html#watch) - Vue.js docs
- [Propiedades computadas](https://vuejs.org/guide/essentials/computed.html) - Vue.js docs
- [Watchers](https://vuejs.org/guide/essentials/watchers.html) - Vue.js docs
