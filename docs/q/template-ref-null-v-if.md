---
order: 36
title: "Why does my template ref return null?"
difficulty: "intermediate"
tags: ["components", "errors"]
---

Because the element doesn't exist in the DOM yet (or has been removed by `v-if`). Template refs point to actual DOM elements, so if the element isn't mounted, the ref is `null`.

```vue
<script setup lang="ts">
const inputEl = ref<HTMLInputElement | null>(null)
const showInput = ref(true)

watchEffect(() => {
  inputEl.value.focus() // TypeError when showInput is false
})
</script>

<template>
  <input v-if="showInput" ref="inputEl" />
  <button @click="showInput = !showInput">Toggle</button>
</template>
```

When `showInput` becomes `false`, Vue removes the `<input>` from the DOM and sets `inputEl.value` to `null`. The `watchEffect` re-runs and crashes.

## How to fix it

**Option 1:** Guard with a null check.

```ts
watchEffect(() => {
  inputEl.value?.focus()
})
```

**Option 2:** Use `watch` on the ref itself so it only fires when the element appears.

```ts
watch(inputEl, (el) => {
  if (el) {
    el.focus()
  }
})
```

**Option 3:** Use `v-show` instead of `v-if` if you need persistent access. `v-show` keeps the element in the DOM (just hides it with CSS), so the ref is never null.

```vue
<input v-show="showInput" ref="inputEl" />
```

**Option 4 (Vue 3.5+):** Use `useTemplateRef` for a cleaner API.

```vue
<script setup lang="ts">
const input = useTemplateRef<HTMLInputElement>('my-input')

watchEffect(() => {
  input.value?.focus()
})
</script>

<template>
  <input v-if="showInput" ref="my-input" />
</template>
```

The null check is still needed, but the typing and naming are more explicit.

See also: [How do template refs work?](/q/template-refs) · [How do you type template refs?](/q/typing-template-refs)

## References

- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [nextTick()](https://vuejs.org/api/general.html#nexttick) - Vue.js docs
- [v-if](https://vuejs.org/api/built-in-directives.html#v-if) - Vue.js docs
