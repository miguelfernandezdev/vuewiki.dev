---
order: 43
title: "What is the difference between a component and an element in Vue?"
difficulty: "intermediate"
tags: ["components", "core"]
---

An element is a plain HTML tag (`<div>`, `<button>`, `<input>`). A component is a reusable piece of UI defined by you (`<UserCard>`, `<Modal>`, `<AppHeader>`). Both produce [VNodes](https://vuejs.org/guide/extras/rendering-mechanism.html#virtual-dom) (Virtual DOM nodes) at render time, but Vue handles them differently: elements map directly to DOM nodes, while components go through an instance lifecycle (props, setup, reactive state, slots, emit) before eventually rendering their own tree of elements.

## In templates

```vue
<template>
  <!-- Element: maps to a real <div> in the DOM -->
  <div class="container">

    <!-- Component: Vue creates an instance, runs setup, renders its template -->
    <UserCard :user="user" @click="selectUser" />

    <!-- Element: maps to a real <p> -->
    <p>{{ user.bio }}</p>
  </div>
</template>
```

Vue's template compiler treats them differently. When it sees a lowercase tag (`div`, `span`, `input`), it creates an element VNode. When it sees a PascalCase or kebab-case registered name (`UserCard`, `user-card`), it creates a component VNode.

## What is a VNode

A VNode (Virtual Node) is a plain JavaScript object that describes what should be rendered. Vue builds a tree of VNodes (the Virtual DOM), diffs it against the previous tree, and applies the minimal DOM changes. You can create VNodes manually using the [`h()` helper](https://vuejs.org/api/render-function.html#h).

```js
import { h } from 'vue'

// Element VNode: describes a <div>
const elementVNode = h('div', { class: 'box' }, 'Hello')
// { type: 'div', props: { class: 'box' }, children: 'Hello' }

// Component VNode: describes a <UserCard> instance
const componentVNode = h(UserCard, { user: someUser })
// { type: UserCard, props: { user: someUser }, children: null }
```

The `type` field is the key difference. For elements, `type` is a string (`'div'`). For components, `type` is the component definition object (or a setup function).

## How Vue processes each

**Element VNode** (`type: 'div'`):
1. Create or patch the DOM node
2. Apply attributes, event listeners, styles
3. Process children recursively

**Component VNode** (`type: UserCard`):
1. Create a component instance (reactive context, props, slots)
2. Run `setup()` or the Options API equivalent
3. Render the component's template into its own VNode tree
4. Process that tree recursively (which eventually bottoms out at element VNodes)

Every component, no matter how complex, eventually resolves to a tree of element VNodes. Components are an abstraction layer on top of elements.

## Seeing it in render functions

```js
import { h, defineComponent } from 'vue'

const Greeting = defineComponent({
  props: { name: String },
  setup(props) {
    return () => h('p', `Hello, ${props.name}`)
    //          ↑ element VNode ('p')
  }
})

// Using the component produces a component VNode
const app = () => h(Greeting, { name: 'Alice' })
//                 ↑ component VNode (Greeting)
```

When Vue renders `app`, it encounters the `Greeting` component VNode, creates an instance, calls `setup`, gets back the element VNode `h('p', ...)`, and renders that to the DOM. The final DOM only has `<p>Hello, Alice</p>`. There is no `<Greeting>` tag.

## In Vue DevTools

Vue DevTools shows both levels. The Components tab displays the component tree (`App > Greeting`). The Elements tab in the browser shows only DOM elements (`<div id="app"> <p>Hello, Alice</p> </div>`). Component boundaries exist in Vue's Virtual DOM, not in the real DOM.

## Practical difference

| | Element | Component |
|---|---|---|
| What it is | HTML tag | Reusable UI unit |
| VNode type | String (`'div'`) | Component object |
| Has instance | No | Yes (reactive state, lifecycle) |
| Has props/emit | No (has attributes) | Yes |
| Has slots | No | Yes |
| Appears in DOM | Yes | No (its template output does) |
| DevTools visibility | Elements tab | Components tab |
| Cost | Cheap (just a DOM node) | Higher (instance + reactivity setup) |

See also: [What is the Virtual DOM and how does Vue use it?](/q/virtual-dom)

## References

- [Rendering Mechanism](https://vuejs.org/guide/extras/rendering-mechanism.html) - Vue.js docs
- [Render Functions & JSX](https://vuejs.org/guide/extras/render-function.html) - Vue.js docs
- [Components Basics](https://vuejs.org/guide/essentials/component-basics.html) - Vue.js docs
