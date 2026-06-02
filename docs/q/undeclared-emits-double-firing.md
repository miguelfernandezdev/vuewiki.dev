---
order: 29
title: "Why do undeclared emits fire twice?"
difficulty: "intermediate"
tags: ["components", "errors"]
summary: "Re-emitting a native event without declaring it fires twice: once via $attrs fallthrough, once via your explicit emit(). Declare it in defineEmits to fix."
---

Because when you re-emit a native event (like `click`) without declaring it in `defineEmits`, the parent's listener ends up attached in two places: once through `$attrs` fallthrough on the root element, and once through your explicit `$emit()` call.

```vue
<!-- MyButton.vue — NO defineEmits -->
<template>
  <button @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<!-- Parent.vue -->
<MyButton @click="handleClick">Click me</MyButton>
```

What happens on each click:

1. Native click fires on the `<button>`
2. Since `click` is not declared in emits, `@click` from the parent falls through to the root element via `$attrs`, firing `handleClick`
3. The `@click="$emit('click', $event)"` also fires, emitting a component event that triggers `handleClick` again

Result: `handleClick` runs **twice**.

## How to fix it

**Option 1:** Declare the emit. This tells Vue that `@click` on the component is a component event, not a native one, so it won't fall through.

```vue
<script setup>
const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <button @click="emit('click', $event)">
    <slot />
  </button>
</template>
```

**Option 2:** Don't re-emit at all. If the component has a single root element, the native event falls through automatically.

```vue
<!-- MyButton.vue — no emit needed, click falls through to <button> -->
<template>
  <button>
    <slot />
  </button>
</template>

<!-- Parent.vue — works, fires once -->
<MyButton @click="handleClick">Click me</MyButton>
```

The rule is simple: if you explicitly `$emit` a native event name, you must declare it in `defineEmits`. Otherwise the listener exists in two places.

See also: [How do you emit events with TypeScript?](/q/emit-events-typescript) · [What are fallthrough attributes?](/q/fallthrough-attrs)

## References

- [defineEmits()](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
- [Fallthrough Attributes](https://vuejs.org/guide/components/attrs.html) - Vue.js docs
