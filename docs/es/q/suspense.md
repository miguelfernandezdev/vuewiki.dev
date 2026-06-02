---
order: 41
title: "¿Cómo funciona Suspense con componentes asíncronos?"
difficulty: "intermediate"
tags: ["components", "slots", "suspense", "teleport"]
---

`<Suspense>` es un componente integrado que renderiza contenido de fallback mientras sus hijos asíncronos se resuelven. Funciona con dos tipos de dependencias asíncronas: componentes asíncronos (`defineAsyncComponent`) y componentes con un `async setup()`.

## Uso básico

```vue
<template>
  <Suspense>
    <!-- Slot por defecto: el contenido asíncrono -->
    <AsyncDashboard />

    <!-- Slot fallback: se muestra mientras carga -->
    <template #fallback>
      <LoadingSkeleton />
    </template>
  </Suspense>
</template>
```

`Suspense` espera a que todas las dependencias asíncronas dentro del slot por defecto se resuelvan antes de cambiar del fallback al contenido real.

## Async setup

Un componente con `async setup()` (usando `await` de nivel superior en `<script setup>`) es automáticamente una dependencia de Suspense:

```vue
<!-- UserProfile.vue -->
<script setup>
const user = await fetchUser() // await de nivel superior
const posts = await fetchPosts(user.id)
</script>

<template>
  <h1>{{ user.name }}</h1>
  <PostList :posts="posts" />
</template>
```

```vue
<!-- Parent.vue -->
<template>
  <Suspense>
    <UserProfile />
    <template #fallback>Cargando perfil...</template>
  </Suspense>
</template>
```

## Un único elemento raíz en cada slot

Suspense rastrea un único hijo inmediato por slot. Envuelve varios elementos:

```vue
<template>
  <Suspense>
    <div>
      <AsyncHeader />
      <AsyncContent />
    </div>

    <template #fallback>
      <div>
        <LoadingSpinner />
        <p>Cargando...</p>
      </div>
    </template>
  </Suspense>
</template>
```

## Timeout para re-activaciones

Cuando Suspense ya está resuelto y comienza nuevo trabajo asíncrono (por ejemplo, al cambiar de vista), el contenido anterior permanece visible hasta que expira un timeout. Configura `timeout` para controlar cuándo vuelve a aparecer el fallback:

```vue
<template>
  <!-- Muestra el fallback tras 200ms si la nueva vista no ha resuelto -->
  <Suspense :timeout="200">
    <component :is="currentView" :key="currentView" />
    <template #fallback>Cargando...</template>
  </Suspense>
</template>
```

## Eventos de Suspense

Controla el estado de carga programáticamente con `@pending`, `@resolve` y `@fallback`:

```vue
<script setup>
import { ref } from 'vue'
const isLoading = ref(false)
</script>

<template>
  <ProgressBar v-if="isLoading" />

  <Suspense @pending="isLoading = true" @resolve="isLoading = false">
    <AsyncPage />
    <template #fallback><PageSkeleton /></template>
  </Suspense>
</template>
```

## Anidamiento con RouterView, Transition y KeepAlive

El orden correcto de anidamiento es RouterView, luego Transition, luego KeepAlive y luego Suspense:

```vue
<template>
  <RouterView v-slot="{ Component }">
    <Transition mode="out-in">
      <KeepAlive>
        <Suspense>
          <component :is="Component" />
          <template #fallback>Cargando...</template>
        </Suspense>
      </KeepAlive>
    </Transition>
  </RouterView>
</template>
```

## Suspense sigue siendo experimental

A partir de Vue 3.5, Suspense funciona pero está marcado como experimental. La API podría cambiar en versiones futuras. En producción, mantén los límites Suspense al mínimo y documenta dónde los usas.

Ver también: [¿Qué son los componentes asíncronos?](/es/q/async-components) · [¿Qué son Teleport, Fragments y Suspense?](/es/q/teleport-fragments-suspense) · [¿Cómo funciona el manejo de errores?](/es/q/error-handling)

## Referencias

- [Suspense](https://vuejs.org/guide/built-ins/suspense.html) - Vue.js docs
- [Async Components](https://vuejs.org/guide/components/async.html) - Vue.js docs
