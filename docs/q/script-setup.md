---
order: 54
title: 'What is script setup?'
difficulty: 'beginner'
tags: ['composition-api', 'v-model']
summary: '<script setup> is the recommended way to write Composition API. It removes boilerplate: no export default, no setup() function, no return statement.'
---

[`<script setup>`](https://vuejs.org/api/sfc-script-setup.html) is the recommended way to write Vue components using the Composition API. It removes boilerplate that you'd otherwise have to write manually, so you spend less time on wiring and more on actual logic.

## Before and after

Without `<script setup>`, a Composition API component requires `export default`, a `setup()` function, and an explicit `return` statement listing everything the template needs:

```vue
<!-- Without <script setup> — lots of boilerplate -->
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

<PlaygroundLink code="<!-- Without <script setup> — lots of boilerplate -->

<script lang=&quot;ts&quot;>
import { defineComponent, ref, computed } from 'vue'
&#10;export default defineComponent({
  props: {
    initialCount: { type: Number, default: 0 }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const count = ref(props.initialCount)
    const doubled = computed(() => count.value * 2)
&#10;    function increment() {
      count.value++
      emit('update', count.value)
    }
&#10;    return { count, doubled, increment }
  }
})
</script>" />

With `<script setup>`, all of that disappears. Every top-level variable, function, and import is automatically available in the template:

```vue
<!-- With <script setup> — same result, half the code -->
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

<PlaygroundLink code="<!-- With <script setup> — same result, half the code -->

<script setup lang=&quot;ts&quot;>
import { ref, computed } from 'vue'
&#10;const props = defineProps<{ initialCount?: number }>()
const emit = defineEmits<{ update: [value: number] }>()
&#10;const count = ref(props.initialCount ?? 0)
const doubled = computed(() => count.value * 2)
&#10;function increment() {
  count.value++
  emit('update', count.value)
}
</script>" />

No `export default`. No `setup()` function. No `return` statement. Everything declared at the top level is exposed to the template automatically.

## Compiler macros

`<script setup>` introduces [compiler macros](/q/compiler-macros), special functions that the Vue compiler processes at build time. They don't need to be imported:

- **`defineProps`**: declares props with full TypeScript type inference
- **`defineEmits`**: declares events the component can emit
- **`defineModel`**: declares a two-way binding prop (v-model)
- **`defineExpose`**: explicitly exposes values to parent template refs

```vue
<script setup lang="ts">
const props = defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const model = defineModel<string>()

defineExpose({
  reset() {
    /* ... */
  }
})
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const props = defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const model = defineModel<string>()
&#10;defineExpose({
  reset() {
    /* ... */
  }
})
</script>" />

## When you still need a regular `<script>`

Occasionally you need both `<script setup>` and a regular `<script>` block in the same component. For example, to set `inheritAttrs: false` or declare named exports:

```vue
<script lang="ts">
export default { inheritAttrs: false }
</script>

<script setup lang="ts">
const attrs = useAttrs()
</script>
```

<PlaygroundLink code="<script lang=&quot;ts&quot;>
export default { inheritAttrs: false }
</script>
&#10;<script setup lang=&quot;ts&quot;>
const attrs = useAttrs()
</script>" />

This is rare. For the vast majority of components, `<script setup>` alone is all you need.

See also: [What are all the compiler macros in Vue?](/q/compiler-macros) · [What is the Composition API and how does it differ from the Options API?](/q/composition-api-vs-options-api)

## References

- [\<script setup\>](https://vuejs.org/api/sfc-script-setup.html) - Vue.js docs
- [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html) - Vue.js docs
- [SFC Syntax Specification](https://vuejs.org/api/sfc-spec.html) - Vue.js docs
