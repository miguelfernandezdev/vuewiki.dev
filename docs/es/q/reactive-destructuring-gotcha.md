---
order: 63
title: "¿Por qué pierdo reactividad al desestructurar un objeto reactive?"
difficulty: "beginner"
tags: ["reactivity", "errors"]
summary: "Destructurar extrae valores planos del Proxy reactivo, rompiendo la conexión reactiva. Usa toRefs() para mantener la reactividad."
---

Porque `reactive()` usa un [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) para registrar el acceso a propiedades. Al desestructurar, extraes **valores planos** fuera del proxy y la conexión reactiva desaparece.

```ts
const state = reactive({ count: 0, name: 'Vue' })

const { count, name } = state  // count ahora es solo el número 0

state.count++
console.log(count) // sigue siendo 0, se perdió la reactividad
```

Esto es especialmente peligroso al desestructurar el valor de retorno de un composable:

```ts
function useCounter() {
  const state = reactive({ count: 0 })
  return state
}

const { count } = useCounter() // número plano, no reactivo
```

## Cómo solucionarlo

**Opción 1:** Usar [toRefs](https://vuejs.org/api/reactivity-utilities.html#torefs) para convertir cada propiedad en un ref antes de desestructurar.

```ts
const state = reactive({ count: 0, name: 'Vue' })
const { count, name } = toRefs(state)

state.count++
console.log(count.value) // 1, reactividad conservada (ahora necesita .value)
```

**Opción 2:** Devolver `toRefs()` desde los composables para que los consumidores puedan desestructurar sin problemas.

```ts
function useCounter() {
  const state = reactive({ count: 0 })
  return toRefs(state)
}

const { count } = useCounter() // ref, reactividad conservada
```

**Opción 3:** Prescindir de `reactive()` y usar `ref()` para cada valor.

```ts
const count = ref(0)
const name = ref('Vue')
// No hace falta desestructurar, sin problemas
```

La mayoría de los equipos usan `ref()` para todo precisamente para evitar este problema.

Ver también: [¿Cómo funcionan toRefs, toRef y toValue?](/es/q/torefs-toref-tovalue) · [¿Por qué reactive() no funciona con primitivos?](/es/q/reactive-with-primitives)

## Referencias

- [toRefs() - Vue docs](https://vuejs.org/api/reactivity-utilities.html#torefs)
- [reactive() - Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
- [Fundamentos de reactividad - Vue guide](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
