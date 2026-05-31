---
order: 3
title: "¿Qué es script setup?"
difficulty: "beginner"
tags: ["composition-api"]
---

Azúcar sintáctico para la Composition API que elimina el código repetitivo:

- No hace falta `return` — todo lo que se declara está disponible en la plantilla
- No hace falta `export default`
- `defineProps`, `defineEmits`, `defineModel` son macros del compilador (no se importan)

```vue
<script setup lang="ts">
// Todo lo que se declara aquí es accesible automáticamente en la plantilla
import { ref } from 'vue'

const count = ref(0)
function increment() { count.value++ }
</script>
```
