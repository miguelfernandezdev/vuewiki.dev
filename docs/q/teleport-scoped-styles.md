---
order: 46
title: "Why don't scoped styles apply to teleported content?"
difficulty: "intermediate"
tags: ["components", "errors", "suspense", "teleport"]
---

Because scoped styles work by adding a `data-v-xxxxx` attribute to elements in the component's DOM subtree. When `<Teleport>` moves elements to a different part of the DOM (like `body`), those elements leave the component's subtree, so the scoped attribute selectors stop matching.

```vue
<template>
  <Teleport to="body">
    <div class="modal">
      <p class="modal-text">This text won't be styled</p>
    </div>
  </Teleport>
</template>

<style scoped>
/* .modal[data-v-abc123] — but .modal is now under <body>, not here */
.modal {
  background: white;
}

.modal-text {
  color: blue; /* won't apply */
}
</style>
```

## How to fix it

**Option 1 (recommended):** Use a separate non-scoped style block with prefixed class names.

```vue
<style scoped>
/* Normal component styles stay scoped */
.trigger-button { color: blue; }
</style>

<style>
/* Teleported content uses non-scoped styles */
.my-modal { background: white; padding: 20px; }
.my-modal-text { color: blue; }
</style>
```

**Option 2:** Use CSS Modules. Class names are hashed at build time, so scoping doesn't depend on DOM position.

```vue
<template>
  <Teleport to="body">
    <div :class="$style.modal">
      <p :class="$style.text">Styled correctly</p>
    </div>
  </Teleport>
</template>

<style module>
.modal { background: white; padding: 20px; }
.text { color: blue; }
</style>
```

**Option 3:** Use `:deep()` from a scoped block.

```vue
<style scoped>
:deep(.modal) { background: white; }
:deep(.modal-text) { color: blue; }
</style>
```

This works but defeats the purpose of scoping. CSS Modules or a dedicated non-scoped block are cleaner solutions for teleported content.

See also: [What are Teleport, Fragments, and Suspense?](/q/teleport-fragments-suspense) · [How do scoped styles work?](/q/css-scoped-modules-dynamic) · [Why doesn't scoped CSS style child components?](/q/scoped-css-child-components)

## References

- [Teleport](https://vuejs.org/guide/built-ins/teleport.html) - Vue.js docs
- [Scoped CSS](https://vuejs.org/api/sfc-css-features.html#scoped-css) - Vue.js docs
