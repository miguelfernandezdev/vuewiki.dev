---
order: 39
title: "Why does my watchEffect miss dependencies after an await?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
---

Because [watchEffect](https://vuejs.org/api/reactivity-core.html#watcheffect) only tracks dependencies during **synchronous** execution. After the first `await`, Vue stops tracking. Any reactive property accessed after that point is invisible to the watcher.

```ts
const userId = ref(1)
const includeDetails = ref(true)

watchEffect(async () => {
  const res = await fetch(`/api/users/${userId.value}`) // userId tracked
  const data = await res.json()

  if (includeDetails.value) { // NOT tracked, after await
    // ...
  }
})
```

Changing `userId` re-runs the effect. Changing `includeDetails` does nothing because Vue never saw it being accessed.

## How to fix it

**Option 1:** Read all reactive values before the first `await`.

```ts
watchEffect(async () => {
  const id = userId.value             // tracked
  const withDetails = includeDetails.value  // tracked

  const res = await fetch(`/api/users/${id}`)
  const data = await res.json()

  if (withDetails) {
    // ...
  }
})
```

**Option 2:** Use `watch` with explicit sources. This is the safer choice for async work because dependencies are declared upfront, not auto-detected.

```ts
watch(
  [userId, includeDetails],
  async ([id, withDetails]) => {
    const res = await fetch(`/api/users/${id}`)
    const data = await res.json()

    if (withDetails) {
      // ...
    }
  },
  { immediate: true }
)
```

## Why this happens

Vue's dependency tracking works by intercepting property reads (`.value` access) during the getter execution. JavaScript `await` yields control back to the event loop. Vue stops recording after that yield because it can't guarantee which microtask runs next. Everything before the first `await` is synchronous and gets tracked normally.

See also: [Why do watchers created inside async callbacks cause memory leaks?](/q/watch-async-memory-leak) · [What is the difference between watch and watchEffect?](/q/watch-vs-watcheffect)

## References

- [watchEffect() — Vue docs](https://vuejs.org/api/reactivity-core.html#watcheffect)
- [watch() — Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [Watchers guide — Vue docs](https://vuejs.org/guide/essentials/watchers.html)
