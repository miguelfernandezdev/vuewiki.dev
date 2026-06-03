---
order: 140
title: '¿Cuáles son los antipatrones más comunes en bases de código Vue grandes?'
difficulty: 'advanced'
tags: ['architecture', 'pinia', 'watchers', 'provide-inject']
summary: 'Componentes dios, todo en stores, watchers en vez de computed, prop drilling sin provide/inject y acoplamiento fuerte a librerías externas.'
---

Los antipatrones más dañinos en proyectos Vue no son errores de sintaxis. Son decisiones estructurales que parecen productivas al principio pero generan problemas acumulativos a medida que crece la base de código. Estos son los que aparecen repetidamente en código real en producción.

## 1. Componentes dios

Componentes que hacen de todo: obtienen datos, gestionan estado, manejan lógica de negocio Y renderizan un template complejo. Crecen hasta las 500+ líneas y se vuelven imposibles de testear o reutilizar.

```vue
<!-- MAL: UserDashboard.vue haciendo todo -->
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
  /* 30 líneas de filtrado y ordenación */
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
  <!-- 200 líneas de template -->
</template>
```

<PlaygroundLink code="<script setup>
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
  /* 30 líneas de filtrado y ordenación */
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
&#10;</template>" />

La solución: extrae la obtención de datos a un composable, divide en componentes contenedor y presentacional, saca la lógica de negocio del componente por completo.

## 2. Poner todo en Pinia

Crear un store para estado que solo usa un componente, o para datos que podrían ser un prop:

```ts
// Antipatrón: un store para el estado de un modal
export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  return { isOpen }
})
```

Si solo un componente lee y escribe el estado, debería ser un `ref` local. Los stores son para estado compartido entre componentes no relacionados que debe sobrevivir a la navegación.

## 3. Watchers que deberían ser computed

Usar `watch` para derivar valores que `computed` maneja automáticamente:

```ts
// MAL: sincronizando estado derivado manualmente
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

// BIEN: dejar que el sistema de reactividad haga su trabajo
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
```

Cada watcher innecesario es un bug de sincronización esperando a ocurrir.

## 4. Deep watching cuando no hace falta

```ts
// MAL: deep watching de un objeto grande para detectar un cambio en una propiedad
watch(
  user,
  (newUser) => {
    updateHeader(newUser.name)
  },
  { deep: true }
)

// BIEN: observar solo lo que necesitas
watch(
  () => user.value.name,
  (newName) => {
    updateHeader(newName)
  }
)
```

`deep: true` recorre cada propiedad anidada en cada cambio. Para objetos grandes, esto es costoso y ejecuta el watcher ante cualquier mutación de cualquier propiedad, no solo la que te importa.

## 5. Mutar props

Modificar un prop directamente o mutar el contenido de un prop objeto/array desde un componente hijo:

```ts
// MAL: mutando el objeto del prop
props.user.name = 'New Name' // funciona pero viola el flujo de datos unidireccional

// BIEN: emitir un evento y dejar que el padre lo maneje
emit('update:user', { ...props.user, name: 'New Name' })
```

Los props objeto se pasan por referencia, por lo que las mutaciones "funcionan" sin advertencias, pero crean un flujo de datos invisible que es imposible de rastrear en una aplicación grande.

## 6. Lógica de negocio en componentes

Poner llamadas a la API, transformaciones de datos, reglas de validación y decisiones de negocio directamente en bloques `<script setup>`. Cuando la misma lógica se necesita en otro lugar, se copia y pega.

```ts
// MAL: regla de negocio embebida en un componente
if (order.total > 100 && user.tier === 'gold') {
  discount = order.total * 0.15
} else if (order.total > 50) {
  discount = order.total * 0.05
}

// BIEN: extraer a una función pura
// utils/pricing.ts
export function calculateDiscount(total: number, tier: string): number {
  if (total > 100 && tier === 'gold') return total * 0.15
  if (total > 50) return total * 0.05
  return 0
}
```

Las funciones puras son triviales de testear y reutilizar. Los componentes deben orquestar, no calcular.

## 7. Event bus para todo

Reemplazar el flujo de datos estructurado (props, emit, provide/inject, stores) con un event bus global:

```ts
// Antipatrón: eventos volando por todas partes
eventBus.emit('user-updated', user)
eventBus.emit('cart-cleared')
eventBus.emit('notification-show', { message: 'Done' })
```

Los event buses crean dependencias invisibles. Cuando algo falla, tienes que hacer grep en toda la base de código para encontrar quién emite y quién escucha. En Vue 3, este patrón fue eliminado deliberadamente de la librería principal.

## 8. Diseño de API de componentes inconsistente

Componentes con docenas de props que controlan todo, sin nombres consistentes y comportamiento que cambia según combinaciones de props:

```vue
<!-- Antipatrón: espagueti basado en props -->
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

<PlaygroundLink code="<DataTable
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

Prefiere componentes componibles sobre componentes configurables: slots para la personalización, componentes más pequeños y enfocados en lugar de un mega-componente, y composición sobre configuración.

## Resumen

| Antipatrón                       | Solución                                                         |
| -------------------------------- | ---------------------------------------------------------------- |
| Componentes dios                 | Divide en contenedor + presentacional, extrae composables        |
| Todo en Pinia                    | ref local para estado local, composable para lógica reutilizable |
| Watch en lugar de computed       | Usa computed para valores derivados                              |
| deep: true en todas partes       | Observa propiedades específicas con un getter                    |
| Mutar props                      | Emite eventos, deja que el padre gestione las mutaciones         |
| Lógica de negocio en componentes | Extrae a funciones puras o composables                           |
| Event bus                        | Usa props/emit, provide/inject o Pinia                           |
| Componentes mega-configurables   | Composición con slots y componentes más pequeños                 |

Ver también: [¿Cómo estructurar un proyecto Vue grande?](/es/q/large-project-structure) · [¿Cómo arquitecturar una app Vue 3 para escalar entre múltiples equipos?](/es/q/scale-vue-multiple-teams) · [¿Qué es un composable?](/es/q/what-is-a-composable)

## Referencias

- [Style Guide](https://vuejs.org/style-guide/) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Performance](https://vuejs.org/guide/best-practices/performance.html) - Vue.js docs
