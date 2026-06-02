---
order: 70
title: "Why does my computed property not update when a dependency changes?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
summary: "Computed tracks dependencies by recording which reactive properties are READ during execution. If a branch skips reading a property, it's not tracked."
---

Probably because the dependency wasn't accessed during the last run. Vue tracks [computed](https://vuejs.org/api/reactivity-core.html#computed) dependencies by recording which reactive properties are read each time the getter executes. If conditional logic prevents a property from being read in a given evaluation, Vue doesn't track it as a dependency until a future re-evaluation reads it.

```ts
const isEnabled = ref(false)
const data = ref('important')

const result = computed(() => {
  if (!isEnabled.value) {
    return 'disabled' // early return, data.value never read
  }
  return data.value
})
```

Vue re-collects dependencies on every evaluation, not just the first one. When `isEnabled` is `false`, the early return means `data.value` is never read, so Vue doesn't track it during that run. If `data` changes while this branch is active, the computed won't re-evaluate because `data` wasn't a tracked dependency in the last run. It will only pick up `data` again when `isEnabled` changes to `true` and triggers a re-evaluation that reads `data.value`.

The same thing happens with short-circuit evaluation:

```ts
const password = ref('')
const confirm = ref('')

// If password is empty, confirm.value is never read
const isValid = computed(() => {
  return password.value && password.value === confirm.value
})
```

## How to fix it

Access all dependencies at the top of the getter, before any conditional logic:

```ts
const result = computed(() => {
  const enabled = isEnabled.value
  const currentData = data.value // always accessed

  if (!enabled) {
    return 'disabled'
  }
  return currentData
})
```

```ts
const isValid = computed(() => {
  const pwd = password.value
  const conf = confirm.value // always accessed

  return pwd && pwd === conf
})
```

This pattern works because Vue tracks every `.value` access that happens during the getter execution, regardless of whether the value is used in the return.

See also: [How does computed object stability affect re-renders?](/q/perf-computed-object-stability) · [Why does sorting an array inside computed mutate the original data?](/q/computed-sort-mutation)

## References

- [computed() — Vue docs](https://vuejs.org/api/reactivity-core.html#computed)
- [Computed caching vs. methods — Vue guide](https://vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods)
- [Best Practices: computed — Vue guide](https://vuejs.org/guide/essentials/computed.html#best-practices)
