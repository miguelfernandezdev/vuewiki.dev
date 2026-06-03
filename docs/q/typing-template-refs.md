---
order: 108
title: 'How do you type template refs in TypeScript?'
difficulty: 'intermediate'
tags: ['typescript', 'components', 'watchers']
summary: "Declare as ref<HTMLElement | null>(null). Use optional chaining (el.value?.focus()) or access in onMounted where it's guaranteed to exist."
---

Template refs start as `null` and become the DOM element or component instance after mount. In TypeScript, you must account for this with a union type and guard access with optional chaining or lifecycle hooks.

## DOM element refs

```vue
<script setup lang="ts">
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <input ref="inputRef" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const inputRef = ref<HTMLInputElement | null>(null)
&#10;onMounted(() => {
  inputRef.value?.focus()
})
</script>
&#10;<template>
  <input ref=&quot;inputRef&quot; />
</template>" />

The type is `HTMLInputElement | null` because the ref is `null` during setup and becomes the element only after the component mounts.

## useTemplateRef (Vue 3.5+)

`useTemplateRef` separates the template ref name from the variable name and improves type inference:

```vue
<script setup lang="ts">
const input = useTemplateRef<HTMLInputElement>('my-input')

onMounted(() => {
  input.value?.focus()
})
</script>

<template>
  <input ref="my-input" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const input = useTemplateRef<HTMLInputElement>('my-input')
&#10;onMounted(() => {
  input.value?.focus()
})
</script>
&#10;<template>
  <input ref=&quot;my-input&quot; />
</template>" />

The string `'my-input'` matches the `ref` attribute in the template. The variable name `input` is independent.

## Component refs

Use `InstanceType<typeof Component>` to type a ref to a child component:

```vue
<script setup lang="ts">
import ChildForm from './ChildForm.vue'

const formRef = ref<InstanceType<typeof ChildForm> | null>(null)

function submit() {
  formRef.value?.validate()
}
</script>

<template>
  <ChildForm ref="formRef" />
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import ChildForm from './ChildForm.vue'
&#10;const formRef = ref<InstanceType<typeof ChildForm> | null>(null)
&#10;function submit() {
  formRef.value?.validate()
}
</script>
&#10;<template>
  <ChildForm ref=&quot;formRef&quot; />
</template>" />

The child must expose the method with `defineExpose`:

```vue
<!-- ChildForm.vue -->
<script setup lang="ts">
function validate() {
  // validation logic
  return isValid.value
}

defineExpose({ validate })
</script>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
function validate() {
  // validation logic
  return isValid.value
}
&#10;defineExpose({ validate })
</script>" />

Without `defineExpose`, the parent cannot access any of the child's internal state or methods.

## Refs with v-if

When an element is behind `v-if`, the ref becomes `null` again when the condition is false:

```vue
<script setup lang="ts">
const showModal = ref(false)
const modalRef = ref<HTMLDivElement | null>(null)

watch(modalRef, (el) => {
  if (el) {
    el.focus() // element just mounted
  }
})
</script>

<template>
  <div v-if="showModal" ref="modalRef" tabindex="-1">Modal content</div>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const showModal = ref(false)
const modalRef = ref<HTMLDivElement | null>(null)
&#10;watch(modalRef, (el) => {
  if (el) {
    el.focus() // element just mounted
  }
})
</script>
&#10;<template>
  <div v-if=&quot;showModal&quot; ref=&quot;modalRef&quot; tabindex=&quot;-1&quot;>Modal content</div>
</template>" />

Always use optional chaining or null checks when the ref target can be conditionally rendered.

## Refs with v-for

With `v-for`, the ref becomes an array. Use a function ref to populate it:

```vue
<script setup lang="ts">
const items = ref(['a', 'b', 'c'])
const itemRefs = ref<(HTMLLIElement | null)[]>([])

onMounted(() => {
  itemRefs.value[0]?.focus()
})
</script>

<template>
  <ul>
    <li
      v-for="(item, index) in items"
      :key="item"
      :ref="
        (el) => {
          itemRefs[index] = el as HTMLLIElement
        }
      "
    >
      {{ item }}
    </li>
  </ul>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
const items = ref(['a', 'b', 'c'])
const itemRefs = ref<(HTMLLIElement | null)[]>([])
&#10;onMounted(() => {
  itemRefs.value[0]?.focus()
})
</script>
&#10;<template>
  <ul>
    <li
      v-for=&quot;(item, index) in items&quot;
      :key=&quot;item&quot;
      :ref=&quot;
        (el) => {
          itemRefs[index] = el as HTMLLIElement
        }
      &quot;
    >
      {{ item }}
    </li>
  </ul>
</template>" />

## After async operations

If you `await` something inside `onMounted`, the component might have unmounted by the time the promise resolves:

```ts
onMounted(async () => {
  await fetchData()

  // component could be gone — check before accessing
  if (inputRef.value) {
    inputRef.value.scrollTop = 0
  }
})
```

## Quick reference

| Scenario              | Type                                                  |
| --------------------- | ----------------------------------------------------- |
| DOM element           | `ref<HTMLDivElement \| null>(null)`                   |
| Input element         | `ref<HTMLInputElement \| null>(null)`                 |
| Canvas element        | `ref<HTMLCanvasElement \| null>(null)`                |
| Child component       | `ref<InstanceType<typeof MyComponent> \| null>(null)` |
| Array from v-for      | `ref<(HTMLLIElement \| null)[]>([])`                  |
| useTemplateRef (3.5+) | `useTemplateRef<HTMLInputElement>('name')`            |

See also: [How do template refs work?](/q/template-refs) · [Why is a template ref null inside v-if?](/q/template-ref-null-v-if) · [What is defineExpose?](/q/define-expose)

## References

- [Typing Template Refs](https://vuejs.org/guide/typescript/composition-api.html#typing-template-refs) - Vue.js docs
- [useTemplateRef()](https://vuejs.org/api/composition-api-helpers.html#usetemplateref) - Vue.js docs
