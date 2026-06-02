---
order: 147
title: "How does file-based routing work in Nuxt?"
difficulty: "beginner"
tags: ["nuxt", "vue-router", "vueuse"]
summary: "Every .vue file in pages/ becomes a route automatically. Use [brackets] for dynamic segments and [...slug] for catch-all routes."
---

In Nuxt, you don't configure routes manually. Every `.vue` file inside the `pages/` directory automatically becomes a route. The file system IS the router config.

## Basic routes

```
pages/
├── index.vue        → /
├── about.vue        → /about
└── contact.vue      → /contact
```

Nested folders create nested paths:

```
pages/
└── posts/
    ├── index.vue    → /posts
    └── create.vue   → /posts/create
```

## Dynamic routes

Brackets in the filename create dynamic segments:

```
pages/
├── users/
│   └── [id].vue         → /users/:id
├── posts/
│   └── [...slug].vue    → /posts/*  (catch-all)
└── [[optional]].vue     → /:optional?  (optional param)
```

Access route params with `useRoute`:

```vue
<!-- pages/users/[id].vue -->
<script setup>
const route = useRoute()
const { data } = await useFetch(`/api/users/${route.params.id}`)
</script>
```

## Navigation

`NuxtLink` replaces `<a>` tags for internal navigation. It automatically prefetches linked pages when they enter the viewport:

```vue
<template>
  <nav>
    <NuxtLink to="/">Home</NuxtLink>
    <NuxtLink to="/about">About</NuxtLink>
    <NuxtLink :to="`/users/${user.id}`">Profile</NuxtLink>
  </nav>
</template>
```

Programmatic navigation:

```ts
// Nuxt utility (recommended)
navigateTo('/posts/1')

// Vue Router (also works)
const router = useRouter()
router.push({ name: 'posts-id', params: { id: 1 } })
```

## Route validation

Validate params before rendering the page. Return `false` to trigger a 404:

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

## Page meta

Configure page-level options like layout, middleware, and custom data:

```vue
<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  title: 'Dashboard'
})
</script>
```

## The pages directory is optional

If your app is a single-page without routing (a widget, a dashboard), you can skip the `pages/` directory entirely and use `app.vue` as the only view. Nuxt only enables vue-router when the `pages/` directory exists.

## File naming reference

| File | Route | Example match |
|---|---|---|
| `index.vue` | `/` | `/` |
| `about.vue` | `/about` | `/about` |
| `posts/index.vue` | `/posts` | `/posts` |
| `posts/[id].vue` | `/posts/:id` | `/posts/42` |
| `posts/[...slug].vue` | `/posts/*` | `/posts/2024/my-article` |
| `[[lang]]/index.vue` | `/:lang?` | `/` or `/es` |

See also: [How does Vue Router work?](/q/vue-router-navigation-guards) · [What is the Nuxt directory structure?](/q/nuxt-directory-structure) · [What is Nuxt middleware?](/q/nuxt-middleware)

## References

- [Routing](https://nuxt.com/docs/getting-started/routing) - Nuxt docs
- [pages/ Directory](https://nuxt.com/docs/guide/directory-structure/pages) - Nuxt docs
- [Getting Started](https://router.vuejs.org/guide/) - Vue Router docs
