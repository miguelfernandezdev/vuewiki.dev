---
order: 97
title: 'How does Vuex work?'
difficulty: 'beginner'
tags: ['state-management', 'pinia', 'vuex']
summary: 'Vuex is a single-store Flux implementation: state holds data, getters derive values, mutations change state synchronously, actions handle async logic.'
---

[Vuex](https://vuex.vuejs.org/) is the official state management library for Vue (before [Pinia](/q/how-pinia-works) replaced it). It implements the [Flux pattern](/q/flux-unidirectional-data-flow): a single store holds all shared state, and changes flow in one direction through a strict pipeline.

> **Note:** Vuex is in maintenance mode. For new projects, use [Pinia](/q/how-pinia-works). It's the officially recommended store for Vue 3. Understanding Vuex still matters because many existing apps use it.

## The four pieces

Every Vuex store has four concepts, each with a specific role:

```text
Component → dispatch(Action) → commit(Mutation) → State → Getters → Component
```

### State

The single source of truth: a reactive object that holds all shared data. Components read from it, but never write to it directly.

```ts
const store = createStore({
  state: {
    users: [] as User[],
    loading: false
  }
})
```

### Getters

Computed values derived from state. They cache their result and only recalculate when the underlying state changes, the same concept as `computed()` in a component.

```ts
getters: {
  activeUsers: (state) => state.users.filter(u => u.isActive),
  userCount: (state, getters) => getters.activeUsers.length
}
```

### Mutations

The ONLY way to change state. Mutations must be **synchronous**. This is the key constraint. It ensures every state change is trackable in Vue DevTools (you can see exactly when and how state changed).

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

Where async logic lives. Actions don't change state directly; they call mutations via `commit()`. This separation is why Vuex can track every state change: mutations are the bottleneck, and they're always synchronous.

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

## Using the store in a component

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

Notice the string-based API: `commit('SET_USERS')`, `dispatch('fetchUsers')`, `store.getters.activeUsers`. These strings aren't type-safe. Typos become runtime bugs, not compile errors. This is one of the main reasons Pinia was created.

## Modules

Large apps split the store into [modules](https://vuex.vuejs.org/guide/modules.html), each with its own state, mutations, actions, and getters. Namespaced modules prevent naming collisions:

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

// Access: store.commit('user/SET_LIST', users)
```

## Why Pinia replaced Vuex

Vuex's design (especially the mutations layer and string-based API) was created before TypeScript was common in Vue projects. Pinia solves the pain points: full TypeScript inference, no mutations (actions change state directly), no string keys, no namespaced modules. If you're starting fresh, [use Pinia](/q/how-pinia-works).

See also: [How does Pinia work?](/q/how-pinia-works) · [What is the Flux / unidirectional data flow pattern?](/q/flux-unidirectional-data-flow) · [How do you test a Pinia store?](/q/test-pinia-store)

## References

- [What is Vuex?](https://vuex.vuejs.org/) - Vuex docs
- [Getting Started](https://vuex.vuejs.org/guide/) - Vuex docs
- [Modules](https://vuex.vuejs.org/guide/modules.html) - Vuex docs
