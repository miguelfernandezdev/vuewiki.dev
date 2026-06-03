---
order: 73
title: "Why does sorting an array inside computed mutate the original data?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
summary: "sort(), reverse(), and splice() mutate in place. Inside computed, use spread ([...arr].sort()) or toSorted() to avoid mutating the source."
---

Because `.sort()`, `.reverse()`, and `.splice()` modify the array **in place**. Inside a [computed](https://vuejs.org/api/reactivity-core.html#computed), you're calling these methods on the reactive source array. The "sorted copy" and the original end up being the same mutated array.

```ts
const items = ref([3, 1, 4, 1, 5])

const sorted = computed(() => {
  return items.value.sort((a, b) => a - b)
  // items.value is now also sorted, original order is gone
})
```

## How to fix it

**Option 1:** Copy the array first with spread.

```ts
const sorted = computed(() => {
  return [...items.value].sort((a, b) => a - b)
})
```

**Option 2:** Use `.slice()` to create a copy.

```ts
const reversed = computed(() => {
  return items.value.slice().reverse()
})
```

**Option 3 (ES2023):** Use the non-mutating versions.

```ts
const sorted = computed(() => items.value.toSorted((a, b) => a - b))
const reversed = computed(() => items.value.toReversed())
```

## Mutating vs non-mutating methods

| Mutates original | Returns new array |
|---|---|
| `sort()` | `toSorted()` |
| `reverse()` | `toReversed()` |
| `splice()` | `toSpliced()` |
| `push()` | `concat()` |

The general rule: if you're inside a `computed`, never call a method that changes the source array. Always work on a copy.

See also: [Why does my computed property not update when a dependency changes?](/q/computed-conditional-dependencies) · [How do writable computed properties work?](/q/writable-computed)

## References

- [computed() - Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [Computed Best Practices - Vue guide](https://vuejs.org/guide/essentials/computed.html#best-practices)
- [Array.prototype.toSorted() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted)
