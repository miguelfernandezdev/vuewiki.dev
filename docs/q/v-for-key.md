---
order: 9
title: "What's the purpose of :key in v-for?"
difficulty: 'beginner'
tags: ['directives']
summary: ':key gives each list item a stable identity so Vue can reuse and reorder DOM elements correctly instead of patching by position.'
---

When Vue renders a list with [`v-for`](https://vuejs.org/guide/essentials/list.html), it needs a way to tell which DOM element corresponds to which item in the array. The `:key` attribute is that identifier. Without it (or with a bad key), Vue takes shortcuts that can cause real bugs.

## What goes wrong without a proper key

Without a unique key, Vue reuses DOM elements by position. If you remove the second item from a list, Vue doesn't remove the second `<li>`. Instead, it updates the text of items 2, 3, 4... and removes the last one. This is efficient for simple text, but breaks when elements have their own state.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' }
])

function removeFirst() {
  items.value.shift()
}
</script>

<template>
  <!-- ❌ key=index: after removing Apple, the input that had Apple's
       typed text now sits next to Banana — state is mismatched -->
  <div v-for="(item, index) in items" :key="index">
    <span>{{ item.name }}</span>
    <input placeholder="Type something" />
  </div>

  <!-- ✅ key=item.id: Vue correctly removes Apple's entire DOM node,
       Banana and Cherry keep their inputs and state -->
  <div v-for="item in items" :key="item.id">
    <span>{{ item.name }}</span>
    <input placeholder="Type something" />
  </div>
</template>
```

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
import { ref } from 'vue'
&#10;const items = ref([
{ id: 1, name: 'Apple' },
{ id: 2, name: 'Banana' },
{ id: 3, name: 'Cherry' }
])
&#10;function removeFirst() {
items.value.shift()
}
</script>
&#10;<template>

  <!-- ❌ key=index: after removing Apple, the input that had Apple's
       typed text now sits next to Banana — state is mismatched -->
  <div v-for=&quot;(item, index) in items&quot; :key=&quot;index&quot;>
    <span>{{ item.name }}</span>
    <input placeholder=&quot;Type something&quot; />
  </div>
&#10;  <!-- ✅ key=item.id: Vue correctly removes Apple's entire DOM node,
       Banana and Cherry keep their inputs and state -->
  <div v-for=&quot;item in items&quot; :key=&quot;item.id&quot;>
    <span>{{ item.name }}</span>
    <input placeholder=&quot;Type something&quot; />
  </div>
</template>" />

Type something in each input, then remove the first item. With `key=index`, the inputs shuffle. With `key=item.id`, the correct DOM node is removed and everything else stays put.

## The rules

1. **Always use `:key`** on `v-for` elements.
2. **Use a unique, stable identifier**: an `id` from your data, a database primary key, a slug. Something that stays the same across re-renders.
3. **Never use the array index as key** if items can be reordered, inserted, or removed. The index changes when the array changes, which defeats the purpose.
4. **Keys must be primitives**: strings or numbers. Objects don't work.

```vue
<!-- ✅ Good: stable ID from the data -->
<li v-for="user in users" :key="user.id">{{ user.name }}</li>

<!-- ✅ Good: stable unique string -->
<li v-for="tab in tabs" :key="tab.slug">{{ tab.label }}</li>

<!-- ❌ Bad: index shifts when array changes -->
<li v-for="(item, i) in items" :key="i">{{ item.name }}</li>
```

<PlaygroundLink code="<!-- ✅ Good: stable ID from the data -->

<li v-for=&quot;user in users&quot; :key=&quot;user.id&quot;>{{ user.name }}</li>
&#10;<!-- ✅ Good: stable unique string -->
<li v-for=&quot;tab in tabs&quot; :key=&quot;tab.slug&quot;>{{ tab.label }}</li>
&#10;<!-- ❌ Bad: index shifts when array changes -->
<li v-for=&quot;(item, i) in items&quot; :key=&quot;i&quot;>{{ item.name }}</li>" />

## When index is fine

If the list is **static** (never reordered, no additions or deletions) and items have no internal state (no inputs, no child components), then `key=index` won't cause bugs. But using a real ID is a safe habit that costs nothing.

See also: [How does list rendering work with v-for?](/q/list-rendering-v-for) · [What's the difference between v-if and v-show?](/q/v-if-vs-v-show)

## References

- [Maintaining State with key](https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key) - Vue.js docs
- [v-for](https://vuejs.org/api/built-in-directives.html#v-for) - Vue.js docs
- [List Rendering](https://vuejs.org/guide/essentials/list.html) - Vue.js docs
