---
order: 22
title: 'What is the difference between props and state in Vue?'
difficulty: 'beginner'
tags: ['components', 'reactivity', 'v-model']
summary: 'Props are read-only data passed down from a parent. State (ref/reactive) is data the component owns and can modify.'
---

Props are data passed **down** from a parent component. State (local reactive data) is data the component **owns** and manages itself. The key difference: props are read-only, state is read-write. State is declared with [ref](https://vuejs.org/api/reactivity-core.html#ref) or [reactive](https://vuejs.org/api/reactivity-core.html#reactive).

```vue
<!-- Parent.vue -->
<template>
  <UserCard :name="userName" :role="userRole" />
</template>

<script setup>
import { ref } from 'vue'
const userName = ref('Ana')
const userRole = ref('Developer')
</script>
```

<PlaygroundLink code="<!-- Parent.vue -->
<template>
  <UserCard :name=&quot;userName&quot; :role=&quot;userRole&quot; />
</template>
&#10;<script setup>
import { ref } from 'vue'
const userName = ref('Ana')
const userRole = ref('Developer')
</script>" />

```vue
<!-- UserCard.vue -->
<script setup>
// Props: received from parent, read-only
const props = defineProps<{
  name: string
  role: string
}>()

// State: owned by this component, read-write
const isExpanded = ref(false)
</script>

<template>
  <div>
    <h2>{{ name }} ({{ role }})</h2>
    <button @click="isExpanded = !isExpanded">
      {{ isExpanded ? 'Collapse' : 'Expand' }}
    </button>
    <p v-if="isExpanded">Profile details here...</p>
  </div>
</template>
```

<PlaygroundLink code="<!-- UserCard.vue -->

<script setup>
// Props: received from parent, read-only
const props = defineProps<{
  name: string
  role: string
}>()
&#10;// State: owned by this component, read-write
const isExpanded = ref(false)
</script>

&#10;<template>

  <div>
    <h2>{{ name }} ({{ role }})</h2>
    <button @click=&quot;isExpanded = !isExpanded&quot;>
      {{ isExpanded ? 'Collapse' : 'Expand' }}
    </button>
    <p v-if=&quot;isExpanded&quot;>Profile details here...</p>
  </div>
</template>" />

## Side by side

|                    | Props                              | State                              |
| ------------------ | ---------------------------------- | ---------------------------------- |
| Who controls it    | Parent                             | The component itself               |
| Mutable            | No (read-only)                     | Yes                                |
| Declared with      | `defineProps`                      | `ref()` / `reactive()`             |
| Data flow          | Parent to child (one-way)          | Internal                           |
| Triggers re-render | Yes, when parent changes the value | Yes, when the component changes it |

## Why props are read-only

Vue enforces one-way data flow. If a child could modify its props, the parent's state would change without the parent knowing, making data flow unpredictable and bugs hard to trace.

```ts
// This triggers a runtime warning
props.name = 'New name' // [Vue warn]: Attempting to mutate prop "name"
```

When you need the child to change a value the parent owns, emit an event:

```vue
<!-- Child -->
<script setup>
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ update: [value: number] }>()
</script>

<template>
  <button @click="emit('update', count + 1)">+1</button>
</template>

<!-- Parent -->
<Counter :count="total" @update="total = $event" />
```

<PlaygroundLink code="<!-- Child -->

<script setup>
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ update: [value: number] }>()
</script>

&#10;<template>
<button @click=&quot;emit('update', count + 1)&quot;>+1</button>
</template>
&#10;<!-- Parent -->
<Counter :count=&quot;total&quot; @update=&quot;total = $event&quot; />" />

## When to use which

| Scenario                                              | Use                         |
| ----------------------------------------------------- | --------------------------- |
| Configuration passed from parent (label, color, size) | Props                       |
| UI toggle local to the component (open/closed, hover) | State                       |
| Form input value shared with parent                   | Props + emit (or `v-model`) |
| Data fetched inside the component                     | State                       |
| Data fetched by parent, displayed by child            | Props                       |

See also: [Can you initialize state with a prop value?](/q/initialize-state-from-prop) · [What is Vue's reactivity system?](/q/reactivity-system)

## References

- [ref() - Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Props - Vue guide](https://vuejs.org/guide/components/props.html)
- [Component Events - Vue guide](https://vuejs.org/guide/components/events.html)
