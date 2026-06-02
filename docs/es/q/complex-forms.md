---
order: 27
title: "¿Cómo gestionarías formularios complejos en Vue?"
difficulty: "advanced"
tags: ["components", "composables"]
---

Un "formulario complejo" normalmente significa una o más de: muchos campos, wizards multi-paso, secciones dinámicas (añadir/eliminar campos), objetos anidados, validación entre campos, o validación asíncrona (verificar si un nombre de usuario está disponible). El reto no es un campo individual — es mantener la validación, el estado, el tracking de cambios y la lógica de envío organizados a medida que el formulario crece.

## El patrón base: estado reactivo + validación en composable

Para formularios que construyes tú mismo (sin librería), el patrón es: un objeto `reactive` para los datos del formulario, un objeto paralelo para los errores, y funciones de validación extraídas en un composable para que los componentes queden limpios.

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

const isValid = computed(() =>
  form.name.trim().length > 0
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  && Object.values(errors).every(e => !e)
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

Esto funciona para formularios simples, pero observa los problemas cuando crece: la lógica de validación está mezclada en el componente, cada campo necesita cableado manual, y no hay tracking de dirty/touched.

## Extrae un composable para lógica de formularios reutilizable

Cuando los formularios se complican, extrae la validación y el tracking de estado en un [composable](/es/q/what-is-a-composable):

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
    return Object.values(errors).every(e => !e)
  }

  const isValid = computed(() =>
    Object.keys(rules).every(field => !errors[field as keyof T])
  )

  return { form, errors, touched, touch, validate, validateAll, isValid }
}
```

Ahora el componente queda limpio:

```vue
<script setup lang="ts">
import { useForm } from '@/composables/useForm'

const { form, errors, touch, validateAll, isValid } = useForm(
  { name: '', email: '', role: 'user' as const },
  {
    name: (v) => v.trim() ? undefined : 'Required',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : 'Invalid email'
  }
)

async function handleSubmit() {
  if (!validateAll()) return
  await fetch('/api/users', { method: 'POST', body: JSON.stringify(form) })
}
</script>
```

## Cuándo usar una librería de formularios

Construye tu propio composable cuando el formulario es específico de tu app y no necesita funcionalidades complejas. Usa una librería cuando necesites:

- **Validación basada en schemas** (Zod, Yup, Valibot) — compartida entre frontend y backend
- **Wizards multi-paso** con validación por paso
- **Campos de array dinámicos** (añadir/eliminar secciones repetidas)
- **Validación asíncrona** con debouncing (verificar disponibilidad de nombre de usuario)
- **Accesibilidad** (atributos ARIA, anuncios de errores)

Opciones populares:

| Librería | Enfoque |
| --- | --- |
| [VeeValidate](https://vee-validate.logaretm.com/v4/) | Composables de Composition API (`useForm`, `useField`), funciona con Zod/Yup/Valibot |
| [FormKit](https://formkit.com/) | Basado en componentes, renderiza inputs por ti, validación y accesibilidad integradas |

Ambas manejan las partes tediosas (dirty tracking, estado de envío, arrays de campos, mostrar errores) para que te centres en la lógica real de tu formulario.

Ver también: [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Qué es v-model y cómo funciona?](/es/q/v-model-custom-components) · [¿Cómo se declaran props con TypeScript?](/es/q/props-with-typescript)

## Referencias

- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html) - Vue.js docs
- [VeeValidate](https://vee-validate.logaretm.com/v4/) - VeeValidate docs
- [FormKit](https://formkit.com/) - FormKit docs
