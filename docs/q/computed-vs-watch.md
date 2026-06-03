---
order: 79
title: "What's the difference between computed and watch?"
difficulty: 'advanced'
tags: ['reactivity', 'composition-api', 'watchers']
summary: 'computed derives a cached value from reactive data (pure, no side effects). watch runs side effects when specific sources change (API calls, DOM manipulation).'
---

Both react to changes in reactive data, but they serve fundamentally different purposes. Getting this wrong leads to either duplicated state (using `watch` where `computed` would suffice) or unexpected side effects (using `computed` for things that shouldn't be pure).

## computed: deriving values

A [`computed`](https://vuejs.org/api/reactivity-core.html#computed) calculates a value from other reactive data. It's cached, and Vue only recalculates it when its dependencies actually change. You read it like a variable, never call it like a function.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const firstName = ref('Ana')
const lastName = ref('García')

const fullName = computed(() => `${firstName.value} ${lastName.value}`)
// fullName.value === 'Ana García'
// Recalculates only when firstName or lastName changes
</script>

<template>
  <p>{{ fullName }}</p>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import { ref, computed } from 'vue'
&#10;const firstName = ref('Ana')
const lastName = ref('García')
&#10;const fullName = computed(() => `${firstName.value} ${lastName.value}`)
// fullName.value === 'Ana García'
// Recalculates only when firstName or lastName changes
</script>
&#10;<template>

  <p>{{ fullName }}</p>
</template>" />

Think of `computed` as a formula in a spreadsheet cell. Cell C1 = A1 + B1. You don't "run" it. It just always has the right answer.

## watch: reacting to changes

A [`watch`](https://vuejs.org/api/reactivity-core.html#watch) runs code **in response** to a change. It doesn't return a value. It performs side effects like API calls, DOM manipulation, localStorage writes, or analytics events.

```ts
import { ref, watch } from 'vue'

const searchQuery = ref('')

watch(searchQuery, async (newQuery, oldQuery) => {
  if (newQuery.length < 3) return
  const results = await fetch(`/api/search?q=${newQuery}`)
  // Update results, log analytics, etc.
})
```

You get both the new and old value, and you can do async work inside. A `computed` can't do either of those things.

## The decision rule

Ask yourself: **"Am I calculating a value, or doing something?"**

| Question                                                  | Answer | Use        |
| --------------------------------------------------------- | ------ | ---------- |
| Do I need a derived value in the template?                | Yes    | `computed` |
| Do I need to fetch data when something changes?           | Yes    | `watch`    |
| Do I need the previous value?                             | Yes    | `watch`    |
| Do I need to write to localStorage/cookies?               | Yes    | `watch`    |
| Can the result be expressed as a pure function of inputs? | Yes    | `computed` |

## The common mistake

Using `watch` + `ref` to do what `computed` does for free:

```ts
// ❌ Manual sync with watch — duplicated state, easy to desync
const items = ref<Item[]>([])
const activeCount = ref(0)

watch(
  items,
  (val) => {
    activeCount.value = val.filter((i) => i.active).length
  },
  { deep: true }
)

// ✅ Just use computed — always in sync, cached, no extra state
const activeCount = computed(() => items.value.filter((i) => i.active).length)
```

If you find yourself writing a `watch` that sets a `ref` to a derived value, replace it with a `computed`.

See also: [What's the difference between watch and watchEffect?](/q/watch-vs-watcheffect) · [What's the difference between ref and reactive?](/q/ref-vs-reactive)

## References

- [Computed Properties](https://vuejs.org/guide/essentials/computed.html) - Vue.js docs
- [Watchers](https://vuejs.org/guide/essentials/watchers.html) - Vue.js docs
- [computed()](https://vuejs.org/api/reactivity-core.html#computed) - Vue.js docs
- [watch()](https://vuejs.org/api/reactivity-core.html#watch) - Vue.js docs
