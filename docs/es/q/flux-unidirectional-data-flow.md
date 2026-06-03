---
order: 133
title: '¿Qué es Flux/flujo de datos unidireccional y cómo lo implementa Vue?'
difficulty: 'intermediate'
tags:
  [
    'architecture',
    'state-management',
    'pinia',
    'vuex',
    'v-model',
    'provide-inject'
  ]
summary: 'Los datos fluyen en una dirección: acciones cambian estado, estado actualiza la vista, vistas despachan acciones. Vue lo implementa con props/events y Pinia.'
---

Flux es un patrón de arquitectura donde los datos fluyen en una sola dirección: las acciones disparan cambios de estado, los cambios de estado disparan actualizaciones de la vista, y las vistas despachan nuevas acciones. No hay enlace bidireccional entre la vista y el store. Vue implementa este principio en dos niveles: dentro de los componentes (props hacia abajo, eventos hacia arriba) y a escala de aplicación (los stores de Pinia siguen el mismo ciclo acción-estado-vista).

## El ciclo Flux

```
Acción → Store (estado) → Vista → Acción → ...
```

1. Algo ocurre (el usuario hace clic, la API responde)
2. Se despacha una acción
3. El store procesa la acción y actualiza el estado
4. La vista se re-renderiza basándose en el nuevo estado
5. La vista puede despachar nuevas acciones, reiniciando el ciclo

La restricción clave: la vista nunca modifica el estado directamente. Siempre pasa por una acción.

## Por qué importa el flujo unidireccional

En el flujo de datos bidireccional, cualquier componente puede cambiar cualquier dato, y esos cambios se propagan en direcciones impredecibles. Con 5 componentes compartiendo estado, un error podría originarse en cualquiera de ellos. Depurar significa revisar cada posible ruta de mutación.

El flujo unidireccional te da una sola ruta a seguir: se despachó una acción, el estado cambió, la vista se actualizó. Si el estado es incorrecto, buscas la acción que lo cambió.

## Flujo de datos a nivel de componente en Vue

Vue impone el flujo unidireccional entre componentes padre e hijo por diseño:

```vue
<!-- Padre: posee el estado, lo pasa hacia abajo -->
<script setup>
const count = ref(0)
function increment() {
  count.value++
}
</script>

<template>
  <!-- Las props van HACIA ABAJO -->
  <Counter :count="count" @increment="increment" />
</template>
```

<PlaygroundLink code="<script setup>
const count = ref(0)
function increment() {
  count.value++
}
</script>
&#10;<template>
&#10;  <Counter :count=&quot;count&quot; @increment=&quot;increment&quot; />
</template>" />

```vue
<!-- Counter.vue: recibe props, emite eventos HACIA ARRIBA -->
<script setup>
defineProps<{ count: number }>()
const emit = defineEmits<{ increment: [] }>()
</script>

<template>
  <button @click="emit('increment')">{{ count }}</button>
</template>
```

<PlaygroundLink code="<script setup>
defineProps<{ count: number }>()
const emit = defineEmits<{ increment: [] }>()
</script>
&#10;<template>
  <button @click=&quot;emit('increment')&quot;>{{ count }}</button>
</template>" />

El hijo no puede mutar `count` directamente. Emite un evento (acción), el padre lo gestiona (actualiza el estado), y el nuevo valor fluye hacia abajo como prop (actualización de la vista). Esto es Flux a nivel de componente.

## Pinia: Flux a escala de aplicación

Pinia sigue el mismo patrón con stores:

```ts
// stores/counter.ts
export const useCounterStore = defineStore('counter', () => {
  // Estado
  const count = ref(0)

  // Acciones (encapsulan los cambios de estado)
  function increment() {
    count.value++
  }

  function reset() {
    count.value = 0
  }

  // Getters (estado derivado)
  const doubled = computed(() => count.value * 2)

  return { count, doubled, increment, reset }
})
```

```vue
<!-- Cualquier componente -->
<script setup>
const counter = useCounterStore()
</script>

<template>
  <p>{{ counter.count }} (doubled: {{ counter.doubled }})</p>
  <button @click="counter.increment()">+1</button>
  <button @click="counter.reset()">Reset</button>
</template>
```

