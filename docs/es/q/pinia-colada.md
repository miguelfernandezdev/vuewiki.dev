---
order: 102
title: "¿Qué es Pinia Colada y cómo gestiona el estado asíncrono?"
difficulty: "advanced"
tags: ["state-management", "data-fetching", "pinia"]
summary: "La respuesta de Vue a TanStack Query. Gestiona data fetching, caché, invalidación, actualizaciones optimistas y deduplicación sobre Pinia."
---

Pinia Colada es una capa de gestión de estado asíncrono para Vue, desarrollada por Eduardo San Martin Morote (el creador de Pinia y Vue Router). Gestiona peticiones de datos, caché, invalidación, actualizaciones optimistas y deduplicación. Funciona como la respuesta de Vue a TanStack Query (React Query), pero diseñada en torno a la reactividad de Vue y el ecosistema de Pinia.

## El problema que resuelve

Gestionar datos asíncronos en Vue suele implicar escribir el mismo boilerplate en cada componente o composable: estado de carga, estado de error, caché, re-fetch, condiciones de carrera. Pinia Colada abstrae todo eso.

Sin Pinia Colada:

```ts
const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<Error | null>(null)

async function fetchUsers() {
  isLoading.value = true
  error.value = null
  try {
    users.value = await fetch('/api/users').then(r => r.json())
  } catch (e) {
    error.value = e as Error
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchUsers)
```

Con Pinia Colada:

```ts
const { data: users, isLoading, error } = useQuery({
  key: ['users'],
  query: () => fetch('/api/users').then(r => r.json())
})
```

## Instalación

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

## Queries (lectura de datos)

`useQuery` obtiene, cachea y mantiene los datos actualizados:

```ts
import { useQuery } from '@pinia/colada'

const { data, isLoading, error, refresh } = useQuery({
  key: ['users'],
  query: () => fetch('/api/users').then(r => r.json())
})
```

La `key` identifica la entrada de caché. La misma key en distintos componentes comparte los mismos datos y evita peticiones duplicadas.

### Queries parametrizadas

```ts
const props = defineProps<{ userId: string }>()

const { data: user } = useQuery({
  key: () => ['users', props.userId],
  query: () => fetch(`/api/users/${props.userId}`).then(r => r.json())
})
```

Cuando `props.userId` cambia, Pinia Colada obtiene el nuevo usuario y cachea cada resultado por separado.

### Stale-while-revalidate

Por defecto, los datos en caché se devuelven inmediatamente (aunque estén desactualizados) mientras se ejecuta una petición nueva en segundo plano. Esto da al usuario una interfaz instantánea con actualizaciones automáticas.

```ts
const { data } = useQuery({
  key: ['posts'],
  query: fetchPosts,
  staleTime: 60_000 // los datos permanecen frescos 60 segundos, sin re-fetch
})
```

## Mutations (escritura de datos)

`useMutation` gestiona operaciones de creación, actualización y borrado:

```ts
import { useMutation, useQueryCache } from '@pinia/colada'

const queryCache = useQueryCache()

const { mutate, isLoading } = useMutation({
  mutation: (newUser: CreateUserDTO) =>
    fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    }).then(r => r.json()),
  onSettled: () => {
    queryCache.invalidateQueries({ key: ['users'] })
  }
})
```

Cuando la mutation termina (con éxito o error), `invalidateQueries` marca la lista de usuarios en caché como desactualizada, disparando un re-fetch en cualquier componente que use esa query.

## Invalidación de caché

```ts
const queryCache = useQueryCache()

// Invalidar una query concreta
queryCache.invalidateQueries({ key: ['users'] })

// Invalidar todas las queries que empiezan por 'users'
queryCache.invalidateQueries({ key: ['users'], exact: false })

// Establecer datos directamente (sin re-fetch)
queryCache.setQueryData(['users', '1'], updatedUser)
```

## Actualizaciones optimistas

Actualizar la interfaz antes de que el servidor responda y revertir en caso de error:

```ts
const { mutate } = useMutation({
  mutation: (todo: Todo) =>
    fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ done: !todo.done })
    }).then(r => r.json()),
  onMutate: (todo) => {
    const previous = queryCache.getQueryData<Todo[]>(['todos'])
    queryCache.setQueryData(['todos'], (old) =>
      old?.map(t => t.id === todo.id ? { ...t, done: !t.done } : t)
    )
    return { previous }
  },
  onError: (error, todo, context) => {
    queryCache.setQueryData(['todos'], context.previous)
  }
})
```

## Pinia Colada vs TanStack Query vs composables puros

| | Pinia Colada | TanStack Vue Query | Composables puros |
|---|---|---|---|
| Nativo para Vue | Sí (construido sobre Pinia) | Adaptado desde React | Sí |
| Caché + deduplicación | Integrado | Integrado | Manual |
| Devtools | Devtools de Pinia | Devtools dedicados | Ninguno |
| SSR (Nuxt) | Compatible | Compatible | Manual |
| Tamaño del bundle | Pequeño | Mayor | Cero |
| Ideal para | Proyectos Vue/Pinia que quieren estado asíncrono integrado | Equipos familiarizados con TanStack desde React | Apps sencillas con pocas llamadas a la API |

Ver también: [¿Cómo funciona Pinia?](/es/q/how-pinia-works) · [¿Qué son los plugins de Pinia?](/es/q/pinia-plugins) · [¿Cómo construirías un composable para data fetching?](/es/q/composable-data-fetching)

## Referencias

- [Pinia Colada](https://pinia-colada.esm.dev/) - Pinia Colada docs
- [Pinia](https://pinia.vuejs.org/) - Pinia docs
- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
