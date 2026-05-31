---
order: 3
title: "What is script setup?"
difficulty: "beginner"
---

Syntactic sugar for the Composition API that removes boilerplate:
- No `return` needed — everything declared is available in the template
- No `export default` needed
- `defineProps`, `defineEmits`, `defineModel` are compiler macros (not imports)

```vue
<script setup lang="ts">
// Everything here is automatically accessible in the template
import { ref } from 'vue'

const count = ref(0)
function increment() { count.value++ }
</script>
```
