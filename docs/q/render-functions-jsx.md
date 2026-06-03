---
order: 40
title: 'How do render functions and JSX work in Vue?'
difficulty: 'intermediate'
tags: ['components', 'v-model']
summary: 'h() creates vnodes programmatically instead of using templates. JSX is syntactic sugar for h(). Templates compile to render functions at build time.'
---

Render functions are an alternative to templates. Instead of writing HTML-like markup, you use the `h()` function (or JSX) to create vnodes programmatically. Templates are compiled into render functions at build time, so render functions are what Vue actually executes.

## The h() function

`h` stands for "hyperscript" (JavaScript that creates HTML). It takes a tag (or component), props, and children:

```ts
import { h, ref } from 'vue'

export default {
  setup() {
    const count = ref(0)

    return () =>
      h(
        'button',
        {
          onClick: () => count.value++
        },
        `Count: ${count.value}`
      )
  }
}
```

When `setup` returns a function instead of an object, that function is the render function.

## JSX (the readable alternative)

JSX makes render functions look closer to templates. It requires `@vitejs/plugin-vue-jsx`:

```tsx
import { ref, defineComponent } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(0)

    return () => (
      <button onClick={() => count.value++}>Count: {count.value}</button>
    )
  }
})
```

## When render functions make sense

Templates handle 95% of cases. Render functions are useful when the output is too dynamic for template syntax:

```ts
import { h } from 'vue'

// Dynamic heading level: h1, h2, h3...
function DynamicHeading(props: { level: number }, { slots }) {
  return h(`h${props.level}`, slots.default?.())
}
DynamicHeading.props = ['level']
```

```tsx
// Same component in JSX
function DynamicHeading(props: { level: number }, { slots }) {
  const Tag = `h${props.level}`
  return <Tag>{slots.default?.()}</Tag>
}
```

Doing this in a template would require a `v-if` chain for each heading level.

## Key patterns

**Lists need keys**, just like in templates:

```ts
return () =>
  h(
    'ul',
    items.value.map((item) => h('li', { key: item.id }, item.name))
  )
```

**Event modifiers** use `withModifiers` and `withKeys`:

```ts
import { h, withModifiers, withKeys } from 'vue'

h(
  'button',
  {
    onClick: withModifiers(handleClick, ['stop', 'prevent'])
  },
  'Click'
)

h('input', {
  onKeyup: withKeys(handleEnter, ['enter'])
})
```

**v-model** is expanded manually:

```ts
h(CustomInput, {
  modelValue: text.value,
  'onUpdate:modelValue': (val) => {
    text.value = val
  }
})
```

**Custom directives** use `withDirectives`:

```ts
import { h, withDirectives } from 'vue'

const vFocus = { mounted: (el) => el.focus() }

withDirectives(h('input'), [[vFocus]])
```

## Templates vs render functions

|                        | Templates                    | Render functions / JSX         |
| ---------------------- | ---------------------------- | ------------------------------ |
| Readability            | HTML-like, familiar          | JavaScript, more verbose       |
| Compiler optimizations | Static hoisting, patch flags | None (you opt out)             |
| Dynamic output         | Limited by directive syntax  | Full JavaScript flexibility    |
| IDE support            | Vue-specific tooling (Volar) | Standard TypeScript/JSX        |
| Use case               | Most components              | Highly dynamic rendering logic |

Prefer templates by default. Use render functions when the template would be awkward or impossible to express declaratively.

See also: [What are functional components?](/q/functional-components) · [What are slots?](/q/slots)

## References

- [Render Functions & JSX](https://vuejs.org/guide/extras/render-function.html) - Vue.js docs
- [h()](https://vuejs.org/api/render-function.html#h) - Vue.js docs
