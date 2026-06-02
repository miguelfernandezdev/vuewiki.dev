---
order: 20
title: "How does Vue 3's reactivity system work?"
difficulty: "intermediate"
tags: ["reactivity"]
---

Vue 3 uses **[Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)** (instead of Vue 2's `Object.defineProperty`):

1. When you create `reactive(obj)`, Vue wraps the object in a Proxy
2. The Proxy intercepts `get` → records which effect (computed/watch/render) accessed which property (**track**)
3. The Proxy intercepts `set` → notifies all effects that depend on that property (**trigger**)

```
reactive(obj)  →  Proxy  →  get: track(target, key)
                          →  set: trigger(target, key)
```

**`ref`** internally uses an object with getter/setter on `.value` that does track/trigger. If the value is an object, it wraps it in `reactive`.

**Practical implications:**
- Destructuring a `reactive` loses reactivity → use `toRefs()`
- Reassigning a `reactive` loses the reference → use `ref` for replaceable values
- [shallowRef](https://vuejs.org/api/reactivity-advanced.html#shallowref) / `shallowReactive` doesn't do deep tracking (performance)

See also: [What is the reactivity proxy identity hazard?](/q/proxy-identity-hazard) · [Why do I lose reactivity when destructuring a reactive object?](/q/reactive-destructuring-gotcha)

## References

- [reactive() — Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Reactivity in Depth — Vue guide](https://vuejs.org/guide/extras/reactivity-in-depth.html)
