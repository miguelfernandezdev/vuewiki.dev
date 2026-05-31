---
order: 10
title: "¿Cómo funciona Vuex?"
difficulty: "beginner"
tags: ["state-management"]
---

Vuex sigue el patrón Flux: **State → Getters → Mutations → Actions**

```ts
const store = createStore({
  state: { count: 0 },

  // Getters: valores computados del store
  getters: {
    doubled: (state) => state.count * 2
  },

  // Mutations: ÚNICA forma de mutar el estado (síncronas)
  mutations: {
    INCREMENT(state) { state.count++ },
    SET_COUNT(state, value: number) { state.count = value }
  },

  // Actions: pueden ser asíncronas, llaman a mutations mediante commit
  actions: {
    async fetchCount({ commit }) {
      const response = await fetch('/api/count')
      const data = await response.json()
      commit('SET_COUNT', data.count)
    }
  }
})

// En un componente:
store.state.count
store.getters.doubled
store.commit('INCREMENT')
store.dispatch('fetchCount')
```
