---
order: 22
title: "When would you use shallowRef / shallowReactive?"
difficulty: "advanced"
tags: ["reactivity", "performance"]
---

When you have large objects that don't need deep reactivity:

```ts
// ❌ Deep reactive on an array of 10,000 items = slow
const items = ref<Item[]>(hugeArray)

// ✅ Shallow: only reacts if you reassign the ref, not if you change an item
const items = shallowRef<Item[]>(hugeArray)

// To update, you need to reassign:
items.value = [...items.value, newItem]
// Or force trigger:
triggerRef(items)
```

**Use cases:** Large lists, API data that isn't edited inline, complex config objects.
