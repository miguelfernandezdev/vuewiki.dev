---
order: 75
title: 'Does reassigning a property on a reactive object break reactivity?'
difficulty: 'intermediate'
tags: ['reactivity', 'errors', 'watchers']
summary: 'Reassigning a property on a reactive object works fine (Proxy traps it). What breaks reactivity is reassigning the entire variable to a new object.'
---

No. Reassigning a property on a `reactive()` object does NOT break reactivity. This is a common trick question in interviews. Because `reactive()` returns a [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), the proxy's `set` trap intercepts the assignment and triggers updates correctly. What DOES break reactivity is reassigning the entire variable to a new object, because that replaces the proxy reference.

## Property reassignment: works fine

```js
import { reactive, watchEffect } from 'vue'

const state = reactive({ name: 'Alice', age: 25 })

watchEffect(() => console.log(state.name))
// logs: "Alice"

state.name = 'Bob'
// logs: "Bob" — the watcher fires, reactivity works
```

The Proxy intercepts `state.name = 'Bob'` through its `set` trap, notifies all dependencies, and the watcher re-runs. This works for any property: existing ones, new ones, nested objects.

## Adding new properties: also works

Unlike Vue 2 (which used `Object.defineProperty` and required `Vue.set`), Vue 3's Proxy intercepts property additions:

```js
const state = reactive({ name: 'Alice' })

watchEffect(() => console.log(state.role))
// logs: undefined

state.role = 'admin'
// logs: "admin" — new property is reactive
```

In Vue 2 this would have been silent. In Vue 3 it works because the Proxy's `set` trap fires for any property, not just pre-defined ones.

## What DOES break: reassigning the entire variable

```js
let state = reactive({ name: 'Alice' })

watchEffect(() => console.log(state.name))
// logs: "Alice"

// BAD: replaces the proxy with a new plain object
state = { name: 'Bob' }
// watcher does NOT fire — state is no longer the same proxy

// BAD: replaces with a new reactive object
state = reactive({ name: 'Charlie' })
// watcher STILL does not fire — it's watching the OLD proxy
```

The watcher was registered on the original proxy. When you reassign `state` to a new object, the variable now points to something else, but the watcher still watches the old proxy. Nothing connects them.

## Why this happens

`reactive()` returns a Proxy object. The variable `state` holds a reference to that proxy. Watchers and effects track dependencies on that specific proxy instance.

```js
const proxy = reactive({ count: 0 })

// watchEffect tracks reads on THIS proxy
watchEffect(() => console.log(proxy.count))

// Property assignment: proxy.set trap fires → watcher notified
proxy.count = 1 // works

// Variable reassignment: just changes what the variable points to
// The proxy still exists, but nothing references it anymore
let state = proxy
state = reactive({ count: 2 }) // breaks — watcher watches proxy, not state
```

## The same trap with ref containing objects

```js
const user = ref({ name: 'Alice' })

watchEffect(() => console.log(user.value.name))

// GOOD: replacing .value triggers the ref's setter
user.value = { name: 'Bob' }
// logs: "Bob" — ref's set trap fires

// GOOD: mutating a property also works
user.value.name = 'Charlie'
// logs: "Charlie" — inner reactive proxy's set trap fires
```

With `ref`, reassigning `.value` works because `ref` has its own getter/setter that triggers updates. This is one reason many developers prefer `ref` over `reactive` for objects: you can safely replace the whole value.

## reactive vs ref for objects

```js
// reactive: cannot reassign, must mutate properties
const state = reactive({ name: 'Alice' })
state.name = 'Bob' // works
// state = { name: 'Bob' }   // breaks reactivity

// ref: can reassign .value OR mutate properties
const state = ref({ name: 'Alice' })
state.value = { name: 'Bob' } // works (ref setter)
state.value.name = 'Charlie' // works (inner proxy setter)
```

## The interview answer

Reassigning a property on a `reactive()` object does not break reactivity. Vue 3 uses Proxy, which intercepts all property operations (get, set, delete, even adding new properties). What breaks reactivity is reassigning the variable itself to a new object, because that disconnects from the original proxy. If you need to replace an entire object, use `ref` and reassign `.value`, or use `Object.assign` to merge into the existing reactive object:

```js
// Replace all properties without breaking the proxy reference
Object.assign(state, { name: 'Bob', age: 30 })
```

See also: [What is the reactivity proxy identity hazard?](/q/proxy-identity-hazard) · [Why do I lose reactivity when destructuring a reactive object?](/q/reactive-destructuring-gotcha)

## References

- [reactive() - Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
- [ref() - Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Proxy - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
