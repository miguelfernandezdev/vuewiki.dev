---
order: 3
title: "What is script setup?"
difficulty: "beginner"
tags: ["composition-api"]
---

Syntactic sugar for the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) that removes boilerplate:
- No `return` needed, everything declared is available in the template
- No `export default` needed
- [defineProps](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits), [defineEmits](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits), `defineModel` are compiler macros (not imports)

```vue
<script setup lang="ts">
// Everything here is automatically accessible in the template
import { ref } from 'vue'

const count = ref(0)
function increment() { count.value++ }
</script>
```

See also: [What are all the compiler macros in Vue?](/q/compiler-macros) · [What is the Composition API and how does it differ from the Options API?](/q/composition-api-vs-options-api)

## References

- [\<script setup\>](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [SFC Syntax Specification](https://vuejs.org/api/sfc-spec.html) - Vue.js docs
