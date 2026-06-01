---
order: 38
title: "Why does my watcher receive the same value for old and new?"
difficulty: "intermediate"
tags: ["reactivity", "errors"]
---

Because when you deep-watch a reactive object and mutate a nested property, both `newValue` and `oldValue` point to the **same object reference**. Vue doesn't clone the object before the mutation, so by the time the callback runs, both references reflect the current (mutated) state.

```ts
const state = reactive({
  user: { name: 'John', theme: 'dark' }
})

watch(
  () => state.user,
  (newUser, oldUser) => {
    console.log(newUser === oldUser) // true, same object
    console.log(oldUser.name)        // 'Jane', not 'John'
  },
  { deep: true }
)

state.user.name = 'Jane'
```

Both `newUser` and `oldUser` are `{ name: 'Jane', theme: 'dark' }`. You can't diff them.

## How to fix it

**Option 1:** Watch the specific property you care about. Primitives are copied, so old/new work correctly.

```ts
watch(
  () => state.user.name,
  (newName, oldName) => {
    console.log(`${oldName} → ${newName}`) // 'John → Jane'
  }
)
```

**Option 2:** Watch multiple specific properties.

```ts
watch(
  [() => state.user.name, () => state.user.theme],
  ([newName, newTheme], [oldName, oldTheme]) => {
    if (newName !== oldName) console.log('name changed')
    if (newTheme !== oldTheme) console.log('theme changed')
  }
)
```

**Option 3:** Return a shallow clone from the getter so Vue captures a snapshot.

```ts
watch(
  () => ({ ...state.user }),
  (newUser, oldUser) => {
    // now they're different objects
    console.log(oldUser.name, '→', newUser.name)
  },
  { deep: true }
)
```

## When old and new DO differ

They differ when the entire object is **replaced**, not mutated:

```ts
state.user = { name: 'Jane', theme: 'light' }  // replacement → different references
state.user.name = 'Jane'                         // mutation → same reference
```
