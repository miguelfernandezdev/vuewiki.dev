---
order: 50
title: 'How would you handle complex forms in Vue?'
difficulty: 'advanced'
tags: ['components', 'composables', 'v-model']
summary: 'Use a reactive object for form data, a parallel object for errors, and extract validation into a composable. For large forms, consider VeeValidate or FormKit.'
---

A "complex form" usually means one or more of: many fields, multi-step wizards, dynamic sections (add/remove fields), nested objects, cross-field validation, or async validation (check if username is taken). The challenge isn't any single field. It's keeping validation, state, dirty tracking, and submit logic organized as the form grows.

## The core pattern: reactive state + composable validation

For forms you build yourself (no library), the pattern is: a `reactive` object for form data, a parallel object for errors, and validation functions extracted into a composable so components stay clean.

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue'

interface UserForm {
  name: string
  email: string
  role: 'admin' | 'user'
}

const form = reactive<UserForm>({
  name: '',
  email: '',
  role: 'user'
})

const errors = reactive<Partial<Record<keyof UserForm, string>>>({})

function validate(field: keyof UserForm) {
  switch (field) {
    case 'name':
      errors.name = form.name.trim() ? undefined : 'Name is required'
      break
    case 'email':
      errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ? undefined
        : 'Invalid email'
      break
  }
}

const isValid = computed(
  () =>
    form.name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    Object.values(errors).every((e) => !e)
)
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="form.name" @blur="validate('name')" />
      <span v-if="errors.name">{{ errors.name }}</span>
    </div>

    <div>
      <input v-model="form.email" @blur="validate('email')" />
      <span v-if="errors.email">{{ errors.email }}</span>
    </div>

    <button :disabled="!isValid">Submit</button>
  </form>
</template>
```

This works for simple forms, but notice the problems as it grows: validation logic is mixed into the component, every field needs manual wiring, and there's no dirty/touched tracking.

## Extract a composable for reusable form logic

When forms get complex, extract the validation and state tracking into a [composable](/q/what-is-a-composable):

```ts
import { reactive, computed } from 'vue'

type Rules<T> = Partial<Record<keyof T, (value: any) => string | undefined>>

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  rules: Rules<T>
) {
  const form = reactive({ ...initialValues }) as T
  const errors = reactive<Partial<Record<keyof T, string>>>({})
  const touched = reactive<Partial<Record<keyof T, boolean>>>({})

  function validate(field: keyof T) {
    const rule = rules[field]
    errors[field] = rule ? rule(form[field]) : undefined
  }

  function touch(field: keyof T) {
    touched[field] = true
    validate(field)
  }

  function validateAll() {
    for (const field of Object.keys(rules) as (keyof T)[]) {
      validate(field)
    }
    return Object.values(errors).every((e) => !e)
  }

  const isValid = computed(() =>
    Object.keys(rules).every((field) => !errors[field as keyof T])
  )

  return { form, errors, touched, touch, validate, validateAll, isValid }
}
```

Now the component is clean:

```vue
<script setup lang="ts">
import { useForm } from '@/composables/useForm'

const { form, errors, touch, validateAll, isValid } = useForm(
  { name: '', email: '', role: 'user' as const },
  {
    name: (v) => (v.trim() ? undefined : 'Required'),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : 'Invalid email'
  }
)

async function handleSubmit() {
  if (!validateAll()) return
  await fetch('/api/users', { method: 'POST', body: JSON.stringify(form) })
}
</script>
```

## When to use a form library

Build your own composable when the form is specific to your app and doesn't need complex features. Use a library when you need:

- **Schema-based validation** (Zod, Yup, Valibot), shared between frontend and backend
- **Multi-step wizards** with per-step validation
- **Dynamic array fields** (add/remove repeating sections)
- **Async validation** with debouncing (username availability checks)
- **Accessibility** (ARIA attributes, error announcements)

Popular choices:

| Library                                              | Approach                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| [VeeValidate](https://vee-validate.logaretm.com/v4/) | Composition API composables (`useForm`, `useField`), works with Zod/Yup/Valibot |
| [FormKit](https://formkit.com/)                      | Component-based, renders inputs for you, built-in validation and accessibility  |

Both handle the tedious parts (dirty tracking, submit state, field arrays, error display) so you focus on your actual form logic.

See also: [What is a composable?](/q/what-is-a-composable) · [What is v-model and how does it work?](/q/v-model-custom-components) · [How do you declare props with TypeScript?](/q/props-with-typescript)

## References

- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html) - Vue.js docs
- [VeeValidate](https://vee-validate.logaretm.com/v4/) - VeeValidate docs
- [FormKit](https://formkit.com/) - FormKit docs
