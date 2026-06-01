---
order: 88
title: "¿Cómo funciona el enrutamiento basado en archivos en Nuxt?"
difficulty: "beginner"
tags: ["nuxt", "vue-router"]
---

En Nuxt no se configuran las rutas manualmente. Cada archivo `.vue` dentro del directorio `pages/` se convierte automáticamente en una ruta. El sistema de archivos es la configuración del router.

## Rutas básicas

```
pages/
├── index.vue        → /
├── about.vue        → /about
└── contact.vue      → /contact
```

Las carpetas anidadas crean rutas anidadas:

```
pages/
└── posts/
    ├── index.vue    → /posts
    └── create.vue   → /posts/create
```

## Rutas dinámicas

Los corchetes en el nombre del archivo crean segmentos dinámicos:

```
pages/
├── users/
│   └── [id].vue         → /users/:id
├── posts/
│   └── [...slug].vue    → /posts/*  (comodín)
└── [[optional]].vue     → /:optional?  (parámetro opcional)
```

Accede a los parámetros de ruta con `useRoute`:

```vue
<!-- pages/users/[id].vue -->
<script setup>
const route = useRoute()
const { data } = await useFetch(`/api/users/${route.params.id}`)
</script>
```

## Navegación

`NuxtLink` reemplaza las etiquetas `<a>` para la navegación interna. Pre-carga automáticamente las páginas enlazadas cuando entran en el viewport:

```vue
<template>
  <nav>
    <NuxtLink to="/">Inicio</NuxtLink>
    <NuxtLink to="/about">Acerca de</NuxtLink>
    <NuxtLink :to="`/users/${user.id}`">Perfil</NuxtLink>
  </nav>
</template>
```

Navegación programática:

```ts
// Utilidad de Nuxt (recomendada)
navigateTo('/posts/1')

// Vue Router (también funciona)
const router = useRouter()
router.push({ name: 'posts-id', params: { id: 1 } })
```

## Validación de rutas

Valida los parámetros antes de renderizar la página. Devuelve `false` para mostrar un 404:

```vue
<!-- pages/users/[id].vue -->
<script setup>
definePageMeta({
  validate: (route) => {
    return /^\d+$/.test(route.params.id as string)
  }
})
</script>
```

## Metadatos de página

Configura opciones a nivel de página como layout, middleware y datos personalizados:

```vue
<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  title: 'Dashboard'
})
</script>
```

## El directorio pages es opcional

Si tu app es de una sola página sin enrutamiento (un widget, un dashboard), puedes omitir el directorio `pages/` por completo y usar `app.vue` como única vista. Nuxt solo activa vue-router cuando existe el directorio `pages/`.

## Referencia de nombres de archivo

| Archivo | Ruta | Ejemplo de coincidencia |
|---|---|---|
| `index.vue` | `/` | `/` |
| `about.vue` | `/about` | `/about` |
| `posts/index.vue` | `/posts` | `/posts` |
| `posts/[id].vue` | `/posts/:id` | `/posts/42` |
| `posts/[...slug].vue` | `/posts/*` | `/posts/2024/mi-articulo` |
| `[[lang]]/index.vue` | `/:lang?` | `/` o `/es` |
