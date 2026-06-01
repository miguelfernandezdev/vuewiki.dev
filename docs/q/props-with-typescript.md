---
order: 4
title: "How do you declare props with TypeScript in Vue 3?"
difficulty: "beginner"
tags: ["typescript", "components"]
---

```vue
<script setup lang="ts">
// With interface
interface Props {
  title: string
  count?: number
  items: string[]
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
</script>
```

`defineProps` is a **compiler macro**. It's not imported, Vue processes it at build time.
