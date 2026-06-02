---
order: 131
title: "¿Qué es el patrón contenedor-presentacional en Vue?"
difficulty: "intermediate"
tags: ["architecture", "components", "vueuse"]
---

El patrón contenedor-presentacional separa los componentes en dos roles: los contenedores gestionan la lógica y los datos, los componentes presentacionales gestionan la UI. Los contenedores cargan datos, gestionan el estado y llaman a las APIs. Los componentes presentacionales reciben todo a través de props y emiten eventos. No saben de dónde vienen los datos.

## Componente presentacional (UI pura)

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

Este componente es reutilizable en cualquier lugar. No carga datos, no accede a stores, no llama a APIs. Puedes probarlo pasando props directamente.

## Componente contenedor (lógica y datos)

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

El contenedor conoce la API, el enrutamiento y qué ocurre con las acciones del usuario. `UserCard` no sabe nada de eso.

## Por qué importa

**Testeabilidad.** Los componentes presentacionales son triviales de probar: móntalo con props, comprueba el output, dispara eventos. Sin necesidad de mockear APIs ni stores.

**Reutilización.** El mismo `UserCard` funciona en una lista, un modal, un resultado de búsqueda o una página de Storybook. No le importa el contexto.

**Legibilidad.** Cuando abres un componente presentacional, entiendes inmediatamente qué renderiza. Cuando abres un contenedor, entiendes inmediatamente qué datos gestiona.

## Con composables (enfoque moderno en Vue)

En Vue 3, los composables frecuentemente reemplazan a los contenedores. En lugar de un componente contenedor, un composable encapsula la lógica:

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

El componente de página es más delgado porque el composable posee la lógica. El componente presentacional permanece igual.

## Cuándo aplicar este patrón

| Situación | ¿Aplicar el patrón? |
|---|---|
| El componente se reutiliza en varios lugares | Sí |
| El componente carga sus propios datos y los renderiza | Divide en contenedor + presentacional |
| Componente simple de un solo uso | No merece la pena |
| Componente de página con lógica específica de ruta | La página ES el contenedor |

No dividas todos los componentes. Aplica el patrón cuando un componente mezcla carga de datos con renderizado de UI y quieres reutilizar la parte de UI o probarla de forma independiente.

Ver también: [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Qué es el patrón de componentes compuestos?](/es/q/compound-components-pattern) · [¿Qué es lifting state up?](/es/q/lifting-state-up)

## Referencias

- [Composables](https://vuejs.org/guide/reusability/composables.html) - Vue.js docs
- [Props](https://vuejs.org/guide/components/props.html) - Vue.js docs
