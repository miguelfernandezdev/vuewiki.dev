---
order: 35
title: "¿Por qué reactive() no funciona con primitivos?"
difficulty: "beginner"
tags: ["reactivity", "errors"]
---

Porque `reactive()` se construye sobre Proxies de JavaScript, y los Proxies solo pueden envolver **objetos**. Los valores primitivos (strings, números, booleanos) no son objetos, así que no hay nada que el Proxy pueda envolver.

```ts
const count = reactive(0)       // ⚠️ value cannot be made reactive: 0
const name = reactive('Vue')    // ⚠️ value cannot be made reactive: Vue
const active = reactive(true)   // ⚠️ value cannot be made reactive: true
```

Vue mostrará un aviso y devolverá el valor bruto sin ninguna reactividad. El template no se actualizará cuando estos valores cambien.

## Usar ref() en su lugar

`ref()` fue diseñado precisamente para esto. Envuelve cualquier valor (incluyendo primitivos) dentro de un objeto con una propiedad `.value`, que Vue puede registrar.

```ts
const count = ref(0)        // funciona
const name = ref('Vue')     // funciona
const active = ref(true)    // funciona

count.value++               // reactivo, dispara actualizaciones
```

## Cuándo usar cada uno

| | `ref()` | `reactive()` |
|---|---|---|
| Primitivos | Sí | No |
| Objetos | Sí (envuelve en `.value`) | Sí (acceso directo) |
| Reasignable | Sí (`count.value = newVal`) | No (pierde el proxy) |
| Necesita `.value` | En script, no en template | Nunca |

La mayoría de los equipos usa `ref()` para todo. Gestiona tanto primitivos como objetos, y la consistencia evita por completo este tipo de errores.
