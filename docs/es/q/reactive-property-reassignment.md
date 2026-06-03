---
order: 75
title: "¿Rompe la reactividad reasignar una propiedad en un objeto reactive?"
difficulty: "intermediate"
tags: ["reactivity", "errors", "watchers"]
summary: "Reasignar una propiedad en un objeto reactive funciona bien (el Proxy lo intercepta). Lo que rompe la reactividad es reasignar toda la variable a un nuevo objeto."
---

No. Reasignar una propiedad en un objeto `reactive()` NO rompe la reactividad. Es una pregunta trampa habitual en entrevistas. Como `reactive()` devuelve un [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), el trap `set` del proxy intercepta la asignación y dispara las actualizaciones correctamente. Lo que SÍ rompe la reactividad es reasignar la variable completa a un nuevo objeto, porque eso reemplaza la referencia al proxy.

## Reasignación de propiedad: funciona correctamente

```js
import { reactive, watchEffect } from 'vue'

const state = reactive({ name: 'Alice', age: 25 })

watchEffect(() => console.log(state.name))
// imprime: "Alice"

state.name = 'Bob'
// imprime: "Bob" — el watcher se dispara, la reactividad funciona
```

El Proxy intercepta `state.name = 'Bob'` a través de su trap `set`, notifica a todas las dependencias y el watcher se vuelve a ejecutar. Funciona para cualquier propiedad: existentes, nuevas y objetos anidados.

## Añadir nuevas propiedades: también funciona

A diferencia de Vue 2 (que usaba `Object.defineProperty` y requería `Vue.set`), el Proxy de Vue 3 intercepta las adiciones de propiedades:

```js
const state = reactive({ name: 'Alice' })

watchEffect(() => console.log(state.role))
// imprime: undefined

state.role = 'admin'
// imprime: "admin" — la nueva propiedad es reactiva
```

En Vue 2 esto hubiera pasado en silencio. En Vue 3 funciona porque el trap `set` del Proxy se dispara para cualquier propiedad, no solo las predefinidas.

## Lo que SÍ rompe: reasignar la variable completa

```js
let state = reactive({ name: 'Alice' })

watchEffect(() => console.log(state.name))
// imprime: "Alice"

// MAL: reemplaza el proxy con un nuevo objeto plano
state = { name: 'Bob' }
// el watcher NO se dispara — state ya no es el mismo proxy

// MAL: reemplaza con un nuevo objeto reactivo
state = reactive({ name: 'Charlie' })
// el watcher TAMPOCO se dispara — sigue observando el proxy ANTIGUO
```

El watcher se registró en el proxy original. Al reasignar `state` a un nuevo objeto, la variable apunta a algo diferente, pero el watcher sigue observando el proxy antiguo. No hay nada que los conecte.

## Por qué ocurre esto

`reactive()` devuelve un objeto Proxy. La variable `state` contiene una referencia a ese proxy. Los watchers y efectos registran dependencias sobre esa instancia específica del proxy.

```js
const proxy = reactive({ count: 0 })

// watchEffect registra lecturas en ESTE proxy
watchEffect(() => console.log(proxy.count))

// Asignación de propiedad: el trap set del proxy se dispara → watcher notificado
proxy.count = 1  // funciona

// Reasignación de variable: solo cambia a qué apunta la variable
// El proxy sigue existiendo, pero ya nadie lo referencia
let state = proxy
state = reactive({ count: 2 })  // rompe — el watcher observa proxy, no state
```

## La misma trampa con ref que contiene objetos

```js
const user = ref({ name: 'Alice' })

watchEffect(() => console.log(user.value.name))

// BIEN: reemplazar .value dispara el setter del ref
user.value = { name: 'Bob' }
// imprime: "Bob" — el trap set del ref se dispara

// BIEN: mutar una propiedad también funciona
user.value.name = 'Charlie'
// imprime: "Charlie" — el trap set del proxy reactivo interno se dispara
```

Con `ref`, reasignar `.value` funciona porque `ref` tiene su propio getter/setter que dispara actualizaciones. Esta es una razón por la que muchos desarrolladores prefieren `ref` a `reactive` para objetos: puedes reemplazar el valor completo de forma segura.

## reactive vs ref para objetos

```js
// reactive: no se puede reasignar, hay que mutar las propiedades
const state = reactive({ name: 'Alice' })
state.name = 'Bob'           // funciona
// state = { name: 'Bob' }   // rompe la reactividad

// ref: se puede reasignar .value O mutar las propiedades
const state = ref({ name: 'Alice' })
state.value = { name: 'Bob' }   // funciona (setter del ref)
state.value.name = 'Charlie'    // funciona (setter del proxy interno)
```

## La respuesta en una entrevista

Reasignar una propiedad en un objeto `reactive()` no rompe la reactividad. Vue 3 usa Proxy, que intercepta todas las operaciones sobre propiedades (get, set, delete, incluso añadir nuevas). Lo que rompe la reactividad es reasignar la variable en sí a un nuevo objeto, porque eso desconecta del proxy original. Si se necesita reemplazar un objeto completo, usar [ref](https://vuejs.org/api/reactivity-core.html#ref) y reasignar `.value`, o usar `Object.assign` para fusionar en el objeto reactivo existente:

```js
// Reemplazar todas las propiedades sin romper la referencia al proxy
Object.assign(state, { name: 'Bob', age: 30 })
```

Ver también: [¿Qué es el problema de identidad del proxy en reactividad?](/es/q/proxy-identity-hazard) · [¿Por qué pierdo reactividad al desestructurar un objeto reactive?](/es/q/reactive-destructuring-gotcha)

## Referencias

- [reactive() - Vue docs](https://vuejs.org/api/reactivity-core.html#reactive)
- [ref() - Vue docs](https://vuejs.org/api/reactivity-core.html#ref)
- [Proxy - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
