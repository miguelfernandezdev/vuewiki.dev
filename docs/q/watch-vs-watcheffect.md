---
order: 11
title: "What's the difference between watch and watchEffect?"
difficulty: "intermediate"
tags: ["reactivity", "composition-api"]
---

- **[`watch`](https://vuejs.org/api/reactivity-core.html#watch)**: watches specific sources. Receives old and new values. Only runs when the explicit sources change.
- **[`watchEffect`](https://vuejs.org/api/reactivity-core.html#watcheffect)**: auto-detects dependencies. Runs immediately and re-runs when any reactive dependency changes.

```ts
// watch: explicit
watch(count, (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`)
})

// watch: multiple sources
watch([firstName, lastName], ([newFirst, newLast]) => {
  console.log(`${newFirst} ${newLast}`)
})

// watchEffect: auto-tracking
watchEffect(() => {
  // Re-runs automatically when count.value changes
  console.log(`count is ${count.value}`)
})
```

**When to use which:**
- `watch` when you need the previous value, or when you need to control exactly what you observe
- `watchEffect` for simple side effects that depend on reactive data

See also: [What's the difference between computed and watch?](/q/computed-vs-watch) · [What's the difference between ref and reactive?](/q/ref-vs-reactive)

## References

- [watch](https://vuejs.org/api/reactivity-core.html#watch) - Vue.js docs
- [watchEffect](https://vuejs.org/api/reactivity-core.html#watcheffect) - Vue.js docs
- [Watchers](https://vuejs.org/guide/essentials/watchers.html) - Vue.js docs
