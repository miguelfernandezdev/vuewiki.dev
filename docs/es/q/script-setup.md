---
order: 54
title: "¿Qué es script setup?"
difficulty: "beginner"
tags: ["composition-api", "v-model"]
summary: "<script setup> es la forma recomendada de escribir Composition API. Elimina boilerplate: sin export default, sin función setup(), sin return."
---

[`<script setup>`](https://vuejs.org/api/sfc-script-setup.html) es la forma recomendada de escribir componentes Vue usando la Composition API. Elimina el código repetitivo que de otro modo tendrías que escribir manualmente, así que dedicas menos tiempo al código de conexión y más a la lógica real.

## Antes y después

Sin `<script setup>`, un componente de Composition API requiere `export default`, una función `setup()`, y una declaración `return` explícita que liste todo lo que la plantilla necesita:

```vue
<!-- Sin <script setup> — mucho código repetitivo -->
<script lang="ts">
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  props: {
    initialCount: { type: Number, default: 0 }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const count = ref(props.initialCount)
    const doubled = computed(() => count.value * 2)

    function increment() {
      count.value++
      emit('update', count.value)
    }

    return { count, doubled, increment }
  }
})
</script>
```

Con `<script setup>`, todo eso desaparece. Cada variable, función e importación del nivel superior queda disponible automáticamente en la plantilla:

```vue
<!-- Con <script setup> — mismo resultado, la mitad del código -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ initialCount?: number }>()
const emit = defineEmits<{ update: [value: number] }>()

const count = ref(props.initialCount ?? 0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
  emit('update', count.value)
}
</script>
```

Sin `export default`. Sin función `setup()`. Sin declaración `return`. Todo lo declarado en el nivel superior se expone a la plantilla automáticamente.

## Macros del compilador

`<script setup>` introduce [macros del compilador](/es/q/compiler-macros) — funciones especiales que el compilador de Vue procesa en tiempo de compilación. No necesitan importarse:

- **`defineProps`** — declara props con inferencia completa de tipos TypeScript
- **`defineEmits`** — declara los eventos que el componente puede emitir
- **`defineModel`** — declara una prop de enlace bidireccional (v-model)
- **`defineExpose`** — expone explícitamente valores a las refs de plantilla del padre

```vue
<script setup lang="ts">
const props = defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const model = defineModel<string>()

defineExpose({ reset() { /* ... */ } })
</script>
```

## Cuándo todavía necesitas un `<script>` normal

Ocasionalmente necesitas tanto `<script setup>` como un bloque `<script>` normal en el mismo componente — por ejemplo, para establecer `inheritAttrs: false` o declarar exportaciones con nombre:

```vue
<script lang="ts">
export default { inheritAttrs: false }
</script>

<script setup lang="ts">
const attrs = useAttrs()
</script>
```

Esto es poco frecuente. Para la gran mayoría de componentes, `<script setup>` solo es todo lo que necesitas.

Ver también: [¿Cuáles son todas las macros del compilador en Vue?](/es/q/compiler-macros) · [¿Qué es la Composition API y en qué se diferencia de la Options API?](/es/q/composition-api-vs-options-api)

## Referencias

- [\<script setup\>](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [SFC Syntax Specification](https://vuejs.org/api/sfc-spec.html) - Vue.js docs
