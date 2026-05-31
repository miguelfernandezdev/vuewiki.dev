---
order: 26
title: "¿Cuál es la diferencia entre computed y watch?"
difficulty: "advanced"
tags: ["reactivity", "composition-api"]
---

| | `computed` | `watch` |
|---|---|---|
| **Propósito** | Derivar un valor | Ejecutar efectos secundarios |
| **Retorna** | Sí, devuelve un valor | No |
| **Caché** | Sí (recalcula solo si cambian las dependencias) | No |
| **Timing** | Síncrono, lazy | Puede ser asíncrono |
| **Ejemplo** | `fullName = computed(() => first + last)` | `watch(route, () => fetchData())` |

**Regla:** Si necesitas un valor derivado → `computed`. Si necesitas HACER algo cuando cambia un valor (llamada a la API, localStorage, logging) → `watch`.
