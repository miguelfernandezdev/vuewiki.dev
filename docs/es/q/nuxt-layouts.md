---
order: 149
title: '¿Qué son los layouts de Nuxt y cómo funcionan?'
difficulty: 'beginner'
tags: ['nuxt', 'components']
summary: 'Los layouts envuelven páginas con UI compartida (cabeceras, pies). Las páginas eligen layout via definePageMeta o default.vue se aplica automáticamente.'
---

Los layouts son componentes wrapper que rodean tus páginas. Definen la interfaz compartida como cabeceras, pies de página y barras laterales. En lugar de repetir esa estructura en cada página, la defines una vez en un layout y Nuxt envuelve las páginas automáticamente.

## Layout por defecto

Crea `layouts/default.vue`. Todas las páginas lo usan automáticamente salvo que se indique otro:

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <AppHeader />
    <main>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
```

El `<slot />` es donde se renderiza el contenido de la página.

## Layouts personalizados

Crea layouts adicionales para distintas secciones de tu app:

```vue
<!-- layouts/admin.vue -->
<template>
  <div class="admin-layout">
    <AdminSidebar />
    <main class="admin-content">
      <slot />
    </main>
  </div>
</template>
```

```vue
<!-- layouts/auth.vue -->
<template>
  <div class="auth-layout">
    <slot />
  </div>
</template>
```

## Asignar un layout a una página

Usa `definePageMeta` para seleccionar un layout:

```vue
<!-- pages/dashboard.vue -->
<script setup>
definePageMeta({
  layout: 'admin'
})
</script>

<template>
  <h1>Dashboard</h1>
</template>
```

```vue
<!-- pages/login.vue -->
<script setup>
definePageMeta({
  layout: 'auth'
})
</script>

<template>
  <LoginForm />
</template>
```

Las páginas sin `definePageMeta({ layout })` usan el layout `default`.

## Desactivar el layout

Algunas páginas no necesitan ningún layout:

```vue
<!-- pages/embed.vue -->
<script setup>
definePageMeta({
  layout: false
})
</script>

<template>
  <WidgetEmbed />
</template>
```

## Cambiar el layout dinámicamente

Usa `setPageLayout` para cambiar el layout en tiempo de ejecución:

```vue
<script setup>
function switchToAdmin() {
  setPageLayout('admin')
}
</script>

<template>
  <button @click="switchToAdmin">Entrar en modo administrador</button>
</template>
```

## Transiciones de layout

Añade transiciones al cambiar entre layouts:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    layoutTransition: { name: 'layout', mode: 'out-in' }
  }
})
```

```css
/* assets/css/main.css */
.layout-enter-active,
.layout-leave-active {
  transition: opacity 0.3s;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
```

## Usar NuxtLayout en app.vue

Si tienes un `app.vue`, necesitas `<NuxtLayout>` para activar los layouts:

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

Sin `<NuxtLayout>`, los layouts se ignoran aunque las páginas los declaren.

## Estructura del directorio layouts

```
layouts/
├── default.vue    ← usado por todas las páginas salvo que se sobreescriba
├── admin.vue      ← las páginas lo activan mediante definePageMeta
└── auth.vue       ← layout mínimo para login/registro
```

## Cuándo usar layouts vs componentes

| Necesidad                                               | Usar              |
| ------------------------------------------------------- | ----------------- |
| Cabecera/pie/barra lateral compartida en muchas páginas | Layout            |
| Wrapper que solo usan unos pocos componentes            | Componente normal |
| Estructura diferente para páginas públicas y de admin   | Múltiples layouts |
| Sin wrapper (embed, widget)                             | `layout: false`   |

Ver también: [¿Cómo maneja Nuxt la gestión de estado?](/es/q/nuxt-state-management) · [¿Qué son los slots?](/es/q/slots)

## Referencias

- [Layouts](https://nuxt.com/docs/guide/directory-structure/layouts) - Nuxt docs
- [Pages](https://nuxt.com/docs/guide/directory-structure/pages) - Nuxt docs
- [Transitions](https://nuxt.com/docs/getting-started/transitions) - Nuxt docs
