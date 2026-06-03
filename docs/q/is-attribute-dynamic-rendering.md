---
order: 48
title: 'How does the `is` attribute work for dynamic component rendering?'
difficulty: 'intermediate'
tags: ['components', 'vite']
summary: '<component :is> accepts a component definition, a registered name string, or an HTML tag. Vue resolves it at runtime and renders the match.'
---

The `is` attribute on `<component>` accepts a component definition object, a component name string, or an HTML tag name string. Vue resolves it at runtime and renders the matching component or element. Beyond the standard `<component :is>` pattern, `is` has special behavior on native HTML elements and interacts with web components through the `vue:` prefix.

## What `:is` accepts

```vue
<script setup>
import { shallowRef } from 'vue'
import AlertBox from './AlertBox.vue'
import InfoBox from './InfoBox.vue'

const currentComponent = shallowRef(AlertBox)
</script>

<template>
  <!-- 1. Component definition object (recommended) -->
  <component :is="currentComponent" />

  <!-- 2. Registered component name (string) -->
  <component is="AlertBox" />

  <!-- 3. HTML element name (string) -->
  <component is="div" />

  <!-- 4. Inline render function -->
  <component :is="() => h('span', 'hello')" />
</template>
```

<PlaygroundLink code="<script setup>
import { shallowRef } from 'vue'
import AlertBox from './AlertBox.vue'
import InfoBox from './InfoBox.vue'
&#10;const currentComponent = shallowRef(AlertBox)
</script>
&#10;<template>
&#10;  <component :is=&quot;currentComponent&quot; />
&#10;  <component is=&quot;AlertBox&quot; />
&#10;  <component is=&quot;div&quot; />
&#10;  <component :is=&quot;() => h('span', 'hello')&quot; />
</template>" />

When using a reactive variable, use `shallowRef` instead of `ref`. A `ref` would attempt to deeply unwrap the component object, which is unnecessary and can cause issues with complex component definitions.

## `is` on native HTML elements

The `is` attribute on regular HTML elements behaves differently than on `<component>`. It follows the HTML spec for customized built-in elements:

```vue
<!-- HTML spec behavior: "is" on native elements creates customized built-in elements -->
<button is="my-custom-button">Click</button>
<!-- This tells the browser to upgrade the <button> with a custom element class -->
```

<PlaygroundLink code="<button is=&quot;my-custom-button&quot;>Click</button>" />

To render a Vue component as a replacement for a native element, use the `vue:` prefix:

```vue
<!-- This renders the MyButton Vue component, not a native <button> -->
<button is="vue:MyButton">Click</button>

<!-- Useful when you need a Vue component inside elements that restrict children -->
<table>
  <tr is="vue:MyTableRow"></tr>
</table>
```

<PlaygroundLink code="<button is=&quot;vue:MyButton&quot;>Click</button>
&#10;<table>
  <tr is=&quot;vue:MyTableRow&quot;></tr>
</table>" />

## The `<table>` problem

HTML parsing rules restrict which elements can appear inside `<table>`, `<ul>`, `<ol>`, and `<select>`. The browser moves invalid children outside these elements before Vue even sees the DOM:

```vue
<!-- BAD: browser moves <BlogPost> outside <table> during HTML parsing -->
<table>
  <BlogPost />  <!-- ends up above the table in the DOM -->
</table>

<!-- GOOD: use is="vue:" to bypass the restriction -->
<table>
  <tr is="vue:BlogPost"></tr>
</table>
```

<PlaygroundLink code="<table>
  <BlogPost />  
</table>
&#10;<table>
  <tr is=&quot;vue:BlogPost&quot;></tr>
</table>" />

This is only an issue when templates are parsed as HTML (in-DOM templates). SFCs compiled with Vite don't have this problem because the template is compiled at build time, not parsed as HTML.

## Dynamic rendering with a component map

A common pattern for rendering different components based on data:

```vue
<script setup>
import TextBlock from './TextBlock.vue'
import ImageBlock from './ImageBlock.vue'
import VideoBlock from './VideoBlock.vue'
import type { Component } from 'vue'

const blockComponents: Record<string, Component> = {
  text: TextBlock,
  image: ImageBlock,
  video: VideoBlock
}

const blocks = ref([
  { type: 'text', content: 'Hello' },
  { type: 'image', src: '/photo.jpg' },
  { type: 'text', content: 'World' },
  { type: 'video', src: '/clip.mp4' }
])
</script>

<template>
  <component
    v-for="(block, i) in blocks"
    :key="i"
    :is="blockComponents[block.type]"
    v-bind="block"
  />
</template>
```

<PlaygroundLink code="<script setup>
import TextBlock from './TextBlock.vue'
import ImageBlock from './ImageBlock.vue'
import VideoBlock from './VideoBlock.vue'
import type { Component } from 'vue'
&#10;const blockComponents: Record<string, Component> = {
  text: TextBlock,
  image: ImageBlock,
  video: VideoBlock
}
&#10;const blocks = ref([
  { type: 'text', content: 'Hello' },
  { type: 'image', src: '/photo.jpg' },
  { type: 'text', content: 'World' },
  { type: 'video', src: '/clip.mp4' }
])
</script>
&#10;<template>
  <component
    v-for=&quot;(block, i) in blocks&quot;
    :key=&quot;i&quot;
    :is=&quot;blockComponents[block.type]&quot;
    v-bind=&quot;block&quot;
  />
</template>" />

This pattern is cleaner than a chain of `v-if`/`v-else-if` and scales to any number of block types without modifying the template.

## Resolution order

When `:is` receives a string, Vue resolves it in this order:

1. Locally registered components (via `import` in `<script setup>`)
2. Globally registered components (`app.component('name', ...)`)
3. Native HTML elements (`div`, `span`, `table`, etc.)

If the string doesn't match any component or HTML element, Vue renders nothing and warns in development.

## Combining with KeepAlive and Transition

```vue
<template>
  <KeepAlive :max="5">
    <Transition name="fade" mode="out-in">
      <component :is="currentTab" :key="currentTabName" />
    </Transition>
  </KeepAlive>
</template>
```

<PlaygroundLink code="<template>
  <KeepAlive :max=&quot;5&quot;>
    <Transition name=&quot;fade&quot; mode=&quot;out-in&quot;>
      <component :is=&quot;currentTab&quot; :key=&quot;currentTabName&quot; />
    </Transition>
  </KeepAlive>
</template>" />

Add `:key` when using `<Transition>` so Vue treats each component switch as a transition between distinct elements rather than patching the same component.

See also: [What are dynamic components and KeepAlive?](/q/dynamic-components-keepalive) · [How do render functions work?](/q/render-functions-jsx)

## References

- [Dynamic Components](https://vuejs.org/guide/essentials/component-basics.html#dynamic-components) - Vue.js docs
- [component](https://vuejs.org/api/built-in-special-elements.html#component) - Vue.js docs
- [is attribute](https://vuejs.org/api/built-in-special-attributes.html#is) - Vue.js docs
