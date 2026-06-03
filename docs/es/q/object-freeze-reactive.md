---
order: 76
title: '¿Qué ocurre cuando usas Object.freeze() en datos reactivos?'
difficulty: 'intermediate'
tags: ['reactivity']
summary: 'Vue no puede hacer reactivos objetos congelados porque las traps set del Proxy fallan silenciosamente. Útil como optimización para datasets grandes de solo lectura.'
---

Vue no puede hacer reactivo un objeto congelado. `Object.freeze()` impide modificaciones de propiedades a nivel del motor de JavaScript, por lo que las trampas del [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) de Vue para `set` y `deleteProperty` fallan silenciosamente. El objeto se renderiza una vez con sus valores iniciales, pero las mutaciones no dispararán actualizaciones. Esto es útil como optimización de rendimiento para grandes conjuntos de datos que nunca cambian.

## Qué ocurre paso a paso

```vue
<script setup>
const frozenList = reactive(
  Object.freeze([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
)
</script>

<template>
  <!-- Se renderiza bien en la carga inicial -->
  <p v-for="item in frozenList" :key="item.id">
    {{ item.name }}
  </p>

  <!-- Este botón no hace nada visible -->
  <button @click="frozenList[0].name = 'Cambiado'">Intentar mutar</button>
</template>
```

<PlaygroundLink code="<script setup>
const frozenList = reactive(
  Object.freeze([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
)
</script>
&#10;<template>
  <!-- Se renderiza bien en la carga inicial -->
  <p v-for=&quot;item in frozenList&quot; :key=&quot;item.id&quot;>
    {{ item.name }}
  </p>
&#10;  <!-- Este botón no hace nada visible -->
  <button @click=&quot;frozenList[0].name = 'Cambiado'&quot;>Intentar mutar</button>
</template>" />

Al pulsar el botón, el DOM no se actualiza. En modo estricto, la mutación lanza un `TypeError`. En modo no estricto, falla silenciosamente. En cualquier caso, Vue no vuelve a renderizar.

## Por qué: Proxy vs freeze

La reactividad de Vue 3 envuelve objetos en un Proxy. El Proxy intercepta las operaciones `get` y `set` para rastrear dependencias y disparar actualizaciones. Pero `Object.freeze()` usa `Object.defineProperty` para establecer `writable: false` y `configurable: false` en cada propiedad. Cuando la trampa `set` del Proxy intenta reenviar la escritura al objeto congelado, JavaScript mismo lo bloquea:

```ts
const original = Object.freeze({ count: 0 })
const proxy = new Proxy(original, {
  set(target, key, value) {
    target[key] = value // TypeError en modo estricto
    return true
  }
})

proxy.count = 1 // falla
```

Vue detecta los objetos congelados y omite hacer reactivas sus propiedades, por eso funciona como optimización de rendimiento.

## Optimización de rendimiento para datos estáticos

Cuando tienes grandes arrays de datos de solo lectura (tablas de referencia, configuración, coordenadas de mapas), congelarlos evita la sobrecarga de crear Proxies reactivos para cada propiedad anidada:

```vue
<script setup>
import { shallowRef } from 'vue'

const countries = shallowRef(
  Object.freeze(
    await $fetch('/api/countries') // 250 objetos con propiedades anidadas
  )
)
</script>

<template>
  <select>
    <option v-for="c in countries" :key="c.code" :value="c.code">
      {{ c.name }}
    </option>
  </select>
</template>
```

<PlaygroundLink code="<script setup>
import { shallowRef } from 'vue'
&#10;const countries = shallowRef(
  Object.freeze(
    await $fetch('/api/countries') // 250 objetos con propiedades anidadas
  )
)
</script>
&#10;<template>
  <select>
    <option v-for=&quot;c in countries&quot; :key=&quot;c.code&quot; :value=&quot;c.code&quot;>
      {{ c.name }}
    </option>
  </select>
</template>" />

Combinar `shallowRef` con `Object.freeze` hace que Vue rastree el ref en sí (puedes reemplazar el array completo) pero no cree Proxies para los 250 objetos de país ni sus propiedades anidadas.

## Reemplazar datos congelados

No puedes mutar el objeto congelado, pero sí puedes reemplazar la referencia completa:

```vue
<script setup>
const data = ref(Object.freeze([1, 2, 3]))

function addItem() {
  // MAL: data.value.push(4) — falla silenciosamente o lanza error
  // BIEN: reemplaza con un nuevo array congelado
  data.value = Object.freeze([...data.value, 4])
}
</script>
```

<PlaygroundLink code="<script setup>
const data = ref(Object.freeze([1, 2, 3]))
&#10;function addItem() {
  // MAL: data.value.push(4) — falla silenciosamente o lanza error
  // BIEN: reemplaza con un nuevo array congelado
  data.value = Object.freeze([...data.value, 4])
}
</script>" />

El `.value` del ref es reasignable. Vue detecta el nuevo valor y vuelve a renderizar. El nuevo array también está congelado, así que su contenido sigue sin ser reactivo.

## markRaw como alternativa

`markRaw` le dice a Vue que nunca haga reactivo un objeto, sin la restricción de inmutabilidad de `freeze`:

```ts
import { markRaw } from 'vue'

const map = markRaw(new Map())
map.set('key', 'value') // funciona, pero Vue no lo rastrea

const chartInstance = markRaw(new Chart(canvas, config))
```

|                       | `Object.freeze`                       | `markRaw`                                       |
| --------------------- | ------------------------------------- | ----------------------------------------------- |
| Impide la reactividad | Sí                                    | Sí                                              |
| Impide la mutación    | Sí                                    | No                                              |
| Caso de uso           | Datos estáticos, tablas de referencia | Objetos de terceros (Chart.js, mapas, editores) |
| Objetos anidados      | Hay que congelar recursivamente       | Solo aplica al nivel superior                   |

Ver también: [¿Cuándo deberías usar markRaw y toRaw?](/es/q/markraw-toraw) · [¿Cuándo usarías shallowRef / shallowReactive?](/es/q/shallow-ref-reactive)

## Referencias

- [shallowRef() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#shallowref)
- [markRaw() - Vue docs](https://vuejs.org/api/reactivity-advanced.html#markraw)
- [Proxy - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
