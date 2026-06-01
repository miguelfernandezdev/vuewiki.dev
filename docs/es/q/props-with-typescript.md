---
order: 4
title: "¿Cómo se declaran props con TypeScript en Vue 3?"
difficulty: "beginner"
tags: ["typescript", "components"]
---

```vue
<script setup lang="ts">
// Con interfaz
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

`defineProps` es una **macro del compilador**. No se importa, Vue la procesa en tiempo de compilación.
