---
order: 10
title: "How does Vuex work?"
difficulty: "beginner"
---

Vuex follows the Flux pattern: **State → Getters → Mutations → Actions**

```ts
const store = createStore({
  state: { count: 0 },

  // Getters: computed values from the store
  getters: {
    doubled: (state) => state.count * 2
  },

  // Mutations: ONLY way to mutate state (synchronous)
  mutations: {
    INCREMENT(state) { state.count++ },
    SET_COUNT(state, value: number) { state.count = value }
  },

  // Actions: can be async, call mutations via commit
  actions: {
    async fetchCount({ commit }) {
      const response = await fetch('/api/count')
      const data = await response.json()
      commit('SET_COUNT', data.count)
    }
  }
})

// In a component:
store.state.count
store.getters.doubled
store.commit('INCREMENT')
store.dispatch('fetchCount')
```
