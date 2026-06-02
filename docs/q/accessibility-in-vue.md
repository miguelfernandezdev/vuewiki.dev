---
order: 169
title: "How do you handle accessibility in Vue?"
difficulty: "intermediate"
tags: ["accessibility", "components", "teleport"]
summary: "Use semantic HTML, add ARIA only when native semantics aren't enough, manage focus on route changes, and test with screen readers."
---

Start with semantic HTML elements instead of divs. Add ARIA attributes only when native semantics aren't enough. Manage focus explicitly on route changes and dynamic content. Vue doesn't add any barriers to accessibility, but it doesn't add any guardrails either. It's on you.

## Semantic HTML first

The most impactful accessibility decision has nothing to do with Vue:

```vue
<!-- BAD: div soup with ARIA band-aids -->
<template>
  <div role="navigation">
    <div role="list">
      <div role="listitem" @click="navigate">Home</div>
    </div>
  </div>
</template>

<!-- GOOD: native elements that work out of the box -->
<template>
  <nav aria-label="Main navigation">
    <ul>
      <li><RouterLink to="/">Home</RouterLink></li>
    </ul>
  </nav>
</template>
```

Native elements give you keyboard support, screen reader announcements, and focus behavior for free. ARIA can't add functionality, it can only describe what's already there.

## ARIA attributes in Vue templates

Bind ARIA attributes dynamically when state drives the UI:

```vue
<script setup>
const isExpanded = ref(false)
const panelId = useId()
</script>

<template>
  <button
    :aria-expanded="isExpanded"
    :aria-controls="panelId"
    @click="isExpanded = !isExpanded"
  >
    Details
  </button>
  <div
    v-show="isExpanded"
    :id="panelId"
    role="region"
  >
    Panel content
  </div>
</template>
```

`useId()` (Vue 3.5+) generates a unique ID for each component instance, avoiding duplicate IDs when the component is reused.

## Focus management

SPAs break the default browser behavior where page navigation moves focus to the top of the new page. You need to handle this manually:

```ts
// router/index.ts
router.afterEach((to, from) => {
  if (to.path !== from.path) {
    nextTick(() => {
      const heading = document.querySelector('h1')
      if (heading instanceof HTMLElement) {
        heading.setAttribute('tabindex', '-1')
        heading.focus()
      }
    })
  }
})
```

For modals and dialogs, trap focus inside the element and return it when the modal closes:

```vue
<script setup>
const triggerRef = ref<HTMLElement>()
const dialogRef = ref<HTMLElement>()

function openModal() {
  isOpen.value = true
  nextTick(() => dialogRef.value?.focus())
}

function closeModal() {
  isOpen.value = false
  triggerRef.value?.focus()
}
</script>

<template>
  <button ref="triggerRef" @click="openModal">Open</button>

  <dialog
    v-if="isOpen"
    ref="dialogRef"
    tabindex="-1"
    @keydown.escape="closeModal"
  >
    <h2>Dialog title</h2>
    <p>Content here</p>
    <button @click="closeModal">Close</button>
  </dialog>
</template>
```

Using the native `<dialog>` element handles focus trapping automatically when opened with `showModal()`.

## Live regions for dynamic content

When content updates without a page reload, screen readers won't announce it unless you use a live region:

```vue
<script setup>
const notification = ref('')

async function save() {
  await submitForm()
  notification.value = 'Changes saved successfully'
}
</script>

<template>
  <form @submit.prevent="save">
    <!-- form fields -->
    <button type="submit">Save</button>
  </form>

  <div aria-live="polite" role="status" class="sr-only">
    {{ notification }}
  </div>
</template>
```

`aria-live="polite"` waits for the screen reader to finish its current announcement. Use `aria-live="assertive"` only for urgent messages like errors.

## Visually hidden but accessible

Content that should be available to screen readers but not visible on screen:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

```vue
<template>
  <button @click="removeItem(item)">
    <TrashIcon />
    <span class="sr-only">Remove {{ item.name }}</span>
  </button>
</template>
```

Without the visually hidden text, a screen reader would just announce "button" with no indication of what it does.

## Checklist

| Area | What to do |
|---|---|
| Semantic HTML | Use `nav`, `main`, `button`, `ul`, `dialog` instead of divs |
| ARIA | Only add when native semantics aren't enough. Bind dynamically with `:aria-*` |
| Focus | Manage on route changes, modals, and dynamic content |
| Live regions | Announce dynamic content changes with `aria-live` |
| Keyboard | Ensure all interactive elements are reachable and operable with keyboard |
| Color contrast | Minimum 4.5:1 for text, 3:1 for large text (WCAG AA) |
| Labels | Every form input needs a visible `<label>` or `aria-label` |

See also: [How do you handle complex forms?](/q/complex-forms) · [How does Teleport work?](/q/teleport-fragments-suspense) · [How do template refs work?](/q/template-refs)

## References

- [Accessibility](https://vuejs.org/guide/best-practices/accessibility.html) - Vue.js docs
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/) - W3C
- [Vue A11y](https://vue-a11y.com/) - Vue accessibility community resources
