---
order: 20
title: "How does Vue 3's reactivity system work?"
difficulty: "intermediate"
tags: ["reactivity"]
---

When you change a value in Vue and the page updates automatically, that's the reactivity system at work. Understanding how it works under the hood helps you debug issues like "why didn't my component update?" and make intentional decisions about performance.

## The core mechanism: Proxy

Vue 3 wraps your objects in a JavaScript [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). A Proxy is a built-in language feature that intercepts operations on an object — reads, writes, deletions — and lets Vue run custom code when they happen.

When you write `reactive(obj)`, Vue creates a Proxy around `obj` that does two things:

1. **On read** (`get`): records which effect (computed, watcher, or component render) is currently running, and links it to the property being read. This is called **tracking**.
2. **On write** (`set`): looks up all effects that depend on the changed property and schedules them to re-run. This is called **triggering**.

```ts
import { reactive, watchEffect } from 'vue'

const state = reactive({ count: 0 })

watchEffect(() => {
  console.log(state.count)
  // Vue sees this read and links this effect to 'count'
})

state.count++ // Vue sees this write, finds the linked effect, and re-runs it
```

## How ref works inside

[`ref`](https://vuejs.org/api/reactivity-core.html#ref) uses the same track/trigger mechanism, but through a getter/setter on `.value` instead of a full Proxy. When the value inside a `ref` is an object, Vue automatically wraps it in `reactive()` to make it deeply reactive.

```ts
const count = ref(0)
// Internally: { get value() { track(); return 0 }, set value(v) { trigger(); ... } }

const user = ref({ name: 'Ana' })
// user.value is a reactive() proxy — user.value.name is tracked too
```

## Why this matters: common gotchas

The Proxy-based system explains several behaviors that confuse people:

**Destructuring breaks reactivity.** When you destructure a `reactive` object, you copy the current values into plain variables. Those variables aren't connected to the Proxy anymore.

```ts
const state = reactive({ count: 0 })
let { count } = state // plain number, NOT reactive
count++ // does nothing to the UI — use toRefs() instead
```

**Reassigning a reactive object breaks the reference.** The original Proxy still exists, but your variable now points somewhere else.

```ts
let state = reactive({ count: 0 })
state = reactive({ count: 1 }) // new Proxy, old watchers still watch the old one
// Use ref() for values you need to replace entirely
```

**Shallow variants skip deep tracking.** [shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref) and `shallowReactive` only track the top level, which is useful for large data structures where deep reactivity would be expensive.

## Vue 2 vs Vue 3

Vue 2 used `Object.defineProperty`, which had real limitations: it couldn't detect property addition/deletion, didn't work with arrays natively, and required workarounds like `Vue.set()`. The Proxy-based system in Vue 3 eliminates all of those issues.

| | Vue 2 (`Object.defineProperty`) | Vue 3 (`Proxy`) |
|---|---|---|
| Detect new properties | No (`Vue.set()` needed) | Yes |
| Array mutation tracking | Partially (patched methods only) | Full |
| Map/Set support | No | Yes |
| Performance on large objects | Slower (converts all upfront) | Faster (lazy, on-demand) |

See also: [What is the reactivity proxy identity hazard?](/q/proxy-identity-hazard) · [Why do I lose reactivity when destructuring a reactive object?](/q/reactive-destructuring-gotcha)

## References

- [Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html) - Vue.js docs
- [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) - Vue.js docs
- [reactive()](https://vuejs.org/api/reactivity-core.html#reactive) - Vue.js docs
