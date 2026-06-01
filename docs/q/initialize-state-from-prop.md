---
order: 131
title: "Can you initialize state with a prop value? What happens?"
difficulty: "beginner"
tags: ["reactivity", "components"]
---

Yes, you can use a prop as the initial value for local state. The local `ref` gets the prop's current value at the time of creation and then becomes independent. Changes to the prop do NOT update the local state, and changes to the local state do NOT affect the parent. This is intentional: it creates a one-way copy.

## Basic pattern

```vue
<script setup>
const props = defineProps<{ initialCount: number }>()

const count = ref(props.initialCount)
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

`count` starts with whatever value `initialCount` has when the component mounts. After that, `count` lives its own life. The parent can change `initialCount` to 999 and the local `count` won't move.

## When this is the right approach

This pattern works when the prop is truly an initial seed, not a live binding:

```vue
<!-- Parent -->
<UserForm :initial-name="user.name" @save="updateUser" />
```

```vue
<!-- UserForm.vue -->
<script setup>
const props = defineProps<{ initialName: string }>()
const emit = defineEmits<{ save: [name: string] }>()

const name = ref(props.initialName)
</script>

<template>
  <input v-model="name" />
  <button @click="emit('save', name)">Save</button>
</template>
```

The form edits a local copy. The parent's data only updates when the user explicitly saves.

## The mistake: expecting it to stay in sync

```vue
<script setup>
const props = defineProps<{ count: number }>()

// This ref copies the value ONCE
const localCount = ref(props.count)

// When the parent changes props.count, localCount stays the same
</script>
```

If you need the local value to track the prop, use a `computed` or a `watch`:

```vue
<script setup>
const props = defineProps<{ count: number }>()

// Option 1: read-only derived value
const doubled = computed(() => props.count * 2)

// Option 2: local copy that resets when prop changes
const localCount = ref(props.count)
watch(() => props.count, (newVal) => {
  localCount.value = newVal
})
</script>
```

## Why not use the prop directly?

Vue enforces one-way data flow. Props are read-only:

```vue
<script setup>
const props = defineProps<{ count: number }>()

// This triggers a warning in development
props.count++ // [Vue warn]: Set operation on key "count" of target is invalid
</script>
```

Mutating a prop directly would change the parent's data from the child, making it impossible to trace where state changes come from. The three valid patterns are:

1. **Use the prop directly** (read-only): `{{ props.count }}`
2. **Derive a value**: `computed(() => props.count * 2)`
3. **Copy to local state**: `ref(props.count)` for editable forms

## Common naming convention

Prefix the prop with `initial` or `default` to signal that it's a seed, not a live binding:

```vue
<script setup>
const props = defineProps<{
  initialQuery: string
  defaultPageSize: number
}>()

const query = ref(props.initialQuery)
const pageSize = ref(props.defaultPageSize)
</script>
```

This makes the intent clear to anyone reading the parent template: `initial-query="vue"` means the child will start with "vue" but may diverge.

## Object props: the reference trap

When copying an object prop, a shallow `ref()` copies the reference, not the data:

```vue
<script setup>
const props = defineProps<{ initialFilters: { category: string; sort: string } }>()

// BAD: localFilters.value and props.initialFilters point to the same object
const localFilters = ref(props.initialFilters)
localFilters.value.category = 'new' // mutates the parent's object too

// GOOD: spread to create a real copy
const localFilters = ref({ ...props.initialFilters })
</script>
```

For nested objects, use `structuredClone(props.initialFilters)` or a deep copy utility.
