---
order: 39
title: '¿Cuál es la diferencia entre inputs controlados y no controlados?'
difficulty: 'intermediate'
tags: ['components', 'forms', 'v-model']
summary: 'Los controlados usan v-model (el estado dirige el valor). Los no controlados dejan que el DOM gestione el valor y lo leen con refs cuando es necesario.'
---

Un input controlado tiene su valor dirigido por estado reactivo. Cada pulsación de tecla actualiza el estado, y el estado dicta lo que muestra el input. Un input no controlado gestiona su propio valor internamente a través del DOM. Lo lees cuando lo necesitas (al enviar, al perder el foco) en lugar de rastrear cada cambio.

## Controlado (v-model)

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

<PlaygroundLink code="<script setup>
import { ref } from 'vue'
&#10;const name = ref('')
</script>
&#10;<template>
  <input v-model=&quot;name&quot; />
  <p>Current value: {{ name }}</p>
</template>" />

Cada carácter que escribe el usuario fluye a través de: evento input → actualiza `name` → Vue re-renderiza → el input muestra el nuevo valor. Siempre tienes el valor actual en `name`.

## No controlado (template ref)

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

<PlaygroundLink code="<script setup>
import { useTemplateRef } from 'vue'
&#10;const inputEl = useTemplateRef('name-input')
&#10;function handleSubmit() {
  const value = inputEl.value?.value
  console.log('Submitted:', value)
}
</script>
&#10;<template>
  <input ref=&quot;name-input&quot; />
  <button @click=&quot;handleSubmit&quot;>Submit</button>
</template>" />

El DOM posee el valor. Solo lo lees cuando lo necesitas.

## Cuándo usar cada uno

| Situación                                                         | Enfoque       | Por qué                                                                |
| ----------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- |
| Validación en tiempo real                                         | Controlado    | Necesitas el valor en cada pulsación                                   |
| Visualización derivada (contador de caracteres, previsualización) | Controlado    | Las propiedades computed dependen del valor                            |
| Lógica condicional (deshabilitar botón hasta que sea válido)      | Controlado    | El template necesita acceso reactivo                                   |
| Formulario simple enviado al pulsar un botón                      | Cualquiera    | El no controlado es más simple si no necesitas actualizaciones en vivo |
| Inputs de archivo                                                 | No controlado | `<input type="file">` es de solo lectura, v-model no aplica            |
| Librerías DOM de terceros                                         | No controlado | La librería gestiona su propio estado DOM                              |

## Valores por defecto

Los inputs controlados establecen el valor inicial a través de la ref:

```ts
const email = ref('user@example.com')
```

Los inputs no controlados usan el atributo HTML `value`:

```vue
<input ref="email-input" value="user@example.com" />
```

<PlaygroundLink code="<input ref=&quot;email-input&quot; value=&quot;user@example.com&quot; />" />

## El patrón híbrido: v-model.lazy

`v-model.lazy` sincroniza tras eventos `change` en lugar de `input`, ofreciendo un punto intermedio. El evento `change` se dispara cuando el input pierde el foco después de que su valor haya cambiado:

```vue
<template>
  <!-- Se actualiza solo cuando el usuario abandona el campo después de modificarlo -->
  <input v-model.lazy="search" />
</template>
```

<PlaygroundLink code="<template>
&#10;  <input v-model.lazy=&quot;search&quot; />
</template>" />

Esto evita el re-renderizado en cada pulsación mientras mantiene el valor en estado reactivo.

## En Vue frente a React

En React, esta distinción es más importante porque los inputs no controlados necesitan `useRef` y los inputs controlados causan re-renderizados de todo el árbol de componentes. En Vue, el sistema de reactividad es granular, así que los inputs controlados solo actualizan las partes del DOM que dependen del valor. La diferencia de rendimiento entre controlados y no controlados es insignificante en Vue. Por defecto, usa `v-model` salvo que tengas un motivo concreto para no hacerlo.

Ver también: [¿Cómo funciona v-model en componentes personalizados?](/es/q/v-model-custom-components) · [¿Cómo funcionan las template refs?](/es/q/template-refs) · [¿Cómo manejar formularios complejos?](/es/q/complex-forms)

## Referencias

- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html) - Vue.js docs
- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [v-model](https://vuejs.org/api/built-in-directives.html#v-model) - Vue.js docs
