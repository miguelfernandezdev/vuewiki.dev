---
order: 82
title: '¿Cómo funcionan toRefs, toRef y toValue?'
difficulty: 'advanced'
tags: ['reactivity', 'vueuse', 'watchers']
summary: 'toRefs convierte cada propiedad reactiva en una ref (destructuring seguro). toRef crea una ref vinculada a una propiedad. toValue desenvuelve refs/getters.'
---

Estas tres utilidades resuelven el problema de convertir entre los tipos reactivos de Vue. Son más útiles al desestructurar objetos reactivos, escribir composables que aceptan entradas flexibles, o hacer de puente entre `reactive()` y `ref()`. Consulta [toRefs](https://vuejs.org/api/reactivity-utilities.html#torefs), [toRef](https://vuejs.org/api/reactivity-utilities.html#toref) y [unref](https://vuejs.org/api/reactivity-utilities.html#unref) en la documentación.

## toRefs: desestructurar reactive sin perder la reactividad

Los objetos `reactive()` pierden la reactividad al desestructurarse. `toRefs` convierte cada propiedad en un ref individual que permanece conectado a la fuente:

```ts
import { reactive, toRefs } from 'vue'

const state = reactive({ count: 0, name: 'Ana' })

// Mal: pierde la reactividad
const { count, name } = state
count++ // no actualiza state.count

// Bien: cada propiedad se convierte en un ref
const { count, name } = toRefs(state)
count.value++ // actualiza state.count
```

Esto es imprescindible al devolver estado reactivo desde composables, para que los consumidores puedan desestructurar:

```ts
function useCounter() {
  const state = reactive({ count: 0, doubled: computed(() => state.count * 2) })

  function increment() {
    state.count++
  }

  return { ...toRefs(state), increment }
}

// El consumidor puede desestructurar sin problema
const { count, doubled, increment } = useCounter()
```

## toRef: ref de una propiedad individual

`toRef` crea un ref para una propiedad de un objeto reactivo. A diferencia de `toRefs`, funciona incluso si la propiedad no existe todavía:

```ts
import { reactive, toRef } from 'vue'

const state = reactive({ count: 0 })

const countRef = toRef(state, 'count')
countRef.value++ // actualiza state.count

// También funciona con props
const props = defineProps<{ name: string }>()
const nameRef = toRef(props, 'name')
```

Desde Vue 3.3, `toRef` también acepta una función getter:

```ts
const countRef = toRef(() => state.count)
// Ref de solo lectura que rastrea el getter
```

## toValue: normalizar cualquier entrada reactiva (Vue 3.3+)

`toValue` desenvuelve refs, llama funciones getter y pasa los valores planos sin modificarlos. Está diseñado para composables que aceptan entradas flexibles:

```ts
import { toValue } from 'vue'

toValue(ref(1)) // 1
toValue(() => 2) // 2
toValue(3) // 3
```

El caso de uso principal son composables que aceptan un ref, un getter o un valor plano:

```ts
import { toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    document.title = toValue(title)
  })
}

// Los tres funcionan:
useTitle('Título estático')
useTitle(titleRef)
useTitle(() => `${page.value} - Mi App`)
```

## Referencia rápida

| Utilidad            | Entrada                   | Salida              | Caso de uso                                  |
| ------------------- | ------------------------- | ------------------- | -------------------------------------------- |
| `toRefs(obj)`       | Objeto `reactive`         | Objeto de refs      | Desestructurar sin perder reactividad        |
| `toRef(obj, 'key')` | Objeto `reactive` + clave | Ref individual      | Una propiedad como ref                       |
| `toRef(() => val)`  | Función getter            | Ref de solo lectura | Envolver un getter como ref (3.3+)           |
| `toValue(input)`    | Ref, getter o valor plano | Valor desenvuelto   | Normalizar entradas flexibles en composables |

## Patrón habitual: composable con MaybeRefOrGetter

```ts
import { toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

function useFetch(url: MaybeRefOrGetter<string>) {
  const data = ref(null)
  const error = ref(null)

  async function fetchData() {
    try {
      const response = await fetch(toValue(url))
      data.value = await response.json()
    } catch (e) {
      error.value = e
    }
  }

  watch(() => toValue(url), fetchData, { immediate: true })

  return { data, error }
}

// Funciona con todos los tipos de entrada:
useFetch('/api/users')
useFetch(urlRef)
useFetch(() => `/api/users/${id.value}`)
```

Ver también: [¿Por qué desestructurar un reactive hace perder la reactividad?](/es/q/reactive-destructuring-gotcha) · [¿Cuál es la diferencia entre ref y reactive?](/es/q/ref-vs-reactive)

## Referencias

- [toRefs() - Vue docs](https://vuejs.org/api/reactivity-utilities.html#torefs)
- [toRef() - Vue docs](https://vuejs.org/api/reactivity-utilities.html#toref)
- [Composables guide - Vue docs](https://vuejs.org/guide/reusability/composables.html)
