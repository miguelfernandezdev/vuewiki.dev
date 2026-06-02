---
order: 5
title: "How do you emit events with TypeScript?"
difficulty: "beginner"
tags: ["typescript", "components"]
---

In Vue 3 with `<script setup>`, you declare emits using [`defineEmits`](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) — a compiler macro, same as `defineProps`. TypeScript typing ensures that every `emit()` call in your component has the right event name and the right payload types.

## Declaring typed emits

Pass a type to `defineEmits` where each property is an event name and the value is a tuple of argument types:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
  submit: []
}>()

emit('update', 'new value') // ✅
emit('update', 42)          // ❌ Type error: expected string
emit('submit')              // ✅
emit('submit', 'extra')     // ❌ Type error: expected 0 arguments
emit('typo')                // ❌ Type error: unknown event
</script>
```

The named tuple syntax (`[value: string]`) gives parameter names that show up in IDE tooltips. You can also use unnamed tuples (`[string]`), but named ones are clearer.

## The parent side

When a component emits typed events, the parent uses `@eventName` (or `v-on:eventName`) and gets full type inference on the callback parameters:

```vue
<!-- ChildComponent emits: { update: [value: string] } -->

<template>
  <ChildComponent
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>

<script setup lang="ts">
function handleUpdate(value: string) {
  // `value` is correctly typed as string
}

function handleDelete(id: number) {
  // `id` is correctly typed as number
}
</script>
```

## Emits with validation (runtime syntax)

If you need runtime validation — not just type checking — use the object syntax instead:

```vue
<script setup lang="ts">
const emit = defineEmits({
  update(value: string) {
    return value.length > 0
  },
  submit() {
    return true
  }
})

emit('update', '') // emits, but Vue logs a warning because validation returned false
```

The validation function runs at runtime and logs a warning (in development) when it returns `false`. This is separate from TypeScript's compile-time checking — you can combine both approaches in different situations.

## Why typed emits matter

Without typed emits, nothing stops you from emitting `'updte'` (typo) or passing the wrong payload type. The parent handler silently receives `undefined` or the wrong type, and the bug surfaces far from where the mistake happened. Typed emits catch this at compile time, in the component that made the mistake.

See also: [How do you declare props with TypeScript?](/q/props-with-typescript) · [What is unidirectional data flow?](/q/flux-unidirectional-data-flow) · [What are fallthrough attributes?](/q/fallthrough-attrs)

## References

- [Typing Component Emits](https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits) - Vue.js docs
- [defineEmits()](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
- [Component Events](https://vuejs.org/guide/components/events.html) - Vue.js docs
