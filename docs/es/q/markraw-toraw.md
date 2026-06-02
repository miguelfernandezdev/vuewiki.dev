---
order: 83
title: "¿Cuándo deberías usar markRaw y toRaw?"
difficulty: "advanced"
tags: ["reactivity", "performance"]
summary: "markRaw evita que un objeto sea reactivo (para librerías, elementos DOM, datos estáticos). toRaw devuelve el objeto original detrás del Proxy reactivo."
---

[markRaw](https://vuejs.org/api/reactivity-advanced.html#markraw) le dice a Vue que nunca envuelva un objeto en un [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) reactivo. [toRaw](https://vuejs.org/api/reactivity-advanced.html#toraw) devuelve el objeto original detrás de un Proxy existente. Ambos existen porque no todo pertenece dentro del sistema de reactividad.

## markRaw: evitar que un objeto se vuelva reactivo

Cuando almacenas una instancia de una librería de terceros, un elemento del DOM o un conjunto de datos estático grande dentro de state reactivo, Vue lo envuelve en un Proxy. Esto causa problemas: los internos de la librería pueden romperse, las comprobaciones de identidad fallan, y pagas el overhead del tracking por datos que nunca dispararán un re-render.

```ts
import { reactive, markRaw } from 'vue'
import mapboxgl from 'mapbox-gl'

// Incorrecto: la instancia de Mapbox se proxifica y sus métodos internos pueden romperse
const state = reactive({
  map: new mapboxgl.Map({ container: 'map' })
})

// Correcto: markRaw evita el envoltorio con Proxy
const state = reactive({
  map: markRaw(new mapboxgl.Map({ container: 'map' }))
})
```

### Candidatos habituales para markRaw

```ts
// Instancias de librerías (gráficos, editores, mapas)
const editor = markRaw(monaco.editor.create(element, {}))

// Instancias de clases con state interno
const ws = markRaw(new WebSocketManager('ws://example.com'))

// Conjuntos de datos estáticos grandes que nunca cambian
const geoData = markRaw(await fetch('/huge.json').then(r => r.json()))

// Elementos del DOM almacenados en state reactivo
const el = markRaw(document.getElementById('canvas')!)
```

### El mejor patrón: shallowRef + markRaw

`shallowRef` solo rastrea la reasignación de `.value` (no las propiedades profundas), y `markRaw` evita que el objeto asignado se proxifique:

```ts
import { shallowRef, markRaw, onMounted, onUnmounted } from 'vue'

function useChart(containerId: string) {
  const chart = shallowRef<Chart | null>(null)

  onMounted(() => {
    chart.value = markRaw(new Chart(containerId, { /* config */ }))
  })

  onUnmounted(() => {
    chart.value?.destroy()
  })

  return { chart }
}
```

## toRaw: acceder al objeto original detrás de un Proxy

`toRaw` elimina el Proxy reactivo y devuelve el objeto simple subyacente. Úsalo cuando necesites pasar datos a algo que no debería recibir un Proxy (APIs, librerías, structured clone, comparación).

```ts
import { reactive, toRaw } from 'vue'

const state = reactive({ name: 'Ana', age: 30 })

// Enviar datos simples a una API (sin Proxy en el payload)
await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify(toRaw(state))
})

// structuredClone necesita objetos simples
const snapshot = structuredClone(toRaw(state))

// Comparación de identidad
const raw = toRaw(state)
console.log(raw === state) // false (state es un Proxy)
```

## markRaw vs toRaw

| | `markRaw` | `toRaw` |
|---|---|---|
| Cuándo usarlo | Antes de almacenar en state reactivo | Después de que algo ya es reactivo |
| Qué hace | Marca el objeto para que nunca sea proxificado | Devuelve el objeto simple detrás de un Proxy |
| ¿Permanente? | Sí, la marca permanece en el objeto | No, solo desenvuelve una vez |
| ¿Muta el objeto? | Añade un flag `__v_skip` | No |

## Aviso: markRaw es superficial

`markRaw` solo evita que el objeto raíz sea proxificado. Los objetos anidados pueden seguir siendo envueltos si se accede a ellos a través de un padre reactivo:

```ts
const data = markRaw({ nested: { value: 1 } })

const state = reactive({ data })
// state.data no será proxificado
// pero state.data.nested podría serlo en algunos casos límite

// Más seguro: combinar con shallowRef
const safeData = shallowRef(markRaw(data))
```

Ver también: [¿Qué ocurre cuando usas Object.freeze() en datos reactivos?](/es/q/object-freeze-reactive) · [¿Qué es el problema de identidad del proxy en reactividad?](/es/q/proxy-identity-hazard)

## Referencias

- [markRaw() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#markraw)
- [toRaw() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#toraw)
- [shallowRef() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#shallowref)
