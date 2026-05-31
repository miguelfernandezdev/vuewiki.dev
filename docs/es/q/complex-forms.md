---
order: 27
title: "¿Cómo gestionarías formularios complejos en Vue?"
difficulty: "advanced"
tags: ["components", "composables"]
---

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue'

interface FormData {
  name: string
  email: string
  role: 'admin' | 'user'
}

const form = reactive<FormData>({
  name: '',
  email: '',
  role: 'user'
})

const errors = reactive({
  name: '',
  email: ''
})

const isValid = computed(() =>
  form.name.length > 0 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
  !errors.name &&
  !errors.email
)

function validate(field: keyof FormData) {
  if (field === 'name' && !form.name) {
    errors.name = 'Name required'
  } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Invalid email'
  } else {
    errors[field as keyof typeof errors] = ''
  }
}

async function handleSubmit() {
  if (!isValid.value) return
  await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(form)
  })
}
</script>
```
