---
order: 82
title: "¿Cómo agrupa Vue las actualizaciones del DOM?"
difficulty: "advanced"
tags: ["reactivity", "performance"]
---

Vue no actualiza el DOM en cada cambio de estado reactivo. Agrupa todas las mutaciones síncronas dentro del mismo tick del event loop y las aplica en una única actualización del DOM. Los watchers y los [computed](https://vuejs.org/api/reactivity-core.html#computed) también se disparan una sola vez con el valor final, no con cada cambio intermedio.

## El batching en acción

```ts
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (val) => {
  console.log('count:', val)
})

function update() {
  count.value = 1
  count.value = 2
  count.value = 3
}

update()
// Se registra una vez: "count: 3"
// NO tres veces con 1, 2, 3
```

Es una optimización de rendimiento. Sin batching, un bucle que inserta 1.000 elementos en un array reactivo dispararía 1.000 re-renders. Con batching, renderiza una sola vez.

```ts
const list = reactive<number[]>([])

function addMany() {
  for (let i = 0; i < 1000; i++) {
    list.push(i)
  }
  // Un render con los 1.000 elementos, no 1.000 renders
}
```

## El timing de flush

Vue programa tres tipos de flush de efectos:

| Flush | Cuándo se ejecuta | Usado por |
|---|---|---|
| `'pre'` (por defecto para `watch` y `watchEffect`) | Antes de la actualización del DOM | La mayoría de watchers y efectos |
| `'post'` | Después de la actualización del DOM | Efectos que necesitan leer del DOM actualizado |
| `'sync'` | Inmediatamente en cada cambio | Depuración, casos extremos poco frecuentes |

```ts
// Por defecto: se dispara una vez por tick, antes de la actualización del DOM
watch(source, handler)
watchEffect(handler) // también 'pre' por defecto

// Post: se dispara una vez por tick, después de la actualización del DOM
watch(source, handler, { flush: 'post' })
watchEffect(handler, { flush: 'post' })

// Sync: se dispara en CADA cambio, sin batching
watch(source, handler, { flush: 'sync' })
```

## Forzar batches separados con nextTick

Si necesitas que los estados intermedios se procesen por separado, divídelos en diferentes ticks:

```ts
import { nextTick } from 'vue'

async function stepByStep() {
  count.value = 1
  await nextTick() // flush: el watcher se dispara con 1, el DOM se actualiza

  count.value = 2
  await nextTick() // flush: el watcher se dispara con 2, el DOM se actualiza

  count.value = 3
  // el watcher se dispara con 3 al final de este tick
}
```

## Por qué importa el batching en formularios

Al rellenar un formulario con datos guardados, la validación se ejecuta una sola vez con el estado completo en lugar de dispararse por cada campo:

```ts
const form = reactive({ email: '', password: '' })

watch(form, (data) => {
  validateForm(data)
}, { deep: true })

function loadSavedData(saved: { email: string; password: string }) {
  form.email = saved.email
  form.password = saved.password
  // La validación se ejecuta UNA SOLA VEZ con ambos campos establecidos
}
```

## flush: 'sync' (usar con precaución)

Los watchers síncronos omiten el batching y se disparan en cada cambio individual. Esto es útil para depuración, pero perjudicial para el rendimiento:

```ts
watch(count, (val) => {
  console.log('immediate:', val)
}, { flush: 'sync' })

count.value = 1 // registra: "immediate: 1"
count.value = 2 // registra: "immediate: 2"
count.value = 3 // registra: "immediate: 3"
```

Evita `flush: 'sync'` en código de producción. Si crees que lo necesitas, probablemente necesites reestructurar tu lógica.

Ver también: [¿Qué es nextTick y cuándo lo necesitas?](/es/q/nexttick) · [¿Cómo afecta la estabilidad de objetos en computed a los re-renders?](/es/q/perf-computed-object-stability)

## Referencias

- [nextTick() — Vue docs](https://vuejs.org/api/general.html#nexttick)
- [watch() — Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [watchEffect() — Vue docs](https://vuejs.org/api/reactivity-core.html#watcheffect)
