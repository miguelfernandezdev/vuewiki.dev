---
order: 69
title: "¿Cómo funciona el sistema de reactividad de Vue 3?"
difficulty: "intermediate"
tags: ["reactivity", "watchers"]
summary: "Vue 3 envuelve objetos en un Proxy que intercepta lecturas (track dependencias) y escrituras (trigger actualizaciones). Los efectos se re-ejecutan cuando cambian."
---

Cuando cambias un valor en Vue y la página se actualiza automáticamente, es el sistema de reactividad en acción.

## El mecanismo central: Proxy

Vue 3 envuelve tus objetos en un [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) de JavaScript. Un Proxy es una característica nativa del lenguaje que intercepta operaciones sobre un objeto (lecturas, escrituras, eliminaciones) y permite a Vue ejecutar código personalizado cuando ocurren.

Cuando escribes `reactive(obj)`, Vue crea un Proxy alrededor de `obj` que hace dos cosas:

1. **En lectura** (`get`): registra qué efecto (computed, watcher o render de componente) está ejecutándose en ese momento, y lo vincula a la propiedad leída. Esto se llama **tracking**.
2. **En escritura** (`set`): busca todos los efectos que dependen de la propiedad modificada y los programa para re-ejecutarse. Esto se llama **triggering**.

```ts
import { reactive, watchEffect } from 'vue'

const state = reactive({ count: 0 })

watchEffect(() => {
  console.log(state.count)
  // Vue ve esta lectura y vincula este efecto a 'count'
})

state.count++ // Vue ve esta escritura, encuentra el efecto vinculado y lo re-ejecuta
```

## Cómo funciona ref internamente

[`ref`](https://vuejs.org/api/reactivity-core.html#ref) usa el mismo mecanismo de track/trigger, pero a través de un getter/setter en `.value` en lugar de un Proxy completo. Cuando el valor dentro de un `ref` es un objeto, Vue lo envuelve automáticamente en `reactive()` para hacerlo profundamente reactivo.

```ts
const count = ref(0)
// Internamente: { get value() { track(); return 0 }, set value(v) { trigger(); ... } }

const user = ref({ name: 'Ana' })
// user.value es un proxy reactive() — user.value.name también se rastrea
```

## Por qué importa: errores comunes

El sistema basado en Proxy explica varios comportamientos que confunden a la gente:

**Desestructurar rompe la reactividad.** Cuando desestructuras un objeto `reactive`, copias los valores actuales en variables planas. Esas variables ya no están conectadas al Proxy.

```ts
const state = reactive({ count: 0 })
let { count } = state // número plano, NO reactivo
count++ // no hace nada en la UI — usa toRefs() en su lugar
```

**Reasignar un objeto reactive rompe la referencia.** El Proxy original sigue existiendo, pero tu variable ahora apunta a otro lugar.

```ts
let state = reactive({ count: 0 })
state = reactive({ count: 1 }) // nuevo Proxy, los watchers antiguos siguen observando el anterior
// Usa ref() para valores que necesitas reemplazar por completo
```

**Las variantes shallow omiten el rastreo profundo.** [shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref) y `shallowReactive` solo rastrean el primer nivel, lo cual es útil para estructuras de datos grandes donde la reactividad profunda sería costosa.

## Vue 2 vs Vue 3

Vue 2 usaba `Object.defineProperty`, que tenía limitaciones reales: no podía detectar adición ni eliminación de propiedades, no funcionaba bien con arrays de forma nativa, y requería alternativas como `Vue.set()`. El sistema basado en Proxy de Vue 3 elimina todos esos problemas.

| | Vue 2 (`Object.defineProperty`) | Vue 3 (`Proxy`) |
|---|---|---|
| Detectar propiedades nuevas | No (requería `Vue.set()`) | Sí |
| Rastreo de mutaciones en arrays | Parcialmente (solo métodos parcheados) | Completo |
| Soporte para Map/Set | No | Sí |
| Rendimiento con objetos grandes | Más lento (convierte todo al inicio) | Más rápido (lazy, bajo demanda) |

Ver también: [¿Qué es el problema de identidad del proxy en reactividad?](/es/q/proxy-identity-hazard) · [¿Por qué pierdo reactividad al desestructurar un objeto reactive?](/es/q/reactive-destructuring-gotcha)

## Referencias

- [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) - Vue.js docs
- [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) - Vue.js docs
- [reactive()](https://vuejs.org/api/reactivity-core.html#reactive) - Vue.js docs
