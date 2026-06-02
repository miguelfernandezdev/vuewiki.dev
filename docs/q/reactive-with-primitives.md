---
order: 65
title: "Why doesn't reactive() work with primitives?"
difficulty: "beginner"
tags: ["reactivity", "errors"]
summary: "reactive() is built on Proxy, which can only wrap objects. Primitives (string, number, boolean) can't be proxied — use ref() instead."
---

Because `reactive()` is built on JavaScript [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) objects, and Proxies can only wrap **objects**. Primitive values (strings, numbers, booleans) are not objects, so there is nothing for the Proxy to wrap.

```ts
const count = reactive(0)       // ⚠️ value cannot be made reactive: 0
const name = reactive('Vue')    // ⚠️ value cannot be made reactive: Vue
const active = reactive(true)   // ⚠️ value cannot be made reactive: true
```

Vue will log a warning and return the raw value without any reactivity. Your template won't update when these values change.

## Use ref() instead

`ref()` was designed precisely for this. It wraps any value (including primitives) inside an object with a `.value` property, which Vue can track.

```ts
const count = ref(0)        // works
const name = ref('Vue')     // works
const active = ref(true)    // works

count.value++               // reactive, triggers updates
```

## When to use each

| | `ref()` | `reactive()` |
|---|---|---|
| Primitives | Yes | No |
| Objects | Yes (wraps in `.value`) | Yes (direct access) |
| Reassignable | Yes (`count.value = newVal`) | No (loses proxy) |
| Needs `.value` | In script, not in template | Never |

Most teams just use `ref()` for everything. It handles both primitives and objects, and the consistency avoids this kind of mistake entirely.

See also: [What is the difference between ref and reactive?](/q/ref-vs-reactive) · [Why do I lose reactivity when destructuring a reactive object?](/q/reactive-destructuring-gotcha)

## References

- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [reactive() — Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
- [Reactivity Fundamentals — Vue guide](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
