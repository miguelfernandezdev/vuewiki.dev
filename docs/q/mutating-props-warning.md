---
order: 20
title: 'Why does mutating props directly cause warnings?'
difficulty: 'beginner'
tags: ['components', 'errors', 'v-model']
summary: 'Props are read-only (one-way data flow). Mutating them directly causes warnings because the parent will overwrite the change on next re-render.'
---

Because Vue enforces **one-way data flow**: props go down (parent to child), events go up (child to parent). If a child modifies a prop directly, the parent doesn't know about it, and the next time the parent re-renders, it will overwrite the child's change.

```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()

function increment() {
  props.count++ // ⚠️ Warning: Attempting to mutate prop "count"
}
</script>
```

Vue shows this warning because it's almost always a bug. The data owner (parent) and the data mutator (child) are out of sync.

## How to fix it

**Option 1:** Emit an event and let the parent handle the change.

```vue
<!-- Child -->
<script setup lang="ts">
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ update: [value: number] }>()

function increment() {
  emit('update', props.count + 1)
}
</script>

<!-- Parent -->
<Counter :count="count" @update="count = $event" />
```

**Option 2:** Use `v-model` (shortcut for the pattern above).

```vue
<!-- Child -->
<script setup lang="ts">
const count = defineModel<number>()
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>

<!-- Parent -->
<Counter v-model="count" />
```

**Option 3:** Use a local copy if the prop is just an initial value.

```ts
const props = defineProps<{ initialCount: number }>()
const count = ref(props.initialCount)
```

Name the prop `initialX` to signal that it's only used once and won't stay in sync with the parent.

See also: [What is the difference between props and state?](/q/props-vs-state) · [What is lifting state up?](/q/lifting-state-up) · [What is unidirectional data flow?](/q/flux-unidirectional-data-flow)

## References

- [One-Way Data Flow](https://vuejs.org/guide/components/props.html#one-way-data-flow) - Vue.js docs
- [Component Events](https://vuejs.org/guide/components/events.html) - Vue.js docs
