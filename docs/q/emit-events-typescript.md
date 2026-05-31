---
order: 5
title: "How do you emit events with TypeScript?"
difficulty: "beginner"
tags: ["typescript", "components"]
---

```vue
<script setup lang="ts">
const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
  submit: []
}>()

// Usage:
emit('update', 'new value')
emit('delete', 42)
emit('submit')
</script>
```
