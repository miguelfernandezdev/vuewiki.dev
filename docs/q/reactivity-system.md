---
order: 20
title: "How does Vue 3's reactivity system work?"
difficulty: "intermediate"
tags: ["reactivity"]
---

Vue 3 uses **Proxy** (instead of Vue 2's `Object.defineProperty`):

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
- `shallowRef` / `shallowReactive` doesn't do deep tracking (performance)
