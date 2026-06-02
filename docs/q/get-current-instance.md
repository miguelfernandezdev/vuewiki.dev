---
order: 61
title: "What is getCurrentInstance() and why should you avoid it?"
difficulty: "advanced"
tags: ["composition-api", "pinia", "vueuse", "provide-inject"]
summary: "getCurrentInstance() exposes internal component state. It's internal API for library authors — avoid it in app code because it can break between versions."
---

[`getCurrentInstance()`](https://vuejs.org/api/composition-api-setup.html#getcurrentinstance) returns the internal component instance during `setup()`. It exposes internals like `$el`, `$parent`, `$refs`, `$emit`, the component's proxy, and the entire internal state. It's an escape hatch for library authors, not application code. The Vue team explicitly marks it as internal API, meaning it can change between minor versions without warning. If you use it in your app, you're coupling to implementation details that may break on any Vue update.

## What it returns

```ts
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()

// instance.proxy — the public interface (like `this` in Options API)
// instance.type — the component options/definition
// instance.parent — parent component instance
// instance.appContext — app-level context (plugins, directives, provides)
// instance.emit — the emit function
// instance.props — current props
```

It only works inside `setup()` or lifecycle hooks. Calling it in a `setTimeout`, `Promise.then`, or any async callback after `setup` completes returns `null`:

```ts
onMounted(() => {
  const instance = getCurrentInstance() // works

  setTimeout(() => {
    const instance = getCurrentInstance() // null
  }, 1000)
})
```

## Why people reach for it

Most uses fall into three categories, all of which have proper alternatives:

### 1. Accessing the component's DOM element

```ts
// BAD: using getCurrentInstance
const instance = getCurrentInstance()
const el = instance?.proxy?.$el

// GOOD: template ref
const elementRef = ref<HTMLElement>()
onMounted(() => {
  elementRef.value // the DOM element
})
```

### 2. Accessing app-level context (router, i18n, custom plugins)

```ts
// BAD: digging through appContext
const instance = getCurrentInstance()
const router = instance?.appContext.config.globalProperties.$router

// GOOD: use the composable the library provides
const router = useRouter()
const i18n = useI18n()
```

### 3. Accessing parent/child instances

```ts
// BAD: traversing the component tree
const instance = getCurrentInstance()
const parentData = instance?.parent?.proxy?.someData

// GOOD: props, emit, provide/inject
const someData = inject<string>('someData')
```

## When library authors use it legitimately

Libraries like VueUse, Vue Router, and Pinia use `getCurrentInstance` internally because they need to:

- Hook into the component lifecycle from outside `<script setup>`
- Access the app context to register plugins
- Read the component tree for devtools integration

For example, `useRouter()` internally calls `getCurrentInstance()` to access the router instance that was installed via `app.use(router)`. But the library wraps this in a stable public API so your code never touches the instance directly.

## The risks

1. **No type safety**: the internal instance type is not part of Vue's public TypeScript API. You'll be casting to `any` everywhere.

2. **Breaks on updates**: Vue's internal component structure has changed between 3.0, 3.2, 3.3, and 3.4. Code that accessed `instance.setupState` or `instance.ctx` has broken across versions.

3. **Doesn't work in async contexts**: if your composable does anything async, `getCurrentInstance()` returns `null` after the first `await`, leading to intermittent bugs.

4. **SSR differences**: the instance structure differs between client and server rendering, so code that works in the browser may crash during SSR.

## Summary

| Need | Use instead |
|---|---|
| DOM element | Template ref |
| Router, i18n, custom plugins | Their composables (`useRouter`, `useI18n`) |
| Parent data | `inject()` |
| Emit from composable | Pass `emit` as a parameter |
| App context in a library | `getCurrentInstance()` is acceptable (wrap it) |
| App code | Never use `getCurrentInstance()` |

See also: [What is Provide/Inject?](/q/provide-inject) · [How do template refs work?](/q/template-refs)

## References

- [getCurrentInstance](https://vuejs.org/api/composition-api-setup.html#getcurrentinstance) - Vue.js docs
- [provide](https://vuejs.org/api/composition-api-dependency-injection.html#provide) - Vue.js docs
- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
