---
order: 127
title: "¿Cómo afecta la estabilidad de objetos en computed a los re-renders?"
difficulty: "advanced"
tags: ["performance", "reactivity", "watchers"]
summary: "Un computed que devuelve un nuevo objeto cada vez dispara todos los dependientes aunque los valores sean iguales. Compara manualmente o devuelve primitivos."
---

Una propiedad [computed](https://vuejs.org/api/reactivity-core.html#computed) que devuelve un objeto nuevo en cada evaluación crea una nueva referencia en cada ejecución. Vue detecta la nueva referencia y dispara cada watcher, efecto y componente hijo que dependa de ella, aunque los valores dentro del objeto sean idénticos. Para primitivos, Vue 3.4+ lo gestiona automáticamente. Para objetos, hay que comparar de forma manual.

## El problema

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue'

const count = ref(0)

const stats = computed(() => {
  return {
    isEven: count.value % 2 === 0,
    doubled: count.value * 2
  }
})

watchEffect(() => {
  console.log('Stats changed:', stats.value)
})
</script>
```

Cada vez que `count` cambia, `stats` devuelve un objeto completamente nuevo. Vue compara por referencia (`===`), detecta un objeto diferente y ejecuta el efecto. Si `count` pasa de 0 a 2 a 4, `isEven` es `true` las tres veces, pero el efecto se dispara en cada cambio porque la referencia del objeto es nueva.

## Estabilidad de primitivos (Vue 3.4+)

Vue 3.4 introdujo estabilidad automática para propiedades computed que devuelven primitivos:

```js
const count = ref(0)

const isEven = computed(() => count.value % 2 === 0)

watchEffect(() => console.log(isEven.value))  // true

count.value = 2  // isEven sigue siendo true → el efecto NO se ejecuta
count.value = 4  // isEven sigue siendo true → el efecto NO se ejecuta
count.value = 3  // isEven ahora es false → el efecto se ejecuta
```

Vue comprueba `oldValue === newValue` internamente. Si el primitivo no ha cambiado, los dependientes no se vuelven a ejecutar. Esto solo funciona con primitivos porque `{} === {}` siempre es `false`.

## Comparación manual para objetos

Vue 3.4+ pasa el valor anterior como primer argumento al getter del computed:

```vue
<script setup>
import { ref, computed, watchEffect } from 'vue'

const count = ref(0)

const stats = computed((oldValue) => {
  const newValue = {
    isEven: count.value % 2 === 0,
    category: count.value < 10 ? 'small' : 'large'
  }

  if (
    oldValue &&
    oldValue.isEven === newValue.isEven &&
    oldValue.category === newValue.category
  ) {
    return oldValue
  }

  return newValue
})

watchEffect(() => {
  console.log('Stats changed:', stats.value)
  // Solo se ejecuta cuando isEven o category cambian de verdad
})
</script>
```

Devolver la referencia antigua le indica a Vue que no hubo cambios. No se disparan watchers ni se re-renderizan componentes hijos.

## Calcular siempre antes de comparar

La comparación debe hacerse DESPUÉS del cálculo completo, no antes. Si se devuelve antes de tiempo, Vue no registrará las dependencias reactivas accedidas durante el cálculo:

```js
// MAL: el retorno anticipado omite el seguimiento de dependencias
const result = computed((oldValue) => {
  if (oldValue && someCondition) {
    return oldValue // count.value nunca se accede → Vue pierde la dependencia
  }
  return { doubled: count.value * 2 }
})

// BIEN: calcular primero, luego comparar
const result = computed((oldValue) => {
  const newValue = { doubled: count.value * 2 } // dependencia registrada
  if (oldValue && oldValue.doubled === newValue.doubled) {
    return oldValue
  }
  return newValue
})
```

Vue registra las dependencias durante la ejecución. Si la ruta de código omite `count.value`, Vue no sabe que el computed depende de `count` y no lo re-evaluará cuando cambie.

## Comparación profunda para objetos complejos

Para objetos con muchas propiedades o estructuras anidadas, usar una utilidad de comparación profunda:

```js
import { ref, computed } from 'vue'
import { isEqual } from 'lodash-es'

const filters = ref({ category: 'all', sortBy: 'date', page: 1 })

const activeFilters = computed((oldValue) => {
  const newValue = {
    ...filters.value,
    hasFilters: filters.value.category !== 'all' || filters.value.sortBy !== 'date'
  }

  if (oldValue && isEqual(oldValue, newValue)) {
    return oldValue
  }

  return newValue
})
```

La comparación profunda tiene su propio coste, así que conviene usarla solo cuando los efectos posteriores son más caros que la comparación en sí.

## Cuándo dividir en primitivos

Con frecuencia la mejor optimización es no devolver un objeto:

```js
// En lugar de un computed que devuelva un objeto
const stats = computed(() => ({
  isEven: count.value % 2 === 0,
  doubled: count.value * 2
}))

// Dividir en computeds primitivos independientes
const isEven = computed(() => count.value % 2 === 0)
const doubled = computed(() => count.value * 2)
```

Cada computed primitivo obtiene la estabilidad automática de Vue 3.4+ sin coste adicional. Los componentes que solo usen `isEven` no se re-renderizarán cuando `doubled` cambie.

## Comparativa

| Enfoque | Estabilidad | Esfuerzo |
|---|---|---|
| Object computed (por defecto) | Ninguna, nueva referencia siempre | Cero |
| Primitive computed (Vue 3.4+) | Automática | Cero |
| Object computed con comparación manual | Estable cuando los valores coinciden | Código de comparación superficial |
| Object computed con comparación profunda | Estable para objetos anidados | lodash o utilidad personalizada |
| Dividir en computeds primitivos | Automática por propiedad | Reestructurar el código consumidor |

Ver también: [¿Por qué mi propiedad computed no se actualiza cuando cambia una dependencia?](/es/q/computed-conditional-dependencies) · [¿Cómo agrupa Vue las actualizaciones del DOM?](/es/q/dom-update-batching)

## Referencias

- [computed() - Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [watchEffect() - Vue docs](https://vuejs.org/api/reactivity-core.html#watcheffect)
- [Buenas prácticas: computed - Vue guide](https://vuejs.org/guide/essentials/computed.html#best-practices)
