---
order: 23
title: "How would you design a shared component library?"
difficulty: "advanced"
tags: ["components", "architecture"]
---

1. **Separate package** (monorepo or standalone repo)
2. **Each component:** Typed props, typed emits, slots for flexibility
3. **Documentation:** VitePress or Storybook with interactive examples
4. **Design tokens:** CSS custom properties for theming (`--color-primary`, etc.)
5. **Testing:** Vitest for unit tests + visual regression tests
6. **Versioning:** Semver so teams can upgrade at their own pace
7. **Tree-shaking:** Named exports so only what's used gets included
8. **Accessibility:** ARIA, keyboard navigation, focus management

```ts
// Good library component
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false
})

defineEmits<{ click: [event: MouseEvent] }>()
</script>
```
