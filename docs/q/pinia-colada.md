---
order: 102
title: 'What is Pinia Colada and how does it handle async state?'
difficulty: 'advanced'
tags: ['state-management', 'data-fetching', 'pinia']
summary: "Vue's answer to TanStack Query. Handles data fetching, caching, invalidation, optimistic updates, and deduplication on top of Pinia."
---

Pinia Colada is an async state management layer for Vue, built by Eduardo San Martin Morote (the creator of Pinia and Vue Router). It handles data fetching, caching, invalidation, optimistic updates, and deduplication. Think of it as Vue's answer to TanStack Query (React Query), but designed around Vue's reactivity and Pinia's ecosystem.

## The problem it solves

Managing async data in Vue typically means writing the same boilerplate in every component or composable: loading state, error state, caching, refetching, race conditions. Pinia Colada abstracts all of that.

Without Pinia Colada:

```ts
const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<Error | null>(null)

async function fetchUsers() {
  isLoading.value = true
  error.value = null
  try {
    users.value = await fetch('/api/users').then((r) => r.json())
  } catch (e) {
    error.value = e as Error
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchUsers)
```

With Pinia Colada:

```ts
const {
  data: users,
  isLoading,
  error
} = useQuery({
  key: ['users'],
  query: () => fetch('/api/users').then((r) => r.json())
})
```

## Installation

```bash
npm install @pinia/colada
```

```ts
// main.ts
import { PiniaColada } from '@pinia/colada'

const app = createApp(App)
app.use(createPinia())
app.use(PiniaColada)
```

## Queries (reading data)

`useQuery` fetches, caches, and keeps data fresh:

```ts
import { useQuery } from '@pinia/colada'

const { data, isLoading, error, refresh } = useQuery({
  key: ['users'],
  query: () => fetch('/api/users').then((r) => r.json())
})
```

The `key` identifies the cache entry. Same key in different components shares the same data and avoids duplicate requests.

### Parameterized queries

```ts
const props = defineProps<{ userId: string }>()

const { data: user } = useQuery({
  key: () => ['users', props.userId],
  query: () => fetch(`/api/users/${props.userId}`).then((r) => r.json())
})
```

When `props.userId` changes, Pinia Colada fetches the new user and caches each result separately.

### Stale-while-revalidate

By default, cached data is returned immediately (stale) while a fresh request runs in the background. This gives users instant UI with automatic updates.

```ts
const { data } = useQuery({
  key: ['posts'],
  query: fetchPosts,
  staleTime: 60_000 // data stays fresh for 60 seconds, no refetch
})
```

## Mutations (writing data)

`useMutation` handles create, update, and delete operations:

```ts
import { useMutation, useQueryCache } from '@pinia/colada'

const queryCache = useQueryCache()

const { mutate, isLoading } = useMutation({
  mutation: (newUser: CreateUserDTO) =>
    fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    }).then((r) => r.json()),
  onSettled: () => {
    queryCache.invalidateQueries({ key: ['users'] })
  }
})
```

After the mutation settles (success or error), `invalidateQueries` marks the cached users list as stale, triggering a refetch in any component using that query.

## Cache invalidation

```ts
const queryCache = useQueryCache()

// Invalidate one query
queryCache.invalidateQueries({ key: ['users'] })

// Invalidate all queries starting with 'users'
queryCache.invalidateQueries({ key: ['users'], exact: false })

// Set data directly (no refetch)
queryCache.setQueryData(['users', '1'], updatedUser)
```

## Optimistic updates

Update the UI before the server responds, then roll back on error:

```ts
const { mutate } = useMutation({
  mutation: (todo: Todo) =>
    fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done: !todo.done })
    }).then((r) => r.json()),
  onMutate: (todo) => {
    const previous = queryCache.getQueryData<Todo[]>(['todos'])
    queryCache.setQueryData(['todos'], (old) =>
      old?.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t))
    )
    return { previous }
  },
  onError: (error, todo, context) => {
    queryCache.setQueryData(['todos'], context.previous)
  }
})
```

## Pinia Colada vs TanStack Query vs raw composables

|                 | Pinia Colada                                      | TanStack Vue Query                      | Raw composables                |
| --------------- | ------------------------------------------------- | --------------------------------------- | ------------------------------ |
| Vue-native      | Yes (built on Pinia)                              | Adapter from React core                 | Yes                            |
| Caching + dedup | Built-in                                          | Built-in                                | Manual                         |
| Devtools        | Pinia devtools                                    | Dedicated devtools                      | None                           |
| SSR (Nuxt)      | Supported                                         | Supported                               | Manual                         |
| Bundle size     | Small                                             | Larger                                  | Zero                           |
| Best for        | Vue/Pinia projects wanting integrated async state | Teams familiar with TanStack from React | Simple apps with few API calls |

See also: [How does Pinia work?](/q/how-pinia-works) · [What are Pinia plugins?](/q/pinia-plugins) · [How would you build a composable for data fetching?](/q/composable-data-fetching)

## References

- [Pinia Colada](https://pinia-colada.esm.dev/) - Pinia Colada docs
- [Pinia](https://pinia.vuejs.org/) - Pinia docs
- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
