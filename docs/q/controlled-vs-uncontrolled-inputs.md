---
order: 39
title: "What is the difference between controlled and uncontrolled inputs?"
difficulty: "intermediate"
tags: ["components", "forms", "v-model"]
---

A controlled input has its value driven by reactive state. Every keystroke updates the state, and the state dictates what the input displays. An uncontrolled input manages its own value internally through the DOM. You read it when needed (on submit, on blur) rather than tracking every change.

## Controlled (v-model)

```vue
<script setup>
import { ref } from 'vue'

const name = ref('')
</script>

<template>
  <input v-model="name" />
  <p>Current value: {{ name }}</p>
</template>
```

Every character the user types flows through: input event → update `name` → Vue re-renders → input shows new value. You always have the current value in `name`.

## Uncontrolled (template ref)

```vue
<script setup>
import { useTemplateRef } from 'vue'

const inputEl = useTemplateRef('name-input')

function handleSubmit() {
  const value = inputEl.value?.value
  console.log('Submitted:', value)
}
</script>

<template>
  <input ref="name-input" />
  <button @click="handleSubmit">Submit</button>
</template>
```

The DOM owns the value. You only read it when you need it.

## When to use which

| Situation | Approach | Why |
|---|---|---|
| Real-time validation | Controlled | You need the value on every keystroke |
| Derived display (character count, preview) | Controlled | Computed properties depend on the value |
| Conditional logic (disable button until valid) | Controlled | Template needs reactive access |
| Simple form submitted on button click | Either works | Uncontrolled is simpler if you don't need live updates |
| File inputs | Uncontrolled | `<input type="file">` is read-only, v-model doesn't apply |
| Third-party DOM libraries | Uncontrolled | The library manages its own DOM state |

## Default values

Controlled inputs set the initial value through the ref:

```ts
const email = ref('user@example.com')
```

Uncontrolled inputs use the HTML `value` attribute:

```vue
<input ref="email-input" value="user@example.com" />
```

## The hybrid pattern: lazy v-model

`v-model.lazy` syncs on `change` (blur/enter) instead of `input`, giving you a middle ground:

```vue
<template>
  <!-- Updates only when the user leaves the field or presses Enter -->
  <input v-model.lazy="search" />
</template>
```

This avoids re-rendering on every keystroke while still keeping the value in reactive state.

## In Vue vs React

In React, this distinction is a bigger deal because uncontrolled inputs need `useRef` and controlled inputs cause re-renders of the entire component tree. In Vue, the reactivity system is fine-grained, so controlled inputs only update the parts of the DOM that depend on the value. The performance difference between controlled and uncontrolled is negligible in Vue. Default to `v-model` unless you have a specific reason not to.

See also: [How does v-model work on custom components?](/q/v-model-custom-components) · [How do template refs work?](/q/template-refs) · [How would you handle complex forms?](/q/complex-forms)

## References

- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html) - Vue.js docs
- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [v-model](https://vuejs.org/api/built-in-directives.html#v-model) - Vue.js docs
