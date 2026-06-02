---
order: 3
title: "¿Qué es script setup?"
difficulty: "beginner"
tags: ["composition-api"]
---

Azúcar sintáctico para la [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html) que elimina el código repetitivo:

- No hace falta `return`, todo lo que se declara está disponible en la plantilla
- No hace falta `export default`
- [defineProps](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits), [defineEmits](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits), `defineModel` son macros del compilador (no se importan)

```vue
<script setup lang="ts">
// Todo lo que se declara aquí es accesible automáticamente en la plantilla
import { ref } from 'vue'

const count = ref(0)
function increment() { count.value++ }
</script>
```

Ver también: [¿Cuáles son todas las macros del compilador en Vue?](/es/q/compiler-macros) · [¿Qué es la Composition API y en qué se diferencia de la Options API?](/es/q/composition-api-vs-options-api)

## Referencias

- [\<script setup\>](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [Especificación SFC](https://vuejs.org/api/sfc-spec.html) - Vue.js docs
