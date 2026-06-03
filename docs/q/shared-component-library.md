---
order: 49
title: "How would you design a shared component library?"
difficulty: "advanced"
tags: ["components", "architecture", "vite", "vitest", "slots"]
summary: "Each component is self-contained with typed props, emits, and slots. Ship as a package with tree-shakeable exports, theming via CSS variables."
---

A shared component library gives multiple apps (or teams) a consistent set of UI components. The goal is reusability without coupling. Each consumer imports what they need, gets type safety and theming, and can upgrade on their own schedule.

## Project structure

The library lives in its own package, either a standalone repo or a workspace within a monorepo. Each component is a self-contained unit with typed props, typed emits, and slots for flexibility:

```text
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.vue
│   │   │   └── index.ts
│   │   ├── Input/
│   │   └── Modal/
│   ├── tokens/
│   │   └── colors.css
│   └── index.ts          ← named exports for tree-shaking
├── package.json
└── vite.config.ts         ← library mode build
```

## Component design principles

**Type everything.** Every component should have typed props, typed emits, and typed slots. Consumers get autocomplete and compile-time errors:

```vue
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md'
})

defineEmits<{
  click: [event: MouseEvent]
}>()

defineSlots<{
  default: () => void
  icon?: () => void
}>()
</script>
```

**Use slots over props for content.** A button that takes `label` and `icon` props is limited. A button with a default slot and an `icon` slot lets consumers put anything inside: text, icons, badges, complex markup.

**Use CSS custom properties for theming.** Don't hardcode colors or spacing. Expose design tokens that consumers can override:

```css
.btn {
  background: var(--ui-color-primary, #3b82f6);
  padding: var(--ui-spacing-md, 0.75rem 1.5rem);
  border-radius: var(--ui-radius, 0.375rem);
}
```

Consumers override tokens at the app level without touching library code.

## Build and distribution

Use [Vite library mode](https://vite.dev/guide/build.html#library-mode) to build. Export named components for tree-shaking so consumers only bundle what they import:

```ts
// src/index.ts
export { default as Button } from './components/Button/Button.vue'
export { default as Input } from './components/Input/Input.vue'
export { default as Modal } from './components/Modal/Modal.vue'
```

Set `sideEffects: false` in `package.json` so bundlers can eliminate unused components.

## Documentation

Use [VitePress](https://vitepress.dev/) or [Storybook](https://storybook.js.org/) for interactive docs. Each component should have live examples showing variants, sizes, slots, and edge cases. Storybook is more feature-rich for component development (visual testing, accessibility checks); VitePress is lighter if your docs also cover usage guides and API reference.

## Versioning and testing

- **Semver**: breaking prop changes are major bumps, new components are minor
- **Vitest** for unit tests (prop rendering, emit behavior, slot content)
- **Visual regression** (Chromatic, Percy, or Playwright screenshots) to catch unintended style changes

See also: [How do you declare props with TypeScript?](/q/props-with-typescript) · [What are slots?](/q/slots) · [What are fallthrough attributes?](/q/fallthrough-attrs)

## References

- [Library Mode](https://vite.dev/guide/build.html#library-mode) - Vite docs
- [Storybook for Vue](https://storybook.js.org/docs/get-started/frameworks/vue3-vite) - Storybook docs
- [VitePress](https://vitepress.dev/) - VitePress docs
