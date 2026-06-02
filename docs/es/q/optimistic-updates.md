---
order: 87
title: "¿Cómo implementarías actualizaciones optimistas en Vue?"
difficulty: "advanced"
tags: ["reactivity", "performance", "pinia"]
---

Las actualizaciones optimistas cambian la interfaz de inmediato antes de que el servidor confirme la acción. El patrón se apoya en [ref](https://vuejs.org/api/reactivity-core.html#ref) y [toRaw](https://vuejs.org/api/reactivity-advanced.html#toraw) para capturar y restaurar el estado. Si la petición al servidor tiene éxito, nada cambia visualmente. Si falla, se revierte al estado anterior. La app se siente instantánea porque el usuario no espera un viaje de red de ida y vuelta.

## Patrón básico

1. Guarda el estado actual (instantánea)
2. Aplica el cambio a la interfaz de inmediato
3. Envía la petición al servidor
4. Si hay error, restaura la instantánea

## Ejemplo: marcar un todo

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

  // Optimista: actualiza de inmediato
  todo.done = !todo.done

  try {
    await $fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: { done: todo.done }
    })
  } catch {
    // Revertir en caso de error
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

## Ejemplo: eliminar de una lista

Eliminar es más delicado porque hay que recordar el elemento y su posición:

```ts
async function deleteTodo(id: string) {
  const index = todos.value.findIndex(t => t.id === id)
  if (index === -1) return

  const removed = todos.value[index]

  // Optimista: elimina de inmediato
  todos.value.splice(index, 1)

  try {
    await $fetch(`/api/todos/${id}`, { method: 'DELETE' })
  } catch {
    // Revertir: reinsertar en la posición original
    todos.value.splice(index, 0, removed)
  }
}
```

## Ejemplo: añadir a una lista

Usa un ID temporal hasta que el servidor responda con el definitivo:

```ts
async function addTodo(text: string) {
  const tempId = `temp-${Date.now()}`
  const optimisticTodo: Todo = { id: tempId, text, done: false }

  // Optimista: muestra de inmediato
  todos.value.push(optimisticTodo)

  try {
    const created = await $fetch('/api/todos', {
      method: 'POST',
      body: { text }
    })
    // Reemplaza el temporal con la respuesta real del servidor
    const index = todos.value.findIndex(t => t.id === tempId)
    if (index !== -1) todos.value[index] = created
  } catch {
    // Revertir: eliminar el elemento optimista
    todos.value = todos.value.filter(t => t.id !== tempId)
  }
}
```

## Composable para acciones optimistas

Extrae el patrón en un helper reutilizable:

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

## Con Pinia

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

## Con Pinia Colada / TanStack Query

Estas librerías tienen soporte integrado para actualizaciones optimistas mediante `onMutate`:

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

## Cuándo usar actualizaciones optimistas

| Acción | ¿Optimista? | Por qué |
|---|---|---|
| Marcar like/marcador | Sí | Respuesta rápida, bajo riesgo |
| Eliminar un elemento | Sí | Pero muestra un toast con opción de deshacer |
| Editar contenido de texto | Quizás | Riesgo de conflicto si otros también editan |
| Pago/checkout | No | Hay que esperar la confirmación del servidor |
| Subida de archivo | No | No se puede simular el resultado |

La regla: usa actualizaciones optimistas cuando la acción tiene muchas probabilidades de éxito y la experiencia de revertir es aceptable.

Ver también: [¿Cómo agrupa Vue las actualizaciones del DOM?](/es/q/dom-update-batching) · [¿Cuándo deberías usar markRaw y toRaw?](/es/q/markraw-toraw)

## Referencias

- [ref() — Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [toRaw() — Vue docs](https://vuejs.org/api/reactivity-advanced.html#toraw)
- [Pinia Colada — async state management](https://pinia-colada.esm.dev/)
