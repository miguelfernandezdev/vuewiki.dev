---
order: 45
title: 'How would you explain v-model to someone coming from React?'
difficulty: 'intermediate'
tags: ['components', 'directives', 'v-model']
summary: "v-model = React's value + onChange in one line. It's syntactic sugar: internally binds a prop and listens for an update event."
---

In React, form state is always unidirectional: state flows down through `value` and changes flow up through `onChange`. Two lines for every input. In Vue, `v-model` handles both directions in a single declaration. It's syntactic sugar: internally it binds a value prop and listens for an update event, but you write one line instead of two. The trade-off is explicitness vs convenience.

## Side-by-side comparison

```jsx
// React: explicit, unidirectional
function Form() {
  const [name, setName] = useState('')
  return <input value={name} onChange={(e) => setName(e.target.value)} />
}
```

```vue
<!-- Vue: declarative, bidirectional -->
<script setup>
const name = ref('')
</script>

<template>
  <input v-model="name" />
</template>
```

Both achieve the same result. React requires you to wire `value` and `onChange` explicitly. Vue's `v-model` wires both for you.

## What v-model compiles to

On native elements, `v-model` is sugar for a value binding and an input event listener:

```vue
<!-- This -->
<input v-model="name" />

<!-- Compiles to this -->
<input :value="name" @input="name = $event.target.value" />
```

This is exactly what React's controlled input pattern does manually. Vue just generates both sides from a single directive.

## On custom components

For React developers, this is where it gets interesting. In React, you pass `value` and `onChange` as props:

```jsx
// React custom input
function CustomInput({ value, onChange }) {
  return <input value={value} onChange={onChange} />
}

;<CustomInput value={name} onChange={(e) => setName(e.target.value)} />
```

In Vue 3, `v-model` on a component uses `modelValue` as the prop and `update:modelValue` as the event:

```vue
<!-- Parent -->
<CustomInput v-model="name" />

<!-- Which is equivalent to -->
<CustomInput :modelValue="name" @update:modelValue="name = $event" />
```

```vue
<!-- CustomInput.vue -->
<script setup>
defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
```

Or with Vue 3.4+'s `defineModel` macro, which removes the boilerplate:

```vue
<!-- CustomInput.vue -->
<script setup>
const model = defineModel<string>()
</script>

<template>
  <input v-model="model" />
</template>
```

## Multiple v-model bindings

React has no built-in equivalent for this. You'd pass multiple value/onChange pairs:

```jsx
// React: multiple controlled values
<UserForm
  name={name}
  onNameChange={setName}
  email={email}
  onEmailChange={setEmail}
/>
```

Vue 3 supports named v-model bindings:

```vue
<!-- Parent -->
<UserForm v-model:name="userName" v-model:email="userEmail" />
```

```vue
<!-- UserForm.vue -->
<script setup>
const name = defineModel < string > 'name'
const email = defineModel < string > 'email'
</script>

<template>
  <input v-model="name" placeholder="Name" />
  <input v-model="email" placeholder="Email" />
</template>
```

Each named `v-model` maps to its own prop/event pair: `:name` + `@update:name`, `:email` + `@update:email`.

## Modifiers

Vue's `v-model` supports modifiers that transform the value automatically:

```vue
<!-- .trim removes whitespace -->
<input v-model.trim="name" />

<!-- .number converts to number -->
<input v-model.number="age" type="number" />

<!-- .lazy syncs on the change event instead of input — updates when the user leaves the field, not on every keystroke -->
<input v-model.lazy="query" />
```

In React, you'd handle these transformations inside the `onChange` handler manually.

## The philosophical difference

|                   | Vue (v-model)                        | React (controlled inputs)          |
| ----------------- | ------------------------------------ | ---------------------------------- |
| Data flow         | Bidirectional (by convention)        | Unidirectional (always)            |
| Verbosity         | One line per binding                 | Two props per binding              |
| Control           | Implicit wiring                      | Explicit wiring                    |
| Debugging         | Less obvious where changes originate | Always clear who mutates state     |
| Custom transforms | Modifiers (`.trim`, `.number`)       | Manual in onChange                 |
| Multiple bindings | `v-model:name`, `v-model:email`      | Multiple value/onChange prop pairs |

Vue's approach is more concise. React's approach is more traceable. Under the hood, both are doing the same thing: binding a value and listening for changes. Vue generates the wiring at compile time; React asks you to write it yourself.

## What to tell a React developer

`v-model` is not magic two-way binding. It's a compile-time shortcut that generates the same `value` + `onChange` pattern you already write in React. The difference is that Vue's compiler writes the boilerplate for you. If you need to see what's happening, expand the sugar: `:modelValue` + `@update:modelValue` is the same pattern as `value` + `onChange`.

See also: [How does v-model work on custom components?](/q/v-model-custom-components) · [What is the difference between Composition API and React Hooks?](/q/composition-api-vs-react-hooks)

## References

- [Component v-model](https://vuejs.org/guide/components/v-model.html) - Vue.js docs
- [Form Input Bindings](https://vuejs.org/guide/essentials/forms.html) - Vue.js docs
