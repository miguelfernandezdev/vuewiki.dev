---
order: 1
title: "¿Qué es la Composition API y en qué se diferencia de la Options API?"
difficulty: "beginner"
tags: ["composition-api"]
---

La **[Options API](https://vuejs.org/guide/introduction.html#options-api)** (Vue 2) organiza el código por tipo de opción (`data`, `methods`, `computed`, `watch`). La **[Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)** (Vue 3) organiza el código por lógica/funcionalidad, usando funciones como `ref()`, `computed()`, `watch()` dentro de `setup()` o `<script setup>`.

```vue
<!-- Options API (estilo Vue 2) -->
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() { return this.count * 2 }
  },
  methods: {
    increment() { this.count++ }
  }
}
</script>

<!-- Composition API (Vue 3) -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
function increment() { count.value++ }
</script>
```

**Ventaja clave:** Con la Composition API, la lógica relacionada se mantiene junta (en lugar de estar dispersa entre `data`, `methods`, etc.), lo que facilita extraerla en **composables** reutilizables.

Ver también: [¿Qué es script setup?](/es/q/script-setup) · [¿Qué es un composable?](/es/q/what-is-a-composable)

## Referencias

- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Introducción: Options API vs Composition API](https://vuejs.org/guide/introduction.html#options-api) - Vue.js docs
- [script setup](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