<PlaygroundLink code="<script setup>
const counter = useCounterStore()
</script>
&#10;<template>
  <p>{{ counter.count }} (doubled: {{ counter.doubled }})</p>
  <button @click=&quot;counter.increment()&quot;>+1</button>
  <button @click=&quot;counter.reset()&quot;>Reset</button>
</template>" />

La vista llama a acciones (`increment`, `reset`). Las acciones modifican el estado (`count`). Los cambios de estado disparan actualizaciones de la vista. El ciclo es explícito y rastreable.

## Vuex hacía Flux explícito

Vuex (la librería de gestión de estado anterior de Vue) seguía Flux de forma más estricta con conceptos separados para cada paso:

```js
const store = createStore({
  state: { count: 0 },

  // Mutaciones: cambios de estado síncronos (la ÚNICA forma de cambiar el estado)
  mutations: {
    INCREMENT(state) {
      state.count++
    }
  },

  // Acciones: pueden ser asíncronas, confirman mutaciones
  actions: {
    async incrementAsync({ commit }) {
      await delay(1000)
      commit('INCREMENT')
    }
  },

  getters: {
    doubled: (state) => state.count * 2
  }
})

// La vista despacha acción → la acción confirma mutación → el estado se actualiza → la vista se re-renderiza
store.dispatch('incrementAsync')
```

La separación mutación/acción generaba una pista de auditoría estricta: cada cambio de estado pasaba por una mutación con nombre, visible en DevTools. Pinia eliminó las mutaciones porque la indirección adicional no justificaba el boilerplate, pero el principio unidireccional se mantiene.

## Cómo Vue DevTools traza el flujo

Tanto Pinia como Vuex se integran con Vue DevTools para mostrar el ciclo Flux:

1. **Timeline**: cada acción aparece como un evento con marca temporal
2. **Snapshot de estado**: puedes inspeccionar el estado del store antes y después de cada acción
3. **Time travel**: en Vuex, podías revertir a cualquier snapshot de estado anterior

Este poder de depuración solo funciona porque los datos fluyen en una dirección. Si los componentes pudieran mutar el estado del store desde cualquier lugar, la timeline carecería de sentido.

## Flux vs enlace bidireccional

El `v-model` de Vue parece un enlace bidireccional, pero es azúcar sintáctico sobre el patrón unidireccional:

```vue
<!-- Esto -->
<input v-model="name" />

<!-- Es equivalente a esto -->
<input :value="name" @input="name = $event.target.value" />
```

<PlaygroundLink code="<input v-model=&quot;name&quot; />
&#10;<input :value=&quot;name&quot; @input=&quot;name = $event.target.value&quot; />" />

Los datos siguen fluyendo en una sola dirección: estado a vista (`:value`), y eventos de vuelta hacia arriba (`@input`). La directiva `v-model` simplemente escribe ambos lados por ti.

## Comparación

|                       | Unidireccional (Flux)             | Bidireccional                                |
| --------------------- | --------------------------------- | -------------------------------------------- |
| Flujo de datos        | Acción → Estado → Vista           | Vista ↔ Estado (ambas direcciones)           |
| Depuración            | Rastrear la cadena de acciones    | Revisar cada fuente de mutación posible      |
| Predecibilidad        | Alta (una sola ruta a seguir)     | Baja (los cambios vienen de cualquier parte) |
| Boilerplate           | Más (acciones, stores)            | Menos (mutación directa)                     |
| Implementación en Vue | Props/emit, Pinia, Vuex           | v-model (azúcar sobre unidireccional)        |
| Mejor para            | Estado compartido, apps complejas | Estado local de formularios                  |

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Cómo funciona Vuex?](/es/q/how-vuex-works) · [¿Cómo funciona provide/inject?](/es/q/provide-inject)

## Referencias

- [State Management](https://vuejs.org/guide/scaling-up/state-management.html) - Vue.js docs
- [Pinia](https://pinia.vuejs.org/) - Pinia docs
