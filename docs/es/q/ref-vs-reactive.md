---
order: 62
title: '¿Cuál es la diferencia entre ref y reactive?'
difficulty: 'beginner'
tags: ['reactivity', 'composition-api']
summary: 'ref funciona con cualquier tipo y requiere .value. reactive solo con objetos, sin .value, pero no se puede reasignar ni destructurar de forma segura.'
---

Vue 3 te ofrece dos formas de crear estado reactivo: [`ref`](https://vuejs.org/api/reactivity-core.html#ref) y [`reactive`](https://vuejs.org/api/reactivity-core.html#reactive). Ambas hacen los datos reactivos para que la plantilla se actualice cuando cambian, pero funcionan de forma distinta y tienen restricciones diferentes.

## ref: funciona con cualquier valor

`ref` envuelve cualquier valor: un número, un string, un booleano, un objeto, un array o `null`. Se accede y modifica a través de `.value` en JavaScript/TypeScript. En las plantillas, Vue lo desenvuelve automáticamente para que no escribas `.value` allí.

```ts
import { ref } from 'vue'

const count = ref(0) // primitivo
const user = ref({ name: '' }) // objeto
const items = ref<string[]>([]) // array

count.value++ // acceso a través de .value en JS
user.value.name = 'Ana' // acceso anidado
items.value.push('new item')
```

```vue
<template>
  <!-- No se necesita .value en las plantillas -->
  <p>{{ count }}</p>
  <p>{{ user.name }}</p>
</template>
```

<PlaygroundLink code="<template>

  <!-- No se necesita .value en las plantillas -->
  <p>{{ count }}</p>
  <p>{{ user.name }}</p>
</template>" />

## reactive: solo objetos, sin `.value`

`reactive` envuelve un objeto (o array, Map, Set) y hace sus propiedades reactivas directamente, sin `.value`. Pero **solo funciona con objetos**. No puedes pasarle un número o string.

```ts
import { reactive } from 'vue'

const state = reactive({ count: 0, name: '' })

state.count++ // no se necesita .value
state.name = 'Ana'
```

La gran limitación: **no puedes reasignar un objeto reactive**. Si haces `state = newObject`, rompes el enlace reactivo. Los watchers y la plantilla siguen referenciando el objeto antiguo.

```ts
let state = reactive({ count: 0 })
state = reactive({ count: 1 }) // ❌ rompe la reactividad — los watchers antiguos siguen observando el proxy anterior
```

## Cuándo usar cuál

**Usar `ref` para todo** es el valor predeterminado más seguro. Funciona con cualquier tipo, puedes reasignarlo libremente (`count.value = newValue`), y maneja todos los casos límite. El `.value` es un pequeño coste por la flexibilidad.

**Usar `reactive` cuando** tienes un grupo de propiedades relacionadas que siempre van juntas y nunca reemplazarás el objeto completo, como un formulario:

```ts
const form = reactive({
  email: '',
  password: '',
  remember: false
})

form.email = 'ana@example.com' // ergonómico, sin .value
```

## Los errores comunes

**Desestructurar un `reactive` rompe la reactividad:**

```ts
const state = reactive({ count: 0 })
const { count } = state // ❌ count es ahora un número plano (0), no reactivo
// Usa toRefs() si necesitas desestructurar
```

**Reasignar un `ref` está bien, reasignar un `reactive` no:**

```ts
const data = ref<User[]>([])
data.value = await fetchUsers() // ✅ funciona perfectamente

let data = reactive<User[]>([])
data = await fetchUsers() // ❌ rompe el enlace reactivo
```

Por eso `ref` es el valor predeterminado recomendado. Cuando necesitas reemplazar el valor completo (respuestas de API, resetear estado), `ref` simplemente funciona.

Ver también: [¿Cuál es la diferencia entre computed y watch?](/es/q/computed-vs-watch) · [¿Por qué pierdo reactividad al desestructurar?](/es/q/reactive-destructuring-gotcha)

## Referencias

- [ref()](https://vuejs.org/api/reactivity-core.html#ref) - Vue.js docs
- [reactive()](https://vuejs.org/api/reactivity-core.html#reactive) - Vue.js docs
- [Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) - Vue.js docs
