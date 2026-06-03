---
order: 68
title: "What's the difference between watch and watchEffect?"
difficulty: "intermediate"
tags: ["reactivity", "composition-api", "watchers"]
summary: "watch specifies explicit sources and gives old/new values. watchEffect auto-tracks dependencies and runs immediately. watch is more predictable for complex logic."
---

Both run code in response to reactive changes, but they differ in **how you tell Vue what to watch** and **when they first run**.

## watch: you specify what to observe

[`watch`](https://vuejs.org/api/reactivity-core.html#watch) takes an explicit source (a ref, a getter, or an array of sources) and only runs when that specific source changes. It gives you both the old and new values.

```ts
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (newVal, oldVal) => {
  console.log(`Changed from ${oldVal} to ${newVal}`)
})

// Watch multiple sources
const firstName = ref('Ana')
const lastName = ref('García')

watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  console.log(`Name changed to ${newFirst} ${newLast}`)
})
```

`watch` is **lazy by default**. It doesn't run until the source actually changes. Add `{ immediate: true }` if you need it to run once immediately.

## watchEffect: Vue figures out the dependencies

[`watchEffect`](https://vuejs.org/api/reactivity-core.html#watcheffect) runs your callback immediately and automatically tracks every reactive value you read inside it. When any of those values change, it re-runs.

```ts
import { ref, watchEffect } from 'vue'

const query = ref('')
const page = ref(1)

watchEffect(async () => {
  // Vue sees you reading query.value and page.value
  // It will re-run this whenever either changes
  const results = await fetch(`/api/search?q=${query.value}&page=${page.value}`)
  // ...
})
```

You don't list dependencies anywhere. Vue detects them at runtime by observing which reactive values your code actually reads.

## When to use which

**Use `watch` when:**
- You need the **previous value** (e.g., comparing old vs new to decide what to do)
- You want to watch something **specific** and ignore other reactive data in the callback
- You want **lazy** execution (don't run until the first change)
- You need `{ deep: true }` to watch nested object changes

```ts
watch(route, (newRoute, oldRoute) => {
  if (newRoute.path !== oldRoute.path) {
    analytics.track('page_view', { path: newRoute.path })
  }
})
```

**Use `watchEffect` when:**
- You have a **simple side effect** that depends on reactive data and should run right away
- You don't care about the previous value
- You want dependencies tracked automatically (less code, fewer mistakes)

```ts
watchEffect(() => {
  document.title = `${count.value} items — MyApp`
})
```

## The auto-tracking caveat

`watchEffect` only tracks dependencies that are read **synchronously** during execution. If you read a reactive value after an `await`, Vue won't track it:

```ts
watchEffect(async () => {
  // ✅ tracked — read before await
  const url = `/api/users?role=${role.value}`

  const data = await fetch(url)

  // ❌ NOT tracked — read after await
  console.log(filter.value)
})
```

If you hit this, either read all reactive values before the first `await`, or switch to `watch` with explicit sources.

See also: [What's the difference between computed and watch?](/q/computed-vs-watch) · [How does Vue batch DOM updates?](/q/dom-update-batching)

## References

- [watch()](https://vuejs.org/api/reactivity-core.html#watch) - Vue.js docs
- [watchEffect()](https://vuejs.org/api/reactivity-core.html#watcheffect) - Vue.js docs
- [Watchers](https://vuejs.org/guide/essentials/watchers.html) - Vue.js docs
