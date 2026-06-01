---
order: 95
title: "What are Nuxt layouts and how do they work?"
difficulty: "beginner"
tags: ["nuxt", "components"]
---

Layouts are wrapper components that surround your pages. They define shared UI like headers, footers, and sidebars. Instead of repeating that structure in every page, you define it once in a layout and let Nuxt wrap your pages automatically.

## Default layout

Create `layouts/default.vue`. Every page uses it automatically unless told otherwise:

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

The `<slot />` is where the page content renders.

## Custom layouts

Create additional layouts for different sections of your app:

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

## Assigning a layout to a page

Use `definePageMeta` to pick a layout:

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

Pages without `definePageMeta({ layout })` use the `default` layout.

## Disabling the layout

Some pages need no layout at all:

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

## Changing layout dynamically

Use `setPageLayout` to switch layouts at runtime:

```vue
<script setup>
function switchToAdmin() {
  setPageLayout('admin')
}
</script>

<template>
  <button @click="switchToAdmin">Enter admin mode</button>
</template>
```

## Layout transitions

Add transitions when switching between layouts:

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

## Using NuxtLayout in app.vue

If you have an `app.vue`, you need `<NuxtLayout>` to enable layouts:

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

Without `<NuxtLayout>`, layouts are ignored even if pages declare them.

## Layout directory structure

```
layouts/
├── default.vue    ← used by all pages unless overridden
├── admin.vue      ← pages opt in via definePageMeta
└── auth.vue       ← minimal layout for login/register
```

## When to use layouts vs components

| Need | Use |
|---|---|
| Shared header/footer/sidebar across many pages | Layout |
| Wrapper that only a few components use | Regular component |
| Different structure for public vs admin pages | Multiple layouts |
| No wrapper at all (embed, widget) | `layout: false` |
