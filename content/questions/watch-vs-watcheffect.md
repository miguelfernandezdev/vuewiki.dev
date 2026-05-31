---
order: 11
title: "What's the difference between watch and watchEffect?"
difficulty: "intermediate"
---

- **`watch`** — Watches specific sources. Receives old and new values. Only runs when the explicit sources change.
- **`watchEffect`** — Auto-detects dependencies. Runs immediately and re-runs when any reactive dependency changes.

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
