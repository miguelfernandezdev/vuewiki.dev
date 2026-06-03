---
order: 58
title: '¿Cuáles son todas las macros del compilador en Vue?'
difficulty: 'advanced'
tags: ['composition-api', 'typescript', 'v-model', 'slots']
summary: 'defineProps, defineEmits, defineExpose, defineModel, defineSlots y defineOptions. Se ejecutan en compilación y no necesitan imports.'
---

Las macros del compilador son funciones especiales que solo funcionan dentro de [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html). Se procesan en tiempo de compilación y no necesitan ser importadas. Vue 3.5 tiene seis de ellas.

## defineProps

Declara las props que acepta el componente. Devuelve un objeto reactivo.

```vue
<script setup lang="ts">
const props = defineProps<{
  title: string
  count?: number
}>()

// Con valores por defecto
const props = withDefaults(
  defineProps<{
    title: string
    items?: string[]
  }>(),
  {
    items: () => []
  }
)
</script>
```

## defineEmits

Declara los eventos que puede emitir el componente. Devuelve una función emit tipada.

```vue
<script setup lang="ts">
const emit = defineEmits<{
  submit: [data: FormData]
  cancel: []
}>()

emit('submit', formData)
</script>
```

## defineModel (Vue 3.4+)

Crea un enlace bidireccional para `v-model`. Devuelve una ref que lee de la prop y emite al escribir.

```vue
<script setup lang="ts">
const name = defineModel<string>('name', { required: true })
const checked = defineModel<boolean>({ default: false })

// Con modificadores personalizados
const [text, modifiers] = defineModel<string>({
  set(value) {
    return modifiers.trim ? value.trim() : value
  }
})
</script>
```

## defineExpose

Controla lo que el componente expone a las template refs del padre. Sin ella, los componentes `<script setup>` no exponen nada.

```vue
<script setup>
import { ref } from 'vue'

const count = ref(0)
function reset() {
  count.value = 0
}

defineExpose({ count, reset })
</script>
```

## defineOptions (Vue 3.3+)

Establece opciones del componente que no tienen una macro equivalente, como `name` e `inheritAttrs`.

```vue
<script setup>
defineOptions({
  name: 'MyComponent',
  inheritAttrs: false
})
</script>
```

Antes de la versión 3.3, necesitabas un bloque `<script>` separado para esto.

## defineSlots (Vue 3.3+)

Declara los tipos de slot para TypeScript. Devuelve el objeto de slots (igual que `useSlots()`).

```vue
<script setup lang="ts">
const slots = defineSlots<{
  default: (props: { item: User }) => any
  header: (props: { title: string }) => any
  empty: () => any
}>()
</script>
```

No cambia el comportamiento en tiempo de ejecución. Solo proporciona comprobación de tipos para las props de slot en el template y para los consumidores que usan el componente.

## Tabla resumen

| Macro           | Desde | Propósito                           | Devuelve                 |
| --------------- | ----- | ----------------------------------- | ------------------------ |
| `defineProps`   | 3.0   | Declarar props                      | Objeto reactivo de props |
| `defineEmits`   | 3.0   | Declarar eventos                    | Función emit tipada      |
| `defineModel`   | 3.4   | Enlace v-model bidireccional        | Ref escribible           |
| `defineExpose`  | 3.0   | Controlar la API pública para refs  | void                     |
| `defineOptions` | 3.3   | Establecer name, inheritAttrs, etc. | void                     |
| `defineSlots`   | 3.3   | Tipar props de slot                 | Objeto de slots          |

## Reglas que aplican a todas las macros

- Solo funcionan dentro de `<script setup>`, no en `<script>` normal ni en archivos `.ts`.
- No las importes. El compilador las elimina en tiempo de compilación.
- Deben llamarse en el nivel superior, no dentro de funciones o condicionales.
- `defineProps` y `defineEmits` no pueden usarse en el mismo componente que sus equivalentes de la Options API (`props`, `emits`).

Ver también: [¿Qué es script setup?](/es/q/script-setup) · [¿Qué es defineExpose y cuándo es necesario?](/es/q/define-expose)

## Referencias

- [defineProps / defineEmits](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
- [defineExpose](https://vuejs.org/api/sfc-script-setup.html#defineexpose) - Vue.js docs
- [script setup](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
