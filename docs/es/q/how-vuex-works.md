---
order: 97
title: '¿Cómo funciona Vuex?'
difficulty: 'beginner'
tags: ['state-management', 'pinia', 'vuex']
summary: 'Vuex es una implementación Flux de un solo store: state almacena datos, getters derivan valores, mutations cambian estado síncronamente, actions manejan lógica async.'
---

[Vuex](https://vuex.vuejs.org/) es la librería oficial de gestión de estado para Vue (antes de que [Pinia](/es/q/how-pinia-works) la reemplazara). Implementa el [patrón Flux](/es/q/flux-unidirectional-data-flow): un único store contiene todo el estado compartido, y los cambios fluyen en una dirección a través de un pipeline estricto.

> **Nota:** Vuex está en modo mantenimiento. Para proyectos nuevos, usa [Pinia](/es/q/how-pinia-works). Es el store oficialmente recomendado para Vue 3. Entender Vuex sigue siendo importante porque muchas aplicaciones existentes lo usan.

## Las cuatro piezas

Cada store de Vuex tiene cuatro conceptos, cada uno con un rol específico:

```text
Componente → dispatch(Action) → commit(Mutation) → State → Getters → Componente
```

### State

La única fuente de verdad: un objeto reactivo que contiene todos los datos compartidos. Los componentes leen de él, pero nunca escriben directamente.

```ts
const store = createStore({
  state: {
    users: [] as User[],
    loading: false
  }
})
```

### Getters

Valores computados derivados del estado. Cachean su resultado y solo recalculan cuando el estado subyacente cambia, el mismo concepto que `computed()` en un componente.

```ts
getters: {
  activeUsers: (state) => state.users.filter(u => u.isActive),
  userCount: (state, getters) => getters.activeUsers.length
}
```

### Mutations

La ÚNICA forma de cambiar el estado. Las mutations deben ser **síncronas**. Esta es la restricción clave. Asegura que cada cambio de estado sea rastreable en Vue DevTools (puedes ver exactamente cuándo y cómo cambió el estado).

```ts
mutations: {
  SET_USERS(state, users: User[]) {
    state.users = users
  },
  SET_LOADING(state, value: boolean) {
    state.loading = value
  }
}
```

### Actions

Donde vive la lógica asíncrona. Las actions no cambian el estado directamente; llaman a mutations mediante `commit()`. Esta separación es la razón por la que Vuex puede rastrear cada cambio de estado: las mutations son el cuello de botella, y siempre son síncronas.

```ts
actions: {
  async fetchUsers({ commit }) {
    commit('SET_LOADING', true)
    const response = await fetch('/api/users')
    const users = await response.json()
    commit('SET_USERS', users)
    commit('SET_LOADING', false)
  }
}
```

## Usando el store en un componente

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const users = computed(() => store.state.users)
const activeUsers = computed(() => store.getters.activeUsers)

function loadUsers() {
  store.dispatch('fetchUsers')
}
</script>
```

Observa la API basada en strings: `commit('SET_USERS')`, `dispatch('fetchUsers')`, `store.getters.activeUsers`. Estos strings no son type-safe. Los typos se convierten en bugs en runtime, no en errores de compilación. Esta es una de las principales razones por las que se creó Pinia.

## Módulos

Las apps grandes dividen el store en [módulos](https://vuex.vuejs.org/guide/modules.html), cada uno con su propio state, mutations, actions y getters. Los módulos con namespace previenen colisiones de nombres:

```ts
const userModule = {
  namespaced: true,
  state: () => ({ list: [] as User[] }),
  mutations: {
    SET_LIST(state, users: User[]) {
      state.list = users
    }
  }
}

// Acceso: store.commit('user/SET_LIST', users)
```

## Por qué Pinia reemplazó a Vuex

El diseño de Vuex (especialmente la capa de mutations y la API basada en strings) fue creado antes de que TypeScript fuera común en proyectos Vue. Pinia resuelve los puntos de dolor: inferencia completa de TypeScript, sin mutations (las actions cambian el estado directamente), sin claves string, sin módulos con namespace. Si empiezas de cero, [usa Pinia](/es/q/how-pinia-works).

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Qué es el patrón Flux / flujo de datos unidireccional?](/es/q/flux-unidirectional-data-flow) · [¿Cómo se testea un store de Pinia?](/es/q/test-pinia-store)

## Referencias

- [What is Vuex?](https://vuex.vuejs.org/) - Vuex docs
- [Getting Started](https://vuex.vuejs.org/guide/) - Vuex docs
- [Modules](https://vuex.vuejs.org/guide/modules.html) - Vuex docs
