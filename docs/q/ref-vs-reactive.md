---
order: 2
title: "What's the difference between ref and reactive?"
difficulty: "beginner"
tags: ["reactivity", "composition-api"]
---

- **`ref`**: wraps any value (primitive or object). Accessed via `.value` in JS/TS, but NOT in templates.
- **`reactive`**: only for objects/arrays. No `.value` needed, but you CANNOT reassign the entire object.

```ts
const count = ref(0)          // count.value = 1
const user = ref({ name: '' }) // user.value.name = 'Ana'

const state = reactive({ count: 0, name: '' })  // state.count = 1
// state = { count: 1, name: '' }  ❌ CANNOT reassign
```

**Rule of thumb:** Use `ref` for everything (it's more flexible). Use `reactive` only when you have an object with multiple properties that always go together.
