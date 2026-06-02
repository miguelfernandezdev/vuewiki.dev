---
order: 84
title: "¿Qué es el problema de identidad del proxy en reactividad?"
difficulty: "advanced"
tags: ["reactivity"]
summary: "reactive() devuelve un Proxy, no el objeto original. === entre Proxy y original siempre es false — usa toRaw() para comparaciones de identidad."
---

[reactive()](https://vuejs.org/api/reactivity-core.html#reactive) devuelve un [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), no el objeto original. El Proxy y el original tienen identidades distintas, por lo que las comparaciones con `===` entre ellos siempre devuelven `false`. Esto provoca bugs silenciosos en lógica de selección, operaciones con Set/Map y cualquier código que dependa de la identidad del objeto.

## El problema

```ts
import { reactive } from 'vue'

const original = { id: 1, name: 'Item' }
const state = reactive(original)

console.log(state === original) // false — identidades distintas
```

Esto se convierte en un problema real cuando intentas buscar, seleccionar o comparar objetos reactivos:

```ts
const items = reactive([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' }
])

const selected = items[0]

// Esto puede fallar dependiendo del caché del proxy
if (items[0] === selected) {
  // poco fiable
}

// Dos wrappers reactivos de datos "iguales" nunca son ===
const listA = reactive([{ id: 1 }])
const listB = reactive([{ id: 1 }])
console.log(listA[0] === listB[0]) // false
```

## Solución 1: comparar por ID (preferida)

Usar identificadores primitivos en lugar de identidad de objeto. Es el enfoque más fiable:

```ts
const items = reactive([
  { id: 'uuid-1', name: 'Apple' },
  { id: 'uuid-2', name: 'Banana' }
])

const selectedId = ref<string | null>(null)

function selectItem(item: { id: string }) {
  selectedId.value = item.id
}

function isSelected(item: { id: string }) {
  return selectedId.value === item.id
}

// Set/Map: usar IDs como claves, no objetos
const selectedIds = reactive(new Set<string>())
selectedIds.add(item.id)
selectedIds.has(item.id) // fiable
```

## Solución 2: toRaw para comparación de identidad

Cuando realmente se necesita comparar identidad de objeto, desenvolver ambos lados:

```ts
import { reactive, toRaw, isReactive } from 'vue'

const original = { id: 1 }
const state = reactive(original)

console.log(toRaw(state) === original) // true

// Función de utilidad general
function sameObject(a: unknown, b: unknown) {
  const rawA = isReactive(a) ? toRaw(a) : a
  const rawB = isReactive(b) ? toRaw(b) : b
  return rawA === rawB
}
```

## Otros lugares donde esto da problemas

**Set y Map con objetos reactivos:**

```ts
const set = new Set()
const obj = reactive({ id: 1 })

set.add(obj)
set.has(obj)      // true (mismo proxy)
set.has(toRaw(obj)) // false (identidad diferente)
```

**Métodos de array:**

```ts
const items = reactive([{ id: 1 }, { id: 2 }])
const target = items[0]

// Funciona (mismo proxy de la misma fuente reactiva)
items.indexOf(target) // 0

// Falla si target vino de un wrapper reactivo distinto
const copy = reactive([...items])
copy.indexOf(target) // -1
```

## Regla general

Nunca depender de `===` entre objetos reactivos para la lógica de la aplicación. Comparar siempre por una clave primitiva única (ID, slug, índice). Reservar [toRaw](https://vuejs.org/api/reactivity-advanced.html#toraw) para casos excepcionales donde se controlan ambos lados de la comparación.

Ver también: [¿Rompe la reactividad reasignar una propiedad en un objeto reactive?](/es/q/reactive-property-reassignment) · [¿Cuándo deberías usar markRaw y toRaw?](/es/q/markraw-toraw)

## Referencias

- [reactive() — Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
- [toRaw() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#toraw)
- [Proxy — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
