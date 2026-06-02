---
order: 26
title: "What's the difference between computed and watch?"
difficulty: "advanced"
tags: ["reactivity", "composition-api"]
---

| | [`computed`](https://vuejs.org/api/reactivity-core.html#computed) | [`watch`](https://vuejs.org/api/reactivity-core.html#watch) |
|---|---|---|
| **Purpose** | Derive a value | Execute side effects |
| **Returns** | Yes, returns a value | No |
| **Caching** | Yes (recalculates only if deps change) | No |
| **Timing** | Synchronous, lazy | Can be async |
| **Example** | `fullName = computed(() => first + last)` | `watch(route, () => fetchData())` |

**Rule:** If you need a derived value → `computed`. If you need to DO something when a value changes (API call, localStorage, logging) → `watch`.

See also: [What's the difference between watch and watchEffect?](/q/watch-vs-watcheffect) · [What's the difference between ref and reactive?](/q/ref-vs-reactive)

## References

- [computed](https://vuejs.org/api/reactivity-core.html#computed) - Vue.js docs
- [watch](https://vuejs.org/api/reactivity-core.html#watch) - Vue.js docs
- [Computed Properties](https://vuejs.org/guide/essentials/computed.html) - Vue.js docs
- [Watchers](https://vuejs.org/guide/essentials/watchers.html) - Vue.js docs
