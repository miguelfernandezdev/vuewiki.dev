---
order: 140
title: 'What are common anti-patterns in large Vue codebases?'
difficulty: 'advanced'
tags: ['architecture', 'pinia', 'watchers', 'provide-inject']
summary: 'God components, everything in stores, watchers instead of computed, prop drilling without provide/inject, and tight coupling to external libraries.'
---

The most damaging anti-patterns in Vue projects aren't syntax mistakes. They're structural decisions that feel productive early on but create compounding problems as the codebase grows. Here are the ones that show up repeatedly in real production code.

## 1. God components

Components that do everything: fetch data, manage state, handle business logic, AND render a complex template. They grow to 500+ lines and become impossible to test or reuse.

```vue
<!-- BAD: UserDashboard.vue doing everything -->
<script setup>
const users = ref([])
const searchQuery = ref('')
const sortBy = ref('name')
const isLoading = ref(false)
const error = ref(null)
const selectedUser = ref(null)
const isModalOpen = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    users.value = await $fetch('/api/users')
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
})

const filteredUsers = computed(() => {
  /* 30 lines of filtering and sorting */
})

function selectUser(user) {
  /* ... */
}
function deleteUser(id) {
  /* ... */
}
function exportToCsv() {
  /* ... */
}
function sendInvitation(email) {
  /* ... */
}
</script>

<template>
  <!-- 200 lines of template -->
</template>
```

<PlaygroundLink code="<!-- BAD: UserDashboard.vue doing everything -->

<script setup>
const users = ref([])
const searchQuery = ref('')
const sortBy = ref('name')
const isLoading = ref(false)
const error = ref(null)
const selectedUser = ref(null)
const isModalOpen = ref(false)
&#10;onMounted(async () => {
  isLoading.value = true
  try {
    users.value = await $fetch('/api/users')
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
})
&#10;const filteredUsers = computed(() => {
  /* 30 lines of filtering and sorting */
})
&#10;function selectUser(user) {
  /* ... */
}
function deleteUser(id) {
  /* ... */
}
function exportToCsv() {
  /* ... */
}
function sendInvitation(email) {
  /* ... */
}
</script>

&#10;<template>

  <!-- 200 lines of template -->

</template>" />

The fix: extract data fetching into a composable, split into container and presentational components, move business logic out of the component entirely.

## 2. Putting everything in Pinia

Creating a store for state that only one component uses, or for data that could be a prop:

```ts
// Anti-pattern: a store for modal state
export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  return { isOpen }
})
```

If only one component reads and writes the state, it should be a local `ref`. Stores are for state shared across unrelated components that must survive navigation.

## 3. Watchers that should be computed

Using `watch` to derive values that `computed` handles automatically:

```ts
// BAD: manually syncing derived state
const firstName = ref('John')
const lastName = ref('Doe')
const fullName = ref('')

watch(
  [firstName, lastName],
  ([f, l]) => {
    fullName.value = `${f} ${l}`
  },
  { immediate: true }
)

// GOOD: let the reactivity system do its job
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
```

Every unnecessary watcher is a synchronization bug waiting to happen.

## 4. Deep watching when you don't need to

```ts
// BAD: deep watching a large object to detect one property change
watch(
  user,
  (newUser) => {
    updateHeader(newUser.name)
  },
  { deep: true }
)

// GOOD: watch only what you need
watch(
  () => user.value.name,
  (newName) => {
    updateHeader(newName)
  }
)
```

`deep: true` traverses every nested property on every change. For large objects, this is expensive and runs the watcher on every mutation to any property, not just the one you care about.

## 5. Mutating props

Modifying a prop directly or mutating an object/array prop's contents from a child component:

```ts
// BAD: mutating the prop object
props.user.name = 'New Name' // works but violates one-way data flow

// GOOD: emit an event and let the parent handle it
emit('update:user', { ...props.user, name: 'New Name' })
```

Object props pass by reference, so mutations "work" without warnings, but they create invisible data flow that's impossible to trace in a large app.

## 6. Business logic in components

Putting API calls, data transformation, validation rules, and business decisions directly in component `<script setup>` blocks. When the same logic is needed elsewhere, it gets copy-pasted.

```ts
// BAD: business rule embedded in a component
if (order.total > 100 && user.tier === 'gold') {
  discount = order.total * 0.15
} else if (order.total > 50) {
  discount = order.total * 0.05
}

// GOOD: extract to a pure function
// utils/pricing.ts
export function calculateDiscount(total: number, tier: string): number {
  if (total > 100 && tier === 'gold') return total * 0.15
  if (total > 50) return total * 0.05
  return 0
}
```

Pure functions are trivial to test and reuse. Components should orchestrate, not calculate.

## 7. Event bus for everything

Replacing structured data flow (props, emit, provide/inject, stores) with a global event bus:

```ts
// Anti-pattern: events flying everywhere
eventBus.emit('user-updated', user)
eventBus.emit('cart-cleared')
eventBus.emit('notification-show', { message: 'Done' })
```

Event buses create invisible dependencies. When something breaks, you have to grep the entire codebase to find who emits and who listens. In Vue 3, the pattern was deliberately removed from the core library.

## 8. Inconsistent component API design

Components with dozens of props that control everything, no consistent naming, and behavior that changes based on prop combinations:

```vue
<!-- Anti-pattern: prop-driven spaghetti -->
<DataTable
  :data="items"
  :columns="cols"
  :sortable="true"
  :filterable="true"
  :paginated="true"
  :page-size="20"
  :show-header="true"
  :show-footer="false"
  :selectable="true"
  :selection-mode="'multi'"
  :row-click-action="'expand'"
  :expandable="true"
  :export-csv="true"
  :loading="isLoading"
/>
```

<PlaygroundLink code="<!-- Anti-pattern: prop-driven spaghetti -->
<DataTable
  :data=&quot;items&quot;
  :columns=&quot;cols&quot;
  :sortable=&quot;true&quot;
  :filterable=&quot;true&quot;
  :paginated=&quot;true&quot;
  :page-size=&quot;20&quot;
  :show-header=&quot;true&quot;
  :show-footer=&quot;false&quot;
  :selectable=&quot;true&quot;
  :selection-mode=&quot;'multi'&quot;
  :row-click-action=&quot;'expand'&quot;
  :expandable=&quot;true&quot;
  :export-csv=&quot;true&quot;
  :loading=&quot;isLoading&quot;
/>" />

Prefer composable components over configurable ones: slots for customization, smaller focused components over one mega-component, and composition over configuration.

## Summary

| Anti-pattern                 | Fix                                                        |
| ---------------------------- | ---------------------------------------------------------- |
| God components               | Split into container + presentational, extract composables |
| Everything in Pinia          | Local ref for local state, composable for reusable logic   |
| Watch instead of computed    | Use computed for derived values                            |
| deep: true everywhere        | Watch specific properties with a getter                    |
| Mutating props               | Emit events, let the parent own mutations                  |
| Business logic in components | Extract to pure functions or composables                   |
| Event bus                    | Use props/emit, provide/inject, or Pinia                   |
| Mega-config components       | Composition with slots and smaller components              |

See also: [How would you structure a large Vue project?](/q/large-project-structure) · [How do you architect a Vue 3 app to scale across multiple teams?](/q/scale-vue-multiple-teams) · [What is a composable?](/q/what-is-a-composable)

## References

- [Style Guide](https://vuejs.org/style-guide/) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
