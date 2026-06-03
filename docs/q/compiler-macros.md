---
order: 58
title: 'What are all the compiler macros in Vue?'
difficulty: 'advanced'
tags: ['composition-api', 'typescript', 'v-model', 'slots']
summary: "defineProps, defineEmits, defineExpose, defineModel, defineSlots, and defineOptions. They run at compile time and don't need imports."
---

Compiler macros are special functions that only work inside [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html). They're processed at compile time and don't need to be imported. Vue 3.5 has six of them.

## defineProps

Declares the props the component accepts. Returns a reactive object.

```vue
<script setup lang="ts">
const props = defineProps<{
  title: string
  count?: number
}>()

// With defaults
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

Declares the events the component can emit. Returns a typed emit function.

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

Creates a two-way binding for `v-model`. Returns a ref that reads from the prop and emits on write.

```vue
<script setup lang="ts">
const name = defineModel<string>('name', { required: true })
const checked = defineModel<boolean>({ default: false })

// With custom modifiers
const [text, modifiers] = defineModel<string>({
  set(value) {
    return modifiers.trim ? value.trim() : value
  }
})
</script>
```

## defineExpose

Controls what the component exposes to parent template refs. Without it, `<script setup>` components expose nothing.

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

Sets component options that don't have a macro equivalent, like `name` and `inheritAttrs`.

```vue
<script setup>
defineOptions({
  name: 'MyComponent',
  inheritAttrs: false
})
</script>
```

Before 3.3, you needed a separate `<script>` block for these.

## defineSlots (Vue 3.3+)

Declares slot types for TypeScript. Returns the slots object (same as `useSlots()`).

```vue
<script setup lang="ts">
const slots = defineSlots<{
  default: (props: { item: User }) => any
  header: (props: { title: string }) => any
  empty: () => any
}>()
</script>
```

This doesn't change runtime behavior. It only provides type checking for slot props in the template and for consumers using the component.

## Summary table

| Macro           | Since | Purpose                      | Returns               |
| --------------- | ----- | ---------------------------- | --------------------- |
| `defineProps`   | 3.0   | Declare props                | Reactive props object |
| `defineEmits`   | 3.0   | Declare events               | Typed emit function   |
| `defineModel`   | 3.4   | Two-way v-model binding      | Writable ref          |
| `defineExpose`  | 3.0   | Control public API for refs  | void                  |
| `defineOptions` | 3.3   | Set name, inheritAttrs, etc. | void                  |
| `defineSlots`   | 3.3   | Type slot props              | Slots object          |

## Rules that apply to all macros

- They only work inside `<script setup>`, not in regular `<script>` or `.ts` files.
- Don't import them. The compiler removes them at build time.
- They must be called at the top level, not inside functions or conditionals.
- `defineProps` and `defineEmits` can't be used in the same component as their Options API equivalents (`props`, `emits`).

See also: [What is script setup?](/q/script-setup) · [What is defineExpose and when is it needed?](/q/define-expose)

## References

- [defineProps / defineEmits](https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits) - Vue.js docs
- [defineExpose](https://vuejs.org/api/sfc-script-setup.html#defineexpose) - Vue.js docs
- [script setup](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
