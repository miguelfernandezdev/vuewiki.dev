---
order: 87
title: "How would you implement optimistic updates in Vue?"
difficulty: "advanced"
tags: ["reactivity", "performance", "pinia"]
summary: "Update the UI immediately, snapshot the previous state with toRaw, send the request, and roll back on failure."
---

Optimistic updates change the UI immediately before the server confirms the action. If the server request succeeds, nothing changes visually. If it fails, you roll back to the previous state. The pattern relies on [ref](https://vuejs.org/api/reactivity-core.html#ref) and [toRaw](https://vuejs.org/api/reactivity-advanced.html#toraw) to snapshot and restore state. This makes the app feel instant because the user doesn't wait for a network round trip.

## Basic pattern

1. Save the current state (snapshot)
2. Apply the change to the UI immediately
3. Send the request to the server
4. If error, restore the snapshot

## Example: toggling a todo

```vue
<script setup lang="ts">
interface Todo {
  id: string
  text: string
  done: boolean
}

const todos = ref<Todo[]>([])

async function toggleTodo(todo: Todo) {
  const previousValue = todo.done

  // Optimistic: update immediately
  todo.done = !todo.done

  try {
    await $fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: { done: todo.done }
    })
  } catch {
    // Rollback on failure
    todo.done = previousValue
  }
}
</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      <label>
        <input type="checkbox" :checked="todo.done" @change="toggleTodo(todo)" />
        {{ todo.text }}
      </label>
    </li>
  </ul>
</template>
```

## Example: deleting from a list

Deleting is trickier because you need to remember the item and its position:

```ts
async function deleteTodo(id: string) {
  const index = todos.value.findIndex(t => t.id === id)
  if (index === -1) return

  const removed = todos.value[index]

  // Optimistic: remove immediately
  todos.value.splice(index, 1)

  try {
    await $fetch(`/api/todos/${id}`, { method: 'DELETE' })
  } catch {
    // Rollback: re-insert at original position
    todos.value.splice(index, 0, removed)
  }
}
```

## Example: adding to a list

Use a temporary ID until the server responds with the real one:

```ts
async function addTodo(text: string) {
  const tempId = `temp-${Date.now()}`
  const optimisticTodo: Todo = { id: tempId, text, done: false }

  // Optimistic: show immediately
  todos.value.push(optimisticTodo)

  try {
    const created = await $fetch('/api/todos', {
      method: 'POST',
      body: { text }
    })
    // Replace temp with real server response
    const index = todos.value.findIndex(t => t.id === tempId)
    if (index !== -1) todos.value[index] = created
  } catch {
    // Rollback: remove the optimistic item
    todos.value = todos.value.filter(t => t.id !== tempId)
  }
}
```

## Composable for optimistic actions

Extract the pattern into a reusable helper:

```ts
// composables/useOptimistic.ts
export function useOptimistic<T>(
  stateRef: Ref<T>,
  action: (optimisticValue: T) => Promise<void>
) {
  async function execute(optimisticValue: T) {
    const previous = structuredClone(toRaw(stateRef.value))
    stateRef.value = optimisticValue

    try {
      await action(optimisticValue)
    } catch {
      stateRef.value = previous
    }
  }

  return { execute }
}
```

```ts
const { execute: toggleOptimistic } = useOptimistic(
  todos,
  async (updated) => {
    await $fetch('/api/todos', { method: 'PUT', body: updated })
  }
)

function toggleTodo(id: string) {
  const updated = todos.value.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  )
  toggleOptimistic(updated)
}
```

## With Pinia

```ts
// stores/todos.ts
export const useTodoStore = defineStore('todos', () => {
  const items = ref<Todo[]>([])

  async function toggle(id: string) {
    const todo = items.value.find(t => t.id === id)
    if (!todo) return

    const previous = todo.done
    todo.done = !todo.done

    try {
      await $fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        body: { done: todo.done }
      })
    } catch {
      todo.done = previous
    }
  }

  return { items, toggle }
})
```

## With Pinia Colada / TanStack Query

These libraries have built-in optimistic update support via `onMutate`:

```ts
const { mutate } = useMutation({
  mutation: (todo: Todo) =>
    $fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: { done: !todo.done }
    }),
  onMutate: (todo) => {
    const previous = queryCache.getQueryData<Todo[]>(['todos'])
    queryCache.setQueryData(['todos'], (old) =>
      old?.map(t => t.id === todo.id ? { ...t, done: !t.done } : t)
    )
    return { previous }
  },
  onError: (_err, _todo, context) => {
    queryCache.setQueryData(['todos'], context.previous)
  }
})
```

## When to use optimistic updates

| Action | Optimistic? | Why |
|---|---|---|
| Toggle like/bookmark | Yes | Fast feedback, low risk |
| Delete an item | Yes | But show an undo toast |
| Edit text content | Maybe | Risk of conflict if others edit too |
| Payment/checkout | No | Must wait for server confirmation |
| File upload | No | Can't fake the result |

The rule: use optimistic updates when the action is very likely to succeed and the rollback experience is acceptable.

See also: [How does Vue batch DOM updates?](/q/dom-update-batching) · [When should you use markRaw and toRaw?](/q/markraw-toraw)

## References

- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [toRaw() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#toraw)
- [Pinia Colada — async state management](https://pinia-colada.esm.dev/)
