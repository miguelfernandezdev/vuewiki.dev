---
order: 73
title: "¿Por qué ordenar un array dentro de computed muta los datos originales?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
summary: "sort(), reverse() y splice() mutan en sitio. Dentro de computed, usa spread ([...arr].sort()) o toSorted() para no mutar el origen."
---

Porque `.sort()`, `.reverse()` y `.splice()` modifican el array **en su lugar**. Dentro de un [computed](https://vuejs.org/api/reactivity-core.html#computed), estás llamando a estos métodos sobre el array fuente reactivo. La "copia ordenada" y el original acaban siendo el mismo array mutado.

```ts
const items = ref([3, 1, 4, 1, 5])

const sorted = computed(() => {
  return items.value.sort((a, b) => a - b)
  // items.value también queda ordenado, el orden original se pierde
})
```

## Cómo solucionarlo

**Opción 1:** Copia el array primero con spread.

```ts
const sorted = computed(() => {
  return [...items.value].sort((a, b) => a - b)
})
```

**Opción 2:** Usa `.slice()` para crear una copia.

```ts
const reversed = computed(() => {
  return items.value.slice().reverse()
})
```

**Opción 3 (ES2023):** Usa las versiones no mutantes.

```ts
const sorted = computed(() => items.value.toSorted((a, b) => a - b))
const reversed = computed(() => items.value.toReversed())
```

## Métodos que mutan frente a los que no mutan

| Muta el original | Devuelve un nuevo array |
|---|---|
| `sort()` | `toSorted()` |
| `reverse()` | `toReversed()` |
| `splice()` | `toSpliced()` |
| `push()` | `concat()` |

La regla general: si estás dentro de un `computed`, nunca llames a un método que cambie el array fuente. Trabaja siempre sobre una copia.

Ver también: [¿Por qué mi propiedad computed no se actualiza cuando cambia una dependencia?](/es/q/computed-conditional-dependencies) · [¿Cómo funcionan las propiedades computed con escritura?](/es/q/writable-computed)

## Referencias

- [computed() - Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [Buenas prácticas: computed - Vue guide](https://vuejs.org/guide/essentials/computed.html#best-practices)
- [Array.prototype.toSorted() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
