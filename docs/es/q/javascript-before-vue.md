---
order: 137
title: "¿Qué JavaScript necesitas aprender antes de Vue?"
difficulty: "beginner"
tags: ["core"]
---

Necesitas bases sólidas en JavaScript moderno (ES6+) antes de que Vue tenga sentido. El sistema de reactividad de Vue, el modelo de componentes y la Composition API se construyen sobre conceptos fundamentales de JS.

## Conceptos esenciales

### [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) (import/export)

Cada archivo Vue usa módulos. Necesitas entender los exports con nombre vs los exports por defecto, los re-exports y cómo el sistema de módulos resuelve las rutas.

```js
// Export con nombre
export function useCounter() { /* ... */ }

// Export por defecto
export default { name: 'MyComponent' }

// Importar
import { useCounter } from './composables/useCounter'
import MyComponent from './components/MyComponent.vue'
```

### [Desestructuración](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)

Se usa en todas partes en Vue: props, valores de retorno de composables, state reactivo.

```js
// Desestructuración de objetos
const { name, age } = user
const { data, error } = useFetch('/api/users')

// Con valores por defecto
const { page = 1, limit = 20 } = options

// Desestructuración de arrays (menos común en Vue, pero se usa en algunos patrones)
const [first, ...rest] = items
```

### [Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

Los manejadores de eventos, computed, watchers y composables usan arrow functions.

```js
const doubled = computed(() => count.value * 2)

watch(source, (newVal, oldVal) => {
  console.log(newVal)
})

const items = users.filter(u => u.active).map(u => u.name)
```

El binding de `this` también importa. Las arrow functions no tienen su propio `this`, razón por la que la Composition API de Vue 3 evita `this` por completo y usa closures.

### Template literals

Se usan en strings dinámicos, mensajes computed y bindings de clases.

```js
const greeting = computed(() => `Hola, ${user.value.name}!`)
const apiUrl = `/api/users/${userId}/posts`
```

### Operador spread y parámetros rest

Reenvío de props, fusión de objetos y argumentos de funciones.

```js
const defaults = { theme: 'light', lang: 'en' }
const config = { ...defaults, ...userPrefs }

function setup(...args) { /* ... */ }

const newItems = [...items, newItem]
```

### [Promises y async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)

La obtención de datos, las llamadas a la API y `useFetch` de Nuxt trabajan con código asíncrono.

```js
// Cadena de promises
fetch('/api/users')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))

// async/await (preferido)
async function loadUsers() {
  try {
    const res = await fetch('/api/users')
    const data = await res.json()
    return data
  } catch (err) {
    console.error(err)
  }
}
```

### Métodos de array

`v-for` renderiza listas, pero las manipulas con métodos de array: `map`, `filter`, `find`, `some`, `every`, `reduce`, `sort`, `flatMap`.

```js
const activeUsers = users.filter(u => u.active)
const names = users.map(u => u.name)
const admin = users.find(u => u.role === 'admin')
const hasAdmin = users.some(u => u.role === 'admin')
const total = items.reduce((sum, item) => sum + item.price, 0)
```

### Optional chaining y nullish coalescing

Acceso seguro a propiedades cuando los datos pueden ser null (habitual con respuestas de API).

```js
const city = user?.address?.city
const name = user?.name ?? 'Anónimo'
const count = response?.data?.length ?? 0
```

### Shorthand de objetos y computed properties

Se usan en objetos reactivos, opciones de componentes y payloads de eventos.

```js
const name = 'Alice'
const age = 30

// Shorthand
const user = { name, age }

// Nombres de propiedades computadas
const field = 'email'
const data = { [field]: 'alice@example.com' }

// Métodos shorthand
const store = {
  increment() { this.count++ }
}
```

## Importantes pero no urgentes

Estos conceptos importan para el trabajo intermedio/avanzado con Vue, pero puedes aprenderlos junto con Vue:

### Closures

La Composition API está construida sobre closures. `setup()` devuelve variables reactivas sobre las que los template refs hacen closure.

```js
function useCounter() {
  const count = ref(0)
  function increment() {
    count.value++ // increment hace closure sobre count
  }
  return { count, increment }
}
```

### [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

El sistema de reactividad de Vue 3 usa `Proxy` para interceptar el acceso y la mutación de propiedades. No necesitas escribir proxies tú mismo, pero entender el concepto ayuda a depurar problemas de reactividad.

```js
const handler = {
  get(target, key) { /* rastrear dependencia */ },
  set(target, key, value) { /* disparar efectos */ }
}
const proxy = new Proxy(target, handler)
```

### Getters y setters

Los computed son esencialmente getters. Los computed con escritura usan ambos.

```js
const user = {
  firstName: 'Alice',
  lastName: 'Smith',
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  },
  set fullName(value) {
    const [first, last] = value.split(' ')
    this.firstName = first
    this.lastName = last
  }
}
```

### Fundamentos de TypeScript

No es obligatorio para empezar, pero la mayoría de proyectos Vue 3 usan TypeScript. Las interfaces, los genéricos y el type narrowing se vuelven relevantes rápidamente.

## Lo que NO necesitas primero

- **Clases y decoradores**: Vue 3 no los usa. La Options API usa objetos simples, la Composition API usa funciones.
- **Generadores e iteradores**: raramente se usan en código Vue.
- **WeakMap/WeakSet**: Vue los usa internamente, pero tú no los escribirás.
- **API de Web Components**: los componentes Vue no son web components (salvo que los exportes explícitamente como tales).

## La lista de comprobación

| Concepto | Por qué importa en Vue |
|---|---|
| ES Modules | Cada archivo importa/exporta |
| Desestructuración | Props, retornos de composables, state reactivo |
| Arrow functions | Computed, watchers, manejadores de eventos |
| Template literals | Strings dinámicos, URLs |
| Spread/rest | Fusión de objetos, reenvío de props |
| Promises/async-await | Obtención de datos, llamadas a API |
| Métodos de array | Renderizado de listas, filtrado, transformación |
| Optional chaining | Acceso seguro a datos de API |
| Closures | La Composition API está construida sobre ellas |
| Proxy (concepto) | Entender la reactividad de Vue |

Ver también: [¿Qué es Vue y cuáles son sus características principales?](/es/q/what-is-vue)

## Referencias

- [JavaScript basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics) - MDN
- [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) - MDN
- [Introduction](https://vuejs.org/guide/introduction.html) - Vue.js docs
