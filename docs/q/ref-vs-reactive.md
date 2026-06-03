---
order: 62
title: "What's the difference between ref and reactive?"
difficulty: 'beginner'
tags: ['reactivity', 'composition-api']
summary: "ref works with any value type and requires .value access. reactive works only with objects, no .value needed, but can't be reassigned or destructured safely."
---

Vue 3 gives you two ways to create reactive state: [`ref`](https://vuejs.org/api/reactivity-core.html#ref) and [`reactive`](https://vuejs.org/api/reactivity-core.html#reactive). They both make data reactive so the template updates when it changes, but they work differently and have different constraints.

## ref: works with any value

`ref` wraps any value: a number, a string, a boolean, an object, an array, or `null`. You access and modify it through `.value` in JavaScript/TypeScript. In templates, Vue unwraps it automatically so you don't write `.value` there.

```ts
import { ref } from 'vue'

const count = ref(0) // primitive
const user = ref({ name: '' }) // object
const items = ref<string[]>([]) // array

count.value++ // access through .value in JS
user.value.name = 'Ana' // nested access
items.value.push('new item')
```

```vue
<template>
  <!-- No .value needed in templates -->
  <p>{{ count }}</p>
  <p>{{ user.name }}</p>
</template>
```

## reactive: objects only, no `.value`

`reactive` wraps an object (or array, Map, Set) and makes its properties reactive directly, no `.value` needed. But it **only works with objects**. You can't pass it a number or string.

```ts
import { reactive } from 'vue'

const state = reactive({ count: 0, name: '' })

state.count++ // no .value needed
state.name = 'Ana'
```

The big limitation: **you cannot reassign a reactive object**. If you do `state = newObject`, you break the reactive link. Watchers and the template still reference the old object.

```ts
let state = reactive({ count: 0 })
state = reactive({ count: 1 }) // ❌ breaks reactivity — old watchers still watch the old proxy
```

## When to use which

**Use `ref` for everything** is the safest default. It works with any type, you can reassign it freely (`count.value = newValue`), and it handles all edge cases. The `.value` is a small cost for flexibility.

**Use `reactive` when** you have a group of related properties that always live together and you'll never replace the whole object, like a form:

```ts
const form = reactive({
  email: '',
  password: '',
  remember: false
})

form.email = 'ana@example.com' // ergonomic, no .value
```

## The gotchas

**Destructuring a `reactive` breaks reactivity:**

```ts
const state = reactive({ count: 0 })
const { count } = state // ❌ count is now a plain number (0), not reactive
// Use toRefs() if you need to destructure
```

**Reassigning a `ref` is fine, reassigning a `reactive` is not:**

```ts
const data = ref<User[]>([])
data.value = await fetchUsers() // ✅ works perfectly

let data = reactive<User[]>([])
data = await fetchUsers() // ❌ breaks reactive link
```

This is why `ref` is the recommended default. When you need to replace the entire value (API responses, resetting state), `ref` just works.

See also: [What's the difference between computed and watch?](/q/computed-vs-watch) · [Why do I lose reactivity when destructuring?](/q/reactive-destructuring-gotcha)

## References

- [ref()](https://vuejs.org/api/reactivity-core.html#ref) - Vue.js docs
- [reactive()](https://vuejs.org/api/reactivity-core.html#reactive) - Vue.js docs
- [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) - Vue.js docs
