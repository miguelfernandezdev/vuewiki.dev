---
order: 64
title: "Why does forgetting .value with ref cause bugs?"
difficulty: "beginner"
tags: ["reactivity", "errors"]
---

Because [ref()](https://vuejs.org/api/reactivity-core.html#ref) wraps your value inside an object. The actual data lives at `.value`, not on the ref itself. If you forget `.value` in JavaScript, you're operating on the wrapper object, not the data.

```ts
const count = ref(0)

count++             // does nothing useful, you're incrementing an object
count = 5           // reassigns the variable, loses reactivity entirely
console.log(count)  // "[object Object]", not 0

const items = ref([1, 2, 3])
items.push(4)       // TypeError: push is not a function
```

The correct way:

```ts
const count = ref(0)

count.value++             // 1
count.value = 5           // 5
console.log(count.value)  // 5

const items = ref([1, 2, 3])
items.value.push(4)       // [1, 2, 3, 4]
```

## The template exception

In `<template>`, Vue unwraps refs automatically. You do NOT write `.value` there.

```vue
<template>
  <!-- .value is NOT needed here -->
  <p>{{ count }}</p>
  <button @click="count++">Increment</button>
</template>
```

This inconsistency (`.value` in script, no `.value` in template) is the #1 source of confusion for people learning Vue 3. TypeScript helps catch it early because the types won't match if you forget `.value`.

See also: [Why doesn't reactive() work with primitives?](/q/reactive-with-primitives) · [What is the difference between ref and reactive?](/q/ref-vs-reactive)

## References

- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Reactivity Fundamentals — Vue guide](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Template Refs — Vue guide](https://vuejs.org/guide/essentials/template-refs.html)
