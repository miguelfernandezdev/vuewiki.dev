---
order: 11
title: "Why doesn't v-show work on template elements?"
difficulty: "beginner"
tags: ["directives", "errors"]
---

Because `v-show` works by toggling the CSS `display` property, and `<template>` elements don't render to the DOM. There is no real element to set `display: none` on.

```vue
<!-- v-show on <template> silently does nothing -->
<template v-show="isVisible">
  <h1>Title</h1>
  <p>Content</p>
</template>
<!-- These elements will ALWAYS be visible -->
```

Another limitation: `v-show` does not support `v-else`.

```vue
<!-- v-else does NOT work with v-show -->
<div v-show="isLoggedIn">Welcome!</div>
<div v-else>Please log in</div> <!-- broken -->
```

## How to fix it

**To toggle multiple elements:** use `v-if` on `<template>` (it does support it), or wrap them in a real element with `v-show`.

```vue
<!-- v-if works on <template> -->
<template v-if="isVisible">
  <h1>Title</h1>
  <p>Content</p>
</template>

<!-- Or wrap in a real element -->
<div v-show="isVisible">
  <h1>Title</h1>
  <p>Content</p>
</div>
```

**For "else" behavior with v-show:** use a negated condition.

```vue
<div v-show="isLoggedIn">Welcome!</div>
<div v-show="!isLoggedIn">Please log in</div>
```

## Quick reference

| Need | Use |
|---|---|
| Toggle multiple elements without a wrapper | `<template v-if>` |
| Frequent toggle, single element | `v-show` on the element |
| Frequent toggle, need "else" | Two `v-show` with negated conditions |
| v-else / v-else-if branches | `v-if` / `v-else` |

See also: [Why can't you use v-if and v-for on the same element?](/q/v-if-with-v-for) · [What are event modifiers?](/q/event-modifier-order) · [What is v-once and v-memo?](/q/v-once-v-memo)

## References

- [v-show](https://vuejs.org/api/built-in-directives.html#v-show) - Vue.js docs
- [v-if vs v-show](https://vuejs.org/guide/essentials/conditional.html#v-if-vs-v-show) - Vue.js docs
- [Conditional Rendering](https://vuejs.org/guide/essentials/conditional.html) - Vue.js docs
