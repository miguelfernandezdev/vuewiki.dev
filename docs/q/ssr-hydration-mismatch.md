---
order: 144
title: "What causes SSR hydration mismatches and how do you fix them?"
difficulty: "advanced"
tags: ["ssr", "errors", "vite"]
summary: "Happens when client HTML differs from server HTML. Common causes: invalid HTML nesting, browser-only APIs, Date.now(), and missing v-if guards."
---

A hydration mismatch happens when the HTML the client renders differs from what the server sent. Vue tries to recover by discarding the mismatched nodes and re-rendering them, which can cause flickering and performance loss. In most cases, the app should continue to work as expected after recovery.

## Common causes

**1. Invalid HTML nesting.** Browsers auto-correct invalid markup before Vue sees it.

```vue
<template>
  <!-- Browser splits this into <p></p><div>...</div><p></p> -->
  <p>
    <div>This breaks hydration</div>
  </p>
</template>
```

**2. Non-deterministic values in the render.** `Math.random()`, `Date.now()`, and `new Date().toLocaleString()` produce different output on server and client.

```vue
<template>
  <!-- Server: "field-0.847..." / Client: "field-0.231..." -->
  <input :id="'field-' + Math.random()" />

  <!-- Server timezone != client timezone -->
  <span>{{ new Date().toLocaleTimeString() }}</span>
</template>
```

Fix: defer non-deterministic values to `onMounted`.

```ts
const fieldId = ref('field-default')
const displayTime = ref('')

onMounted(() => {
  fieldId.value = 'field-' + crypto.randomUUID()
  displayTime.value = new Date().toLocaleTimeString()
})
```

**3. Browser extensions injecting content.** Extensions like ad blockers or password managers modify the DOM between the server HTML arriving and Vue hydrating it.

## Suppressing intentional mismatches (Vue 3.5+)

Use `data-allow-mismatch` when the difference is expected:

```vue
<template>
  <span data-allow-mismatch="text">
    {{ clientOnlyTimestamp }}
  </span>
</template>
```

Accepted values: `text`, `children`, `class`, `style`, `attribute`, or no value (suppresses all).

## Debugging

Enable detailed warnings in `vite.config.ts`:

```ts
export default defineConfig({
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true
  }
})
```

| Error message | Likely cause |
|---|---|
| "Hydration text content mismatch" | Dates, random values, timezone differences |
| "Hydration children mismatch" | Invalid HTML nesting, conditional rendering |
| "Hydration node mismatch" | Completely different element rendered |

See also: [What is hydration?](/q/what-is-hydration) · [What is SSR?](/q/what-is-ssr) · [How do you avoid platform-specific API issues in SSR?](/q/ssr-platform-specific-apis)

## References

- [SSR Hydration Mismatch](https://vuejs.org/guide/scaling-up/ssr.html#hydration) - Vue.js docs
- [Client-Only Components](https://nuxt.com/docs/api/components/client-only) - Nuxt docs
- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
