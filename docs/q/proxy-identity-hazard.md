---
order: 81
title: "What is the reactivity proxy identity hazard?"
difficulty: "advanced"
tags: ["reactivity"]
---

`reactive()` returns a Proxy, not the original object. The Proxy and the original have different identities, so `===` comparisons between them always return `false`. This causes silent bugs in selection logic, Set/Map operations, and any code that relies on object identity.

## The problem

```ts
import { reactive } from 'vue'

const original = { id: 1, name: 'Item' }
const state = reactive(original)

console.log(state === original) // false — different identity
```

This bites you in real code when you try to find, select, or compare reactive objects:

```ts
const items = reactive([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' }
])

const selected = items[0]

// Later, this might fail depending on proxy caching
if (items[0] === selected) {
  // unreliable
}

// Two reactive wrappers of "equal" data are never ===
const listA = reactive([{ id: 1 }])
const listB = reactive([{ id: 1 }])
console.log(listA[0] === listB[0]) // false
```

## Fix 1: compare by ID (preferred)

Use primitive identifiers instead of object identity. This is the most reliable approach:

```ts
const items = reactive([
  { id: 'uuid-1', name: 'Apple' },
  { id: 'uuid-2', name: 'Banana' }
])

const selectedId = ref<string | null>(null)

function selectItem(item: { id: string }) {
  selectedId.value = item.id
}

function isSelected(item: { id: string }) {
  return selectedId.value === item.id
}

// Set/Map: use IDs as keys, not objects
const selectedIds = reactive(new Set<string>())
selectedIds.add(item.id)
selectedIds.has(item.id) // reliable
```

## Fix 2: toRaw for identity comparison

When you genuinely need to compare object identity, unwrap both sides:

```ts
import { reactive, toRaw, isReactive } from 'vue'

const original = { id: 1 }
const state = reactive(original)

console.log(toRaw(state) === original) // true

// General-purpose helper
function sameObject(a: unknown, b: unknown) {
  const rawA = isReactive(a) ? toRaw(a) : a
  const rawB = isReactive(b) ? toRaw(b) : b
  return rawA === rawB
}
```

## Other places this bites

**Set and Map with reactive objects:**

```ts
const set = new Set()
const obj = reactive({ id: 1 })

set.add(obj)
set.has(obj)      // true (same proxy)
set.has(toRaw(obj)) // false (different identity)
```

**Array methods:**

```ts
const items = reactive([{ id: 1 }, { id: 2 }])
const target = items[0]

// Works (same proxy from same reactive source)
items.indexOf(target) // 0

// Fails if target came from a different reactive wrapper
const copy = reactive([...items])
copy.indexOf(target) // -1
```

## Rule of thumb

Never rely on `===` between reactive objects for application logic. Compare by a unique primitive key (ID, slug, index). Reserve `toRaw` for edge cases where you control both sides of the comparison.
