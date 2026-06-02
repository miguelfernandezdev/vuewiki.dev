---
order: 137
title: "What JavaScript do you need to learn before Vue?"
difficulty: "beginner"
tags: ["core"]
---

You need solid fundamentals in modern JavaScript (ES6+) before Vue will make sense. Vue's reactivity system, component model, and Composition API are all built on core JS concepts.

## Essential concepts

### [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) (import/export)

Every Vue file uses modules. You need to understand named vs default exports, re-exports, and how the module system resolves paths.

```js
// Named export
export function useCounter() { /* ... */ }

// Default export
export default { name: 'MyComponent' }

// Importing
import { useCounter } from './composables/useCounter'
import MyComponent from './components/MyComponent.vue'
```

### [Destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)

Used everywhere in Vue: props, composable return values, reactive state.

```js
// Object destructuring
const { name, age } = user
const { data, error } = useFetch('/api/users')

// With defaults
const { page = 1, limit = 20 } = options

// Array destructuring (less common in Vue, but used in some patterns)
const [first, ...rest] = items
```

### [Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)

Event handlers, computed properties, watchers, composables all use arrow functions.

```js
const doubled = computed(() => count.value * 2)

watch(source, (newVal, oldVal) => {
  console.log(newVal)
})

const items = users.filter(u => u.active).map(u => u.name)
```

Understanding `this` binding matters too. Arrow functions don't have their own `this`, which is why Vue 3's Composition API avoids `this` entirely and uses closures instead.

### Template literals

Used in dynamic strings, computed messages, and class bindings.

```js
const greeting = computed(() => `Hello, ${user.value.name}!`)
const apiUrl = `/api/users/${userId}/posts`
```

### Spread operator and rest parameters

Props forwarding, merging objects, function arguments.

```js
const defaults = { theme: 'light', lang: 'en' }
const config = { ...defaults, ...userPrefs }

function setup(...args) { /* ... */ }

const newItems = [...items, newItem]
```

### [Promises and async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)

Data fetching, API calls, and Nuxt's `useFetch` all deal with async code.

```js
// Promise chain
fetch('/api/users')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err))

// async/await (preferred)
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

### Array methods

`v-for` renders lists, but you manipulate them with array methods: `map`, `filter`, `find`, `some`, `every`, `reduce`, `sort`, `flatMap`.

```js
const activeUsers = users.filter(u => u.active)
const names = users.map(u => u.name)
const admin = users.find(u => u.role === 'admin')
const hasAdmin = users.some(u => u.role === 'admin')
const total = items.reduce((sum, item) => sum + item.price, 0)
```

### Optional chaining and nullish coalescing

Safe property access when data might be null (common with API responses).

```js
const city = user?.address?.city
const name = user?.name ?? 'Anonymous'
const count = response?.data?.length ?? 0
```

### Object shorthand and computed properties

Used in reactive objects, component options, and event payloads.

```js
const name = 'Alice'
const age = 30

// Shorthand
const user = { name, age }

// Computed property names
const field = 'email'
const data = { [field]: 'alice@example.com' }

// Shorthand methods
const store = {
  increment() { this.count++ }
}
```

## Important but not urgent

These concepts matter for intermediate/advanced Vue work, but you can learn them alongside Vue:

### Closures

The Composition API is built on closures. `setup()` returns reactive variables that template refs close over.

```js
function useCounter() {
  const count = ref(0)
  function increment() {
    count.value++ // increment closes over count
  }
  return { count, increment }
}
```

### [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

Vue 3's reactivity system uses `Proxy` to intercept property access and mutation. You don't need to write proxies yourself, but understanding the concept helps debug reactivity issues.

```js
const handler = {
  get(target, key) { /* track dependency */ },
  set(target, key, value) { /* trigger effects */ }
}
const proxy = new Proxy(target, handler)
```

### Getters and setters

Computed properties are essentially getters. Writable computed properties use both.

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

### TypeScript basics

Not required to start, but most Vue 3 projects use TypeScript. Interfaces, generics, and type narrowing become relevant quickly.

## What you do NOT need first

- **Classes and decorators**: Vue 3 doesn't use them. The Options API uses plain objects, the Composition API uses functions.
- **Generators and iterators**: Rarely used in Vue code.
- **WeakMap/WeakSet**: Vue uses them internally, but you won't write them yourself.
- **Web Components API**: Vue components are not web components (unless you explicitly export them as such).

## The checklist

| Concept | Why it matters for Vue |
|---|---|
| ES Modules | Every file imports/exports |
| Destructuring | Props, composable returns, reactive state |
| Arrow functions | Computed, watchers, event handlers |
| Template literals | Dynamic strings, URLs |
| Spread/rest | Object merging, props forwarding |
| Promises/async-await | Data fetching, API calls |
| Array methods | List rendering, filtering, transforming |
| Optional chaining | Safe access to API data |
| Closures | Composition API is built on them |
| Proxy (concept) | Understand Vue's reactivity |

See also: [What is Vue and what are its main features?](/q/what-is-vue)

## References

- [JavaScript basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics) - MDN
- [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) - MDN
- [Introduction](https://vuejs.org/guide/introduction.html) - Vue.js docs
