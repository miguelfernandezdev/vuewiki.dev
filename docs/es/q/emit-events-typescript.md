---
order: 5
title: "¿Cómo se emiten eventos con TypeScript?"
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

// Uso:
emit('update', 'new value')
emit('delete', 42)
emit('submit')
</script>
```
