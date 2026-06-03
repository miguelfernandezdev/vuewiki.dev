---
order: 67
title: "Why should you initialize a search ref as '' instead of null?"
difficulty: 'beginner'
tags: ['reactivity', 'errors', 'vueuse', 'v-model']
summary: "v-model on inputs always produces strings. Initialize with '' instead of null to avoid Ref<string | null> and unnecessary null checks everywhere."
---

When you bind a [ref](https://vuejs.org/api/reactivity-core.html#ref) to an input with [v-model](https://vuejs.org/guide/components/v-model.html), the input always produces a string. If you initialize the ref as `null`, the type is `Ref<string | null>`, and every consumer needs a null check. If you initialize as `''` (empty string), the type is `Ref<string>`, which matches what the input produces. No null checks, no type narrowing, no edge cases.

## The problem with null

```vue
<script setup>
const search = (ref < string) | (null > null)
</script>

<template>
  <input v-model="search" placeholder="Search..." />
</template>
```

The moment the user types anything, `search` becomes a string. But before the user interacts, it's `null`. Every computed or watcher that uses it needs to handle both:

```ts
// Must handle null everywhere
const filtered = computed(() => {
  if (search.value === null) return items.value
  return items.value.filter((i) => i.name.includes(search.value!))
  //                                                        ^ non-null assertion needed
})

// Or with optional chaining
const hasQuery = computed(() => (search.value?.length ?? 0) > 0)
```

## The fix: start with empty string

```vue
<script setup>
const search = ref('')
</script>

<template>
  <input v-model="search" placeholder="Search..." />
</template>
```

```ts
// Clean — no null checks
const filtered = computed(() => {
  if (!search.value) return items.value
  return items.value.filter((i) => i.name.includes(search.value))
})

const hasQuery = computed(() => search.value.length > 0)
```

An empty string is falsy, so `if (!search.value)` catches both "empty" and "no input" without needing `=== null`.

## TypeScript gets cleaner

```ts
// With null: type is string | null
const search = ref<string | null>(null)
search.value.toLowerCase() // TS error: possibly null
search.value!.toLowerCase() // works but unsafe

// With empty string: type is string
const search = ref('')
search.value.toLowerCase() // works, no assertion needed
```

Every `.length`, `.includes()`, `.toLowerCase()`, `.trim()`, and `.startsWith()` call works without null guards.

## The same applies to other form inputs

```ts
// Prefer empty defaults that match the input's output type
const name = ref('') // text input → string
const bio = ref('') // textarea → string
const quantity = ref(0) // number input → number
const isActive = ref(false) // checkbox → boolean
const selected = ref('') // select → string
const tags = ref<string[]>([]) // multi-select → array
```

Each default matches the type the form control produces. No `null` needed.

## When null IS appropriate

Use `null` when "no value" is semantically different from "empty":

```ts
// User hasn't been loaded yet (null) vs user doesn't exist (undefined)
const user = ref<User | null>(null)

// Date picker: no date selected yet
const selectedDate = ref<Date | null>(null)

// API response that hasn't arrived
const { data } = useFetch<Product[]>('/api/products')
// data is Ref<Product[] | null> — null means "not loaded yet"
```

For these cases, `null` communicates "we don't have this data yet," which is different from an empty default. But for form inputs that always produce a value, start with the empty version of that type.

See also: [Why does forgetting .value with ref cause bugs?](/q/ref-value-gotcha) · [What is the difference between ref and reactive?](/q/ref-vs-reactive)

## References

- [ref() - Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [v-model - Vue guide](https://vuejs.org/guide/components/v-model.html)
- [Form Input Bindings - Vue guide](https://vuejs.org/guide/essentials/forms.html)
