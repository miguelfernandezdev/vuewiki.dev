---
order: 170
title: 'How do you manage focus in Vue SPAs?'
difficulty: 'advanced'
tags: ['accessibility', 'vue-router', 'watchers', 'suspense']
summary: 'Move focus to the main heading after route changes, trap focus inside modals, and restore focus when dynamic content is dismissed.'
---

In a traditional website, the browser moves focus to the top of the page on every navigation. SPAs break this because the page never reloads. After a client-side route change, focus stays wherever it was, which means a screen reader user has no idea the page changed. You need to move focus manually on route changes, trap it inside modals, and return it when dynamic content is dismissed.

## Focus on route changes

Move focus to the main heading after each navigation:

```ts
// router/index.ts
router.afterEach((to, from) => {
  if (to.path === from.path) return

  nextTick(() => {
    const heading = document.querySelector('h1')
    if (heading instanceof HTMLElement) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: false })
    }
  })
})
```

`tabindex="-1"` makes the heading programmatically focusable without adding it to the tab order. `nextTick` ensures the new page has rendered before trying to focus.

An alternative is a route announcer that reads the page title without moving visible focus:

```vue
<!-- App.vue -->
<script setup>
const route = useRoute()
const announcement = ref('')

watch(
  () => route.path,
  () => {
    nextTick(() => {
      announcement.value = document.title
    })
  }
)
</script>

<template>
  <div aria-live="assertive" aria-atomic="true" class="sr-only">
    {{ announcement }}
  </div>
  <RouterView />
</template>
```

<PlaygroundLink code="<!-- App.vue -->
<script setup>
const route = useRoute()
const announcement = ref('')
&#10;watch(
  () => route.path,
  () => {
    nextTick(() => {
      announcement.value = document.title
    })
  }
)
</script>
&#10;<template>
  <div aria-live=&quot;assertive&quot; aria-atomic=&quot;true&quot; class=&quot;sr-only&quot;>
    {{ announcement }}
  </div>
  <RouterView />
</template>" />

</template>" />

This announces the new page title to screen readers without disrupting visual focus, which can be better for sighted keyboard users who don't want their scroll position to jump.

## Focus trapping in modals

When a modal opens, focus must stay inside it until it closes. The native `<dialog>` element with `showModal()` handles this automatically:

```vue
<script setup>
const dialogRef = ref<HTMLDialogElement>()
const triggerRef = ref<HTMLElement>()

function open() {
  dialogRef.value?.showModal()
}

function close() {
  dialogRef.value?.close()
  triggerRef.value?.focus()
}
</script>

<template>
  <button ref="triggerRef" @click="open">Settings</button>

  <dialog ref="dialogRef" @close="triggerRef?.focus()">
    <h2>Settings</h2>
    <label>
      Name
      <input type="text" />
    </label>
    <button @click="close">Done</button>
  </dialog>
</template>
```

<PlaygroundLink code="<script setup>
const dialogRef = ref<HTMLDialogElement>()
const triggerRef = ref<HTMLElement>()
&#10;function open() {
  dialogRef.value?.showModal()
}
&#10;function close() {
  dialogRef.value?.close()
  triggerRef.value?.focus()
}
</script>
&#10;<template>
  <button ref=&quot;triggerRef&quot; @click=&quot;open&quot;>Settings</button>
&#10;  <dialog ref=&quot;dialogRef&quot; @close=&quot;triggerRef?.focus()&quot;>
    <h2>Settings</h2>
    <label>
      Name
      <input type=&quot;text&quot; />
    </label>
    <button @click=&quot;close&quot;>Done</button>
  </dialog>
</template>" />

</label>
<button @click=&quot;close&quot;>Done</button>

  </dialog>
</template>" />

`showModal()` does three things the browser handles for you: moves focus to the first focusable element inside, traps tab cycling within the dialog, and restores focus when the dialog closes via the Escape key.

If you need a custom modal without `<dialog>`, you have to implement the trap yourself:

```ts
// composables/useFocusTrap.ts
export function useFocusTrap(containerRef: Ref<HTMLElement | undefined>) {
  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const container = containerRef.value
    if (!container) return

    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}
```

## Focus after dynamic content

When content appears or disappears dynamically, move focus to where the user needs to be:

```vue
<script setup>
const items = ref([...])
const listRef = ref<HTMLElement>()

async function deleteItem(id: number) {
  const index = items.value.findIndex(i => i.id === id)
  items.value = items.value.filter(i => i.id !== id)

  await nextTick()

  if (items.value.length === 0) {
    listRef.value?.focus()
  }
}
</script>

<template>
  <ul ref="listRef" tabindex="-1" aria-label="Items">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
      <button @click="deleteItem(item.id)">Delete</button>
    </li>
  </ul>
  <p v-if="items.length === 0">No items remaining.</p>
</template>
```

<PlaygroundLink code="<script setup>
const items = ref([...])
const listRef = ref<HTMLElement>()
&#10;async function deleteItem(id: number) {
  const index = items.value.findIndex(i => i.id === id)
  items.value = items.value.filter(i => i.id !== id)
&#10;  await nextTick()
&#10;  if (items.value.length === 0) {
    listRef.value?.focus()
  }
}
</script>
&#10;<template>
  <ul ref=&quot;listRef&quot; tabindex=&quot;-1&quot; aria-label=&quot;Items&quot;>
    <li v-for=&quot;item in items&quot; :key=&quot;item.id&quot;>
      {{ item.name }}
      <button @click=&quot;deleteItem(item.id)&quot;>Delete</button>
    </li>
  </ul>
  <p v-if=&quot;items.length === 0&quot;>No items remaining.</p>
</template>" />

Without this, deleting the focused element leaves the user's focus in limbo, which is disorienting.

## Skip links

Let keyboard users bypass repetitive navigation:

```vue
<!-- App.vue -->
<template>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <TheNavbar />
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
</template>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: white;
}
.skip-link:focus {
  top: 0;
}
</style>
```

<PlaygroundLink code="<!-- App.vue -->
<template>
  <a href=&quot;#main-content&quot; class=&quot;skip-link&quot;>Skip to content</a>
  <TheNavbar />
  <main id=&quot;main-content&quot; tabindex=&quot;-1&quot;>
    <RouterView />
  </main>
</template>
&#10;<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: white;
}
.skip-link:focus {
  top: 0;
}
</style>" />

  <main id=&quot;main-content&quot; tabindex=&quot;-1&quot;>
    <RouterView />
  </main>
</template>
&#10;<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: white;
}
.skip-link:focus {
  top: 0;
}
</style>" />

The link is hidden until it receives focus, then it jumps to the top of the screen.

## Summary

| Scenario        | Action                                                    |
| --------------- | --------------------------------------------------------- |
| Route change    | Move focus to `h1` or announce page title via live region |
| Modal opens     | Use `<dialog>` with `showModal()`, or trap focus manually |
| Modal closes    | Return focus to the element that triggered it             |
| Item deleted    | Move focus to the next item or the list container         |
| Content loaded  | Focus the new content or announce it with `aria-live`     |
| Skip navigation | Provide a skip link as the first focusable element        |

See also: [How do you handle accessibility in Vue?](/q/accessibility-in-vue) · [How does Vue Router work?](/q/vue-router-navigation-guards) · [What are teleport, fragments, and Suspense?](/q/teleport-fragments-suspense)

## References

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - W3C
- [Managing Focus in Single Page Applications](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Focus_management) - MDN
- [The dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) - MDN
