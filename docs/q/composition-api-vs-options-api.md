---
order: 1
title: "What is the Composition API and how does it differ from the Options API?"
difficulty: "beginner"
tags: ["composition-api"]
---

The **[Options API](https://vuejs.org/guide/introduction.html#options-api)** (Vue 2) organizes code by option type (`data`, `methods`, `computed`, `watch`). The **[Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)** (Vue 3) organizes code by logic/feature, using functions like `ref()`, `computed()`, `watch()` inside `setup()` or `<script setup>`.

```vue
<!-- Options API (Vue 2 style) -->
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

**Key advantage:** In the Composition API, related logic stays together (instead of being scattered across `data`, `methods`, etc.), making it easy to extract into reusable **composables**.

See also: [What is script setup?](/q/script-setup) · [What is a composable?](/q/what-is-a-composable)

## References

- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Introduction: Options API vs Composition API](https://vuejs.org/guide/introduction.html#options-api) - Vue.js docs
- [script setup](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
