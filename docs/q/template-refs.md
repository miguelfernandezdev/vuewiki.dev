---
order: 33
title: "How do template refs work?"
difficulty: "intermediate"
tags: ["components", "composition-api"]
summary: "Add ref=\\\"name\\\" in the template and declare a matching ref() in script. After mount, it holds the DOM element or child component instance."
---

Template refs give you direct access to a DOM element or child component instance. You add a `ref` attribute in the template and read the corresponding value in script after the component mounts. See the [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) guide for full details.

## Legacy pattern (before Vue 3.5)

The variable name in script must match the `ref` attribute exactly. If they don't match, the ref is silently `null` with no warning.

```vue
<script setup>
import { ref, onMounted } from 'vue'

const inputEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputEl.value?.focus()
})
</script>

<template>
  <!-- name MUST be "inputEl" to match the variable -->
  <input ref="inputEl" />
</template>
```

The fragile part: rename the variable during refactoring and the connection breaks silently.

## useTemplateRef (Vue 3.5+)

[`useTemplateRef`](https://vuejs.org/guide/essentials/template-refs.html) decouples the variable name from the ref attribute. The string argument is the connection point, and the variable can be called anything.

```vue
<script setup>
import { useTemplateRef, onMounted } from 'vue'

const searchInput = useTemplateRef('search-box')

onMounted(() => {
  searchInput.value?.focus()
})
</script>

<template>
  <input ref="search-box" type="search" />
</template>
```

Benefits: IDE auto-completion for ref names, better TypeScript inference, and typos cause visible errors instead of silent nulls.

## Refs with v-for

When used inside `v-for`, the ref is automatically populated with an array of elements.

### useTemplateRef (Vue 3.5+, recommended)

```vue
<script setup>
import { useTemplateRef, onMounted } from 'vue'

const itemRefs = useTemplateRef<HTMLLIElement[]>('items')

onMounted(() => {
  itemRefs.value?.forEach(el => {
    console.log(el.textContent)
  })
})
</script>

<template>
  <ul>
    <li v-for="item in items" ref="items" :key="item.id">
      {{ item.text }}
    </li>
  </ul>
</template>
```

### ref() pattern (before Vue 3.5)

```vue
<script setup>
import { ref, onMounted } from 'vue'

const itemRefs = ref<HTMLLIElement[]>([])

onMounted(() => {
  itemRefs.value.forEach(el => {
    console.log(el.textContent)
  })
})
</script>

<template>
  <ul>
    <li v-for="item in items" ref="itemRefs" :key="item.id">
      {{ item.text }}
    </li>
  </ul>
</template>
```

## Refs on components

A template ref on a child component gives you the component's public instance, not a DOM element. With `<script setup>`, the child exposes nothing by default. You need `defineExpose` to make properties accessible.

```vue
<!-- ChildForm.vue -->
<script setup>
import { ref } from 'vue'

const formData = ref({ name: '' })

function validate() {
  return formData.value.name.length > 0
}

defineExpose({ validate })
</script>
```

```vue
<!-- Parent.vue -->
<script setup>
import { useTemplateRef } from 'vue'

const formRef = useTemplateRef('child-form')

function submit() {
  if (formRef.value?.validate()) {
    // proceed
  }
}
</script>

<template>
  <ChildForm ref="child-form" />
  <button @click="submit">Submit</button>
</template>
```

## When to use template refs

| Situation | Use a ref? |
|---|---|
| Focus an input, scroll to element | Yes |
| Integrate a non-Vue library (chart, map) | Yes |
| Read element dimensions | Yes |
| Change text or toggle classes | No, use reactive data and bindings |
| Listen to events | No, use `@event` |

See also: [What is defineExpose and when is it needed?](/q/define-expose) · [Can you use await directly in script setup?](/q/await-in-script-setup)

## References

- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [useTemplateRef](https://vuejs.org/api/composition-api-helpers.html#usetemplateref) - Vue.js docs
- [defineExpose](https://vuejs.org/api/sfc-script-setup.html#defineexpose) - Vue.js docs
