---
order: 131
title: "What is the container-presentational pattern in Vue?"
difficulty: "intermediate"
tags: ["architecture", "components", "vueuse"]
summary: "Containers handle logic and data fetching; presentational components receive props and emit events. In Vue 3, composables often replace containers."
---

The container-presentational pattern separates components into two roles: containers handle logic and data, presentational components handle UI. Containers fetch data, manage state, and call APIs. Presentational components receive everything through props and emit events. They don't know where the data comes from.

## Presentational component (pure UI)

```vue
<!-- components/UserCard.vue -->
<script setup lang="ts">
defineProps<{
  name: string
  email: string
  avatar: string
}>()

defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <div class="user-card">
    <img :src="avatar" :alt="name" />
    <h3>{{ name }}</h3>
    <p>{{ email }}</p>
    <button @click="$emit('edit')">Edit</button>
    <button @click="$emit('delete')">Delete</button>
  </div>
</template>
```

This component is reusable anywhere. It doesn't fetch data, doesn't access stores, doesn't call APIs. You can test it by passing props directly.

## Container component (logic and data)

```vue
<!-- views/UserListView.vue -->
<script setup lang="ts">
const { data: users, refresh } = await useFetch('/api/users')

async function handleDelete(userId: string) {
  await $fetch(`/api/users/${userId}`, { method: 'DELETE' })
  refresh()
}

function handleEdit(userId: string) {
  navigateTo(`/users/${userId}/edit`)
}
</script>

<template>
  <div>
    <h1>Users</h1>
    <UserCard
      v-for="user in users"
      :key="user.id"
      :name="user.name"
      :email="user.email"
      :avatar="user.avatar"
      @edit="handleEdit(user.id)"
      @delete="handleDelete(user.id)"
    />
  </div>
</template>
```

The container knows about the API, routing, and what happens on user actions. The `UserCard` knows none of this.

## Why this matters

**Testability.** Presentational components are trivial to test: mount with props, check output, trigger events. No mocking APIs or stores.

**Reusability.** The same `UserCard` works in a list, a modal, a search result, or a Storybook page. It doesn't care about context.

**Readability.** When you open a presentational component, you immediately understand what it renders. When you open a container, you immediately understand what data it manages.

## With composables (modern Vue approach)

In Vue 3, composables often replace containers. Instead of a container component, a composable encapsulates the logic:

```ts
// composables/useUsers.ts
export function useUsers() {
  const { data: users, refresh } = useFetch('/api/users')

  async function deleteUser(id: string) {
    await $fetch(`/api/users/${id}`, { method: 'DELETE' })
    refresh()
  }

  return { users, deleteUser }
}
```

```vue
<!-- views/UserListView.vue -->
<script setup>
const { users, deleteUser } = useUsers()
</script>

<template>
  <UserCard
    v-for="user in users"
    :key="user.id"
    v-bind="user"
    @delete="deleteUser(user.id)"
  />
</template>
```

The page component is thinner because the composable owns the logic. The presentational component stays the same.

## When to apply this pattern

| Situation | Apply pattern? |
|---|---|
| Component is reused in multiple places | Yes |
| Component fetches its own data and renders it | Split into container + presentational |
| Simple one-off component | Not worth the overhead |
| Page-level component with route-specific logic | The page IS the container |

Don't split every component. Apply the pattern when a component mixes data fetching with UI rendering and you want to reuse the UI part or test it independently.

See also: [What is a composable?](/q/what-is-a-composable) · [What is the compound components pattern?](/q/compound-components-pattern) · [What is lifting state up?](/q/lifting-state-up)

## References

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Props](https://vuejs.org/guide/components/props.html) - Vue.js docs
