---
order: 1
title: "What is the Composition API and how does it differ from the Options API?"
difficulty: "beginner"
tags: ["composition-api"]
---

The **Options API** (Vue 2) organizes code by option type (`data`, `methods`, `computed`, `watch`). The **Composition API** (Vue 3) organizes code by logic/feature, using functions like `ref()`, `computed()`, `watch()` inside `setup()` or `<script setup>`.

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
