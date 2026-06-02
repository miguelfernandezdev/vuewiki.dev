---
order: 53
title: "What is the Composition API and how does it differ from the Options API?"
difficulty: "beginner"
tags: ["composition-api"]
summary: "Options API organizes by option type (data, methods, computed). Composition API organizes by logical concern using setup() and composables."
---

Vue gives you two ways to write component logic.

## Options API

The [Options API](https://vuejs.org/guide/introduction.html#options-api) is the original Vue style. You export an object with predefined keys — `data` for state, `methods` for functions, `computed` for derived values, `watch` for side effects. Vue reads those keys and wires everything together behind the scenes.

```vue
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() { return this.count * 2 }
  },
  methods: {
    increment() { this.count++ }
  }
}
</script>
```

This works fine for small components. The problem appears when a component grows: logic for a single feature (say, search) gets scattered across `data`, `computed`, `methods`, and `watch`. You end up jumping between sections to understand one feature.

## Composition API

The [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) (Vue 3) lets you write logic as plain JavaScript functions. Instead of splitting by option type, you group code by what it does.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
function increment() { count.value++ }
</script>
```

The reactive state (`ref`), derived values (`computed`), and functions all live together. When the component grows, you can extract related logic into a [composable](/q/what-is-a-composable) — a plain function that returns reactive state — and reuse it across components.

## Why the Composition API wins for real projects

In a component with search, pagination, and filters using Options API, each feature's code is fragmented:

```txt
data()      → searchQuery, page, filters
computed    → filteredResults, totalPages, activeFilterCount
methods     → search(), nextPage(), toggleFilter()
watch       → searchQuery watcher, filters watcher
```

With the Composition API, each feature is a self-contained block (or composable) that you can read top-to-bottom without jumping around. That's the core difference: **organization by feature instead of by option type**.

## Which should you learn?

Both. The Composition API with [`<script setup>`](/q/script-setup) is the recommended default for new projects. But you need to read Options API code because most existing Vue 2 apps use it, and many Vue 3 codebases mix both styles during migration.

See also: [What is script setup?](/q/script-setup) · [What is a composable?](/q/what-is-a-composable)

## References

- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Introduction: Options API vs Composition API](https://vuejs.org/guide/introduction.html#options-api) - Vue.js docs
- [script setup](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
