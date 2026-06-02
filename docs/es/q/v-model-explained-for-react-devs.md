---
order: 45
title: "¿Cómo explicarías v-model a alguien que viene de React?"
difficulty: "intermediate"
tags: ["components", "directives", "v-model"]
summary: "v-model = value + onChange de React en una línea. Es azúcar sintáctico: internamente enlaza un prop y escucha un evento de actualización."
---

En React, el estado de los formularios es siempre unidireccional: el estado fluye hacia abajo a través de `value` y los cambios suben a través de `onChange`. Dos líneas por cada input. En Vue, `v-model` gestiona ambas direcciones en una sola declaración. Es azúcar sintáctico: internamente vincula un prop de valor y escucha un evento de actualización, pero escribes una línea en lugar de dos. El compromiso es explicitez frente a conveniencia.

## Comparación lado a lado

```jsx
// React: explícito, unidireccional
function Form() {
  const [name, setName] = useState('')
  return (
    <input value={name} onChange={e => setName(e.target.value)} />
  )
}
```

```vue
<!-- Vue: declarativo, bidireccional -->
<script setup>
const name = ref('')
</script>

<template>
  <input v-model="name" />
</template>
```

Ambos logran el mismo resultado. React requiere que conectes `value` y `onChange` explícitamente. `v-model` de Vue conecta ambos por ti.

## En qué se compila v-model

En elementos nativos, `v-model` es azúcar para un binding de valor y un listener de evento input:

```vue
<!-- Esto -->
<input v-model="name" />

<!-- Se compila en esto -->
<input :value="name" @input="name = $event.target.value" />
```

Es exactamente lo que hace el patrón de input controlado de React, pero de forma manual. Vue genera ambas partes a partir de una sola directiva.

## En componentes personalizados

Para los desarrolladores de React, aquí es donde se pone interesante. En React, pasas `value` y `onChange` como props:

```jsx
// Input personalizado en React
function CustomInput({ value, onChange }) {
  return <input value={value} onChange={onChange} />
}

<CustomInput value={name} onChange={e => setName(e.target.value)} />
```

En Vue 3, `v-model` en un componente usa `modelValue` como prop y `update:modelValue` como evento:

```vue
<!-- Padre -->
<CustomInput v-model="name" />

<!-- Que es equivalente a -->
<CustomInput :modelValue="name" @update:modelValue="name = $event" />
```

```vue
<!-- CustomInput.vue -->
<script setup>
defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input :value="modelValue" @input="emit('update:modelValue', $event.target.value)" />
</template>
```

O con el macro `defineModel` de Vue 3.4+, que elimina el código repetitivo:

```vue
<!-- CustomInput.vue -->
<script setup>
const model = defineModel<string>()
</script>

<template>
  <input v-model="model" />
</template>
```

## Múltiples bindings v-model

React no tiene un equivalente nativo para esto. Tendrías que pasar múltiples pares value/onChange:

```jsx
// React: múltiples valores controlados
<UserForm
  name={name} onNameChange={setName}
  email={email} onEmailChange={setEmail}
/>
```

Vue 3 admite bindings v-model con nombre:

```vue
<!-- Padre -->
<UserForm v-model:name="userName" v-model:email="userEmail" />
```

```vue
<!-- UserForm.vue -->
<script setup>
const name = defineModel<string>('name')
const email = defineModel<string>('email')
</script>

<template>
  <input v-model="name" placeholder="Name" />
  <input v-model="email" placeholder="Email" />
</template>
```

Cada `v-model` con nombre se mapea a su propio par prop/evento: `:name` + `@update:name`, `:email` + `@update:email`.

## Modificadores

`v-model` de Vue admite modificadores que transforman el valor automáticamente:

```vue
<!-- .trim elimina espacios en blanco -->
<input v-model.trim="name" />

<!-- .number convierte a número -->
<input v-model.number="age" type="number" />

<!-- .lazy sincroniza con el evento change en lugar de input — actualiza cuando el usuario sale del campo, no en cada pulsación de tecla -->
<input v-model.lazy="query" />
```

En React, manejarías estas transformaciones dentro del handler `onChange` de forma manual.

## La diferencia filosófica

| | Vue (v-model) | React (inputs controlados) |
|---|---|---|
| Flujo de datos | Bidireccional (por convención) | Unidireccional (siempre) |
| Verbosidad | Una línea por binding | Dos props por binding |
| Control | Conexión implícita | Conexión explícita |
| Depuración | Menos obvio dónde se originan los cambios | Siempre claro quién muta el estado |
| Transformaciones personalizadas | Modificadores (`.trim`, `.number`) | Manual en onChange |
| Múltiples bindings | `v-model:name`, `v-model:email` | Múltiples pares value/onChange como props |

El enfoque de Vue es más conciso. El de React es más trazable. Por debajo, ambos hacen lo mismo: vincular un valor y escuchar cambios. Vue genera la conexión en tiempo de compilación; React te pide que la escribas tú mismo.

## Qué decirle a un desarrollador de React

`v-model` no es magia de binding bidireccional. Es un atajo en tiempo de compilación que genera el mismo patrón `value` + `onChange` que ya escribes en React. La diferencia es que el compilador de Vue escribe el código repetitivo por ti. Si necesitas ver qué está pasando, expande el azúcar: `:modelValue` + `@update:modelValue` es el mismo patrón que `value` + `onChange`.

Ver también: [¿Cómo funciona v-model en componentes personalizados?](/es/q/v-model-custom-components) · [¿Cuál es la diferencia entre Composition API y React Hooks?](/es/q/composition-api-vs-react-hooks)

## Referencias

- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html) - Vue.js docs
