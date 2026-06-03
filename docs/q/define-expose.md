---
order: 56
title: 'What is defineExpose and when is it needed?'
difficulty: 'intermediate'
tags: ['composition-api', 'components']
summary: 'script setup components are closed by default. defineExpose explicitly exposes properties and methods to parent template refs.'
---

Components using [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html) are closed by default. A parent that grabs a template ref to a child component gets an empty object unless the child explicitly exposes properties with [`defineExpose`](https://vuejs.org/api/sfc-script-setup.html#defineexpose). This is a deliberate change from [Options API](https://vuejs.org/guide/introduction.html#options-api), where `this.$refs.child` gave full access to the entire instance.

## The problem

```vue
<!-- Counter.vue -->
<script setup>
import { ref } from 'vue'

const count = ref(0)
function reset() {
  count.value = 0
}
</script>

<template>
  <span>{{ count }}</span>
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import { useTemplateRef, onMounted } from 'vue'
const counterRef = useTemplateRef('counter')

onMounted(() => {
  console.log(counterRef.value.count) // undefined
  counterRef.value.reset() // TypeError: not a function
})
</script>

<template>
  <Counter ref="counter" />
</template>
```

The parent sees `{}` because nothing was exposed.

## The fix

```vue
<!-- Counter.vue -->
<script setup>
import { ref } from 'vue'

const count = ref(0)
const internalState = ref('private')

function reset() {
  count.value = 0
}

defineExpose({ count, reset })
// internalState stays private
</script>
```

Now the parent can access `count` and `reset()`, but not `internalState`. You control the public API explicitly.

## Common use case: wrapping native elements

Input wrappers often expose imperative methods like `focus` and `blur`:

```vue
<!-- BaseInput.vue -->
<script setup>
import { ref } from 'vue'

const inputEl = (ref < HTMLInputElement) | (null > null)

defineExpose({
  focus: () => inputEl.value?.focus(),
  blur: () => inputEl.value?.blur()
})
</script>

<template>
  <input ref="inputEl" v-bind="$attrs" />
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import { useTemplateRef } from 'vue'

const input = useTemplateRef('search')

function openSearch() {
  input.value?.focus()
}
</script>

<template>
  <BaseInput ref="search" placeholder="Search..." />
  <button @click="openSearch">Search</button>
</template>
```

## When to use defineExpose

| Situation                                                        | Use defineExpose?                         |
| ---------------------------------------------------------------- | ----------------------------------------- |
| Parent needs to call imperative methods (focus, reset, validate) | Yes                                       |
| Parent needs to read child state for coordination                | Yes, but consider if props/emit is better |
| Normal parent-child data flow                                    | No, use props and emit                    |
| Form library needs to call validate() on child inputs            | Yes                                       |

Component refs create tight coupling. Prefer props and emit for data flow, and reserve `defineExpose` for genuinely imperative actions that don't fit a declarative pattern.

See also: [How do template refs work?](/q/template-refs) · [What are all the compiler macros in Vue?](/q/compiler-macros)

## References

- [defineExpose](https://vuejs.org/api/sfc-script-setup.html#defineexpose) - Vue.js docs
- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [script setup](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
