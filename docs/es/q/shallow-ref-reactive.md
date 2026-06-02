---
order: 78
title: "¿Cuándo usarías shallowRef / shallowReactive?"
difficulty: "advanced"
tags: ["reactivity", "performance"]
summary: "shallowRef solo rastrea reemplazo de .value (no cambios anidados). shallowReactive solo rastrea propiedades del nivel superior. Úsalos para objetos grandes que reemplazas enteros."
---

Por defecto, `ref` y `reactive` hacen tus datos profundamente reactivos — Vue rastrea cada propiedad anidada, sin importar cuán profunda sea. Esto es conveniente pero tiene un coste: Vue recorre todo el árbol de objetos y envuelve cada objeto anidado en un Proxy. Para objetos pequeños está bien. Para una lista de 10.000 elementos, cada uno con propiedades anidadas, es trabajo desperdiciado si nunca editas elementos individuales en su lugar.

[`shallowRef`](https://vuejs.org/api/reactivity-advanced.html#shallowref) y [`shallowReactive`](https://vuejs.org/api/reactivity-advanced.html#shallowreactive) resuelven esto rastreando solo el primer nivel.

## shallowRef: solo rastrea el reemplazo de `.value`

Un `shallowRef` dispara actualizaciones solo cuando reemplazas `.value` por completo. Las mutaciones a propiedades dentro del valor NO se rastrean.

```ts
import { shallowRef, triggerRef } from 'vue'

const items = shallowRef<Item[]>([])

// ❌ Esto NO dispara un re-render
items.value.push(newItem)

// ✅ Reemplaza el valor completo — dispara la actualización
items.value = [...items.value, newItem]

// ✅ O muta y fuerza el trigger manualmente
items.value.push(newItem)
triggerRef(items)
```

## shallowReactive: solo rastrea las propiedades raíz

Un `shallowReactive` rastrea adiciones, eliminaciones y cambios en las propiedades del primer nivel, pero no hace reactivos los objetos anidados.

```ts
import { shallowReactive } from 'vue'

const state = shallowReactive({
  count: 0,
  nested: { deep: 'value' }
})

state.count++              // ✅ rastreado — propiedad raíz
state.nested = { deep: 1 } // ✅ rastreado — propiedad raíz reemplazada
state.nested.deep = 2      // ❌ NO rastreado — mutación anidada
```

## Cuándo usarlos

**Usa `shallowRef` cuando:**

- Recibes arrays grandes de una API que muestras pero no editas en línea (filas de tabla, resultados de búsqueda, entradas de log)
- Almacenas objetos complejos con su propio estado interno que no necesitas que Vue rastree (instancias de clases de terceros, datos de gráficos, estado de canvas)
- Siempre reemplazas el valor completo en lugar de mutar propiedades anidadas

```ts
const chartData = shallowRef<ChartConfig>(initialConfig)

async function refresh() {
  const data = await fetchChartData()
  chartData.value = data // el reemplazo completo dispara la actualización
}
```

**Usa `shallowReactive` cuando:**

- Tienes un objeto de configuración plano donde solo cambian las propiedades del primer nivel
- Estás construyendo un formulario donde cada campo es un valor simple (no un objeto anidado)

## Profundo vs superficial: la compensación

| | `ref` / `reactive` | `shallowRef` / `shallowReactive` |
|---|---|---|
| Qué se rastrea | Todo, recursivamente | Solo el primer nivel |
| Coste de configuración | Mayor (envuelve cada objeto anidado) | Menor |
| Estilo de mutación | Muta cualquier cosa, en cualquier lugar | Reemplaza el valor del primer nivel o usa `triggerRef` |
| Cuándo usar | Por defecto para la mayoría de datos | Conjuntos de datos grandes, objetos externos, rutas críticas de rendimiento |

**Empieza con `ref`/`reactive`.** Solo cambia a variantes superficiales cuando midas un problema de rendimiento o cuando la reactividad profunda no tenga sentido para tus datos (como un contexto Canvas o una instancia WebSocket).

Ver también: [¿Cuándo usar markRaw y toRaw?](/es/q/markraw-toraw) · [¿Puede Object.freeze() reemplazar a markRaw?](/es/q/object-freeze-reactive)

## Referencias

- [shallowRef()](https://vuejs.org/api/reactivity-advanced.html#shallowref) - Vue.js docs
- [shallowReactive()](https://vuejs.org/api/reactivity-advanced.html#shallowreactive) - Vue.js docs
- [triggerRef()](https://vuejs.org/api/reactivity-advanced.html#triggerref) - Vue.js docs
