---
order: 22
title: "When would you use shallowRef / shallowReactive?"
difficulty: "advanced"
tags: ["reactivity", "performance"]
---

By default, `ref` and `reactive` make your data deeply reactive — Vue tracks every nested property, no matter how deep. This is convenient but has a cost: Vue walks the entire object tree and wraps every nested object in a Proxy. For small objects that's fine. For a list of 10,000 items, each with nested properties, it's wasted work if you never edit individual items in place.

[`shallowRef`](https://vuejs.org/api/reactivity-advanced.html#shallowref) and [`shallowReactive`](https://vuejs.org/api/reactivity-advanced.html#shallowreactive) solve this by only tracking the top level.

## shallowRef: only tracks `.value` replacement

A `shallowRef` triggers updates only when you replace `.value` entirely. Mutations to properties inside the value are NOT tracked.

```ts
import { shallowRef, triggerRef } from 'vue'

const items = shallowRef<Item[]>([])

// ❌ This does NOT trigger a re-render
items.value.push(newItem)

// ✅ Replace the entire value — triggers update
items.value = [...items.value, newItem]

// ✅ Or mutate and force trigger manually
items.value.push(newItem)
triggerRef(items)
```

## shallowReactive: only tracks root properties

A `shallowReactive` tracks additions, deletions, and changes to root-level properties, but doesn't make nested objects reactive.

```ts
import { shallowReactive } from 'vue'

const state = shallowReactive({
  count: 0,
  nested: { deep: 'value' }
})

state.count++              // ✅ tracked — root property
state.nested = { deep: 1 } // ✅ tracked — root property replaced
state.nested.deep = 2      // ❌ NOT tracked — nested mutation
```

## When to use them

**Use `shallowRef` when:**

- You receive large arrays from an API that you display but don't edit inline (table rows, search results, log entries)
- You store complex objects that have their own internal state you don't need Vue to track (third-party class instances, chart data, canvas state)
- You always replace the entire value rather than mutating nested properties

```ts
const chartData = shallowRef<ChartConfig>(initialConfig)

async function refresh() {
  const data = await fetchChartData()
  chartData.value = data // full replacement triggers update
}
```

**Use `shallowReactive` when:**

- You have a flat config object where only top-level properties change
- You're building a form where each field is a simple value (not a nested object)

## Deep vs shallow: the tradeoff

| | `ref` / `reactive` | `shallowRef` / `shallowReactive` |
|---|---|---|
| What's tracked | Everything, recursively | Top level only |
| Setup cost | Higher (wraps every nested object) | Lower |
| Mutation style | Mutate anything, anywhere | Replace top-level value or use `triggerRef` |
| When to use | Default for most data | Large datasets, external objects, performance-critical paths |

**Start with `ref`/`reactive`.** Only switch to shallow variants when you measure a performance problem or when deep reactivity doesn't make sense for your data (like a Canvas context or a WebSocket instance).

See also: [When should you use markRaw and toRaw?](/q/markraw-toraw) · [What happens when you use Object.freeze() on reactive data?](/q/object-freeze-reactive)

## References

- [shallowRef()](https://vuejs.org/api/reactivity-advanced.html#shallowref) - Vue.js docs
- [shallowReactive()](https://vuejs.org/api/reactivity-advanced.html#shallowreactive) - Vue.js docs
- [triggerRef()](https://vuejs.org/api/reactivity-advanced.html#triggerref) - Vue.js docs
