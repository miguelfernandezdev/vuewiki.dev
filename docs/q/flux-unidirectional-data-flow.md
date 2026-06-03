---
order: 133
title: 'What is Flux/unidirectional data flow and how does Vue implement it?'
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
summary: 'Data flows one way: actions change state, state updates the view, views dispatch actions. Vue implements this with props down/events up and Pinia stores.'
---

Flux is an architecture pattern where data flows in one direction: actions trigger state changes, state changes trigger view updates, and views dispatch new actions. There is no two-way binding between the view and the store. Vue implements this principle at two levels: within components (props down, events up) and at application scale (Pinia stores follow the same action-state-view cycle).

## The Flux cycle

```
Action → Store (state) → View → Action → ...
```

1. Something happens (user clicks, API responds)
2. An action is dispatched
3. The store processes the action and updates state
4. The view re-renders based on new state
5. The view can dispatch new actions, restarting the cycle

The key constraint: the view never modifies state directly. It always goes through an action.

## Why unidirectional matters

In bidirectional data flow, any component can change any data, and those changes propagate in unpredictable directions. With 5 components sharing state, a bug could originate from any of them. Debugging means checking every possible mutation path.

Unidirectional flow gives you one path to trace: action was dispatched, state changed, view updated. If the state is wrong, you look at the action that changed it.

## Vue's component-level data flow

Vue enforces unidirectional flow between parent and child components by design:

```vue
<!-- Parent: owns the state, passes it down -->
<script setup>
const count = ref(0)
function increment() {
  count.value++
}
</script>

<template>
  <!-- Props go DOWN -->
  <Counter :count="count" @increment="increment" />
</template>
```

<PlaygroundLink code="<!-- Parent: owns the state, passes it down -->

<script setup>
const count = ref(0)
function increment() {
  count.value++
}
</script>

&#10;<template>

  <!-- Props go DOWN -->

<Counter :count=&quot;count&quot; @increment=&quot;increment&quot; />
</template>" />

```vue
<!-- Counter.vue: receives props, emits events UP -->
<script setup>
defineProps<{ count: number }>()
const emit = defineEmits<{ increment: [] }>()
</script>

<template>
  <button @click="emit('increment')">{{ count }}</button>
</template>
```

<PlaygroundLink code="<!-- Counter.vue: receives props, emits events UP -->

<script setup>
defineProps<{ count: number }>()
const emit = defineEmits<{ increment: [] }>()
</script>

&#10;<template>
<button @click=&quot;emit('increment')&quot;>{{ count }}</button>
</template>" />

The child cannot mutate `count` directly. It emits an event (action), the parent handles it (updates state), and the new value flows down as a prop (view update). This is Flux at the component level.

## Pinia: Flux at application scale

Pinia follows the same pattern with stores:

```ts
// stores/counter.ts
export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)

  // Actions (encapsulate state changes)
  function increment() {
    count.value++
  }

  function reset() {
    count.value = 0
  }

  // Getters (derived state)
  const doubled = computed(() => count.value * 2)

  return { count, doubled, increment, reset }
})
```

```vue
<!-- Any component -->
<script setup>
const counter = useCounterStore()
</script>

<template>
  <p>{{ counter.count }} (doubled: {{ counter.doubled }})</p>
  <button @click="counter.increment()">+1</button>
  <button @click="counter.reset()">Reset</button>
</template>
```

<PlaygroundLink code="<!-- Any component -->

<script setup>
const counter = useCounterStore()
</script>

&#10;<template>

  <p>{{ counter.count }} (doubled: {{ counter.doubled }})</p>
  <button @click=&quot;counter.increment()&quot;>+1</button>
  <button @click=&quot;counter.reset()&quot;>Reset</button>
</template>" />

The view calls actions (`increment`, `reset`). Actions modify state (`count`). State changes trigger view updates. The cycle is explicit and traceable.

## Vuex made Flux explicit

Vuex (Vue's previous state management library) followed Flux more strictly with separate concepts for each step:

```js
const store = createStore({
  state: { count: 0 },

  // Mutations: synchronous state changes (the ONLY way to change state)
  mutations: {
    INCREMENT(state) {
      state.count++
    }
  },

  // Actions: can be async, commit mutations
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

// View dispatches action → action commits mutation → state updates → view re-renders
store.dispatch('incrementAsync')
```

The mutation/action separation enforced a strict audit trail: every state change went through a named mutation, visible in DevTools. Pinia dropped mutations because the extra indirection wasn't worth the boilerplate, but the unidirectional principle remains.

## How Vue DevTools traces the flow

Both Pinia and Vuex integrate with Vue DevTools to show the Flux cycle:

1. **Timeline**: each action appears as an event with a timestamp
2. **State snapshot**: you can inspect the store state before and after each action
3. **Time travel**: in Vuex, you could revert to any previous state snapshot

This debugging power only works because data flows in one direction. If components could mutate store state from anywhere, the timeline would be meaningless.

## Flux vs two-way binding

Vue's `v-model` looks like two-way binding, but it's syntactic sugar over the unidirectional pattern:

```vue
<!-- This -->
<input v-model="name" />

<!-- Is equivalent to this -->
<input :value="name" @input="name = $event.target.value" />
```

<PlaygroundLink code="<!-- This -->
<input v-model=&quot;name&quot; />
&#10;<!-- Is equivalent to this -->
<input :value=&quot;name&quot; @input=&quot;name = $event.target.value&quot; />" />

Data still flows one way: state to view (`:value`), and events back up (`@input`). The `v-model` directive just writes both sides for you.

## Comparison

|                    | Unidirectional (Flux)      | Bidirectional                        |
| ------------------ | -------------------------- | ------------------------------------ |
| Data flow          | Action → State → View      | View ↔ State (both directions)       |
| Debugging          | Trace the action chain     | Check every possible mutation source |
| Predictability     | High (one path to follow)  | Low (changes come from anywhere)     |
| Boilerplate        | More (actions, stores)     | Less (direct mutation)               |
| Vue implementation | Props/emit, Pinia, Vuex    | v-model (sugar over unidirectional)  |
| Best for           | Shared state, complex apps | Local form state                     |

See also: [How does Pinia work?](/q/how-pinia-works) · [How does Vuex work?](/q/how-vuex-works) · [How does provide/inject work?](/q/provide-inject)

## References

- [State Management](https://vuejs.org/guide/scaling-up/state-management.html) - Vue.js docs
- [Pinia](https://pinia.vuejs.org/) - Pinia docs
