---
order: 66
title: "How does the Vue plugin system work?"
difficulty: "intermediate"
tags: ["architecture", "provide-inject"]
---

A plugin is a way to add app-level functionality to Vue. You install it with `app.use()`, and inside the plugin's `install` function you can register global components, directives, provide values for injection, or add global properties.

## Plugin structure

A plugin is either an object with an `install` method or a plain function:

```ts
import type { App } from 'vue'

// Object form
const myPlugin = {
  install(app: App, options?: { debug: boolean }) {
    // register things here
  }
}

// Function form
function myPlugin(app: App, options?: { debug: boolean }) {
  // register things here
}

// Usage
app.use(myPlugin, { debug: true })
```

## What you can do inside install

```ts
import type { App } from 'vue'

const uiPlugin = {
  install(app: App) {
    // Global component (available in all templates)
    app.component('AppButton', AppButton)

    // Global directive
    app.directive('focus', { mounted: (el) => el.focus() })

    // Provide a service for inject()
    app.provide(httpKey, axiosInstance)

    // Global property (available as this.$http in Options API)
    app.config.globalProperties.$http = axiosInstance
  }
}
```

## Typed injection keys

String keys like `'http'` can collide between plugins. Use `InjectionKey<T>` symbols for type safety and uniqueness:

```ts
import type { InjectionKey } from 'vue'
import type { AxiosInstance } from 'axios'

export const httpKey: InjectionKey<AxiosInstance> = Symbol('http')
export const configKey: InjectionKey<AppConfig> = Symbol('appConfig')

const apiPlugin = {
  install(app: App, options: AppConfig) {
    app.provide(httpKey, axios.create({ baseURL: options.apiUrl }))
    app.provide(configKey, options)
  }
}
```

## Consuming plugin values with a composable

Wrap `inject` in a composable that throws a clear error if the plugin wasn't installed:

```ts
import { inject } from 'vue'
import { httpKey } from '@/plugins/api'

export function useHttp() {
  const http = inject(httpKey)
  if (!http) {
    throw new Error('API plugin not installed. Did you forget app.use(apiPlugin)?')
  }
  return http
}
```

Components use the composable without knowing about the injection key:

```vue
<script setup>
const http = useHttp()

const { data } = await http.get('/users')
</script>
```

## Plugin with options (typed)

```ts
import type { App, Plugin } from 'vue'

interface I18nOptions {
  locale: string
  messages: Record<string, Record<string, string>>
}

const i18nPlugin: Plugin<[I18nOptions]> = {
  install(app: App, options: I18nOptions) {
    const t = (key: string) => options.messages[options.locale]?.[key] ?? key

    app.provide(i18nKey, { t, locale: options.locale })
    app.config.globalProperties.$t = t
  }
}

// main.ts
app.use(i18nPlugin, {
  locale: 'en',
  messages: {
    en: { greeting: 'Hello' },
    es: { greeting: 'Hola' }
  }
})
```

## When to write a plugin vs a composable

| Need | Use |
|---|---|
| App-wide setup that runs once at startup | Plugin |
| Global components, directives, or properties | Plugin |
| Reusable logic consumed by individual components | Composable |
| Third-party library integration (analytics, i18n, HTTP) | Plugin that provides, composable that consumes |

See also: [What is a composable?](/q/what-is-a-composable) · [How would you handle i18n in Vue?](/q/i18n-vue) · [How would you structure a large Vue project?](/q/large-project-structure)

## References

- [Plugins](https://vuejs.org/guide/reusability/plugins.html) - Vue.js docs
- [app.use()](https://vuejs.org/api/application.html#app-use) - Vue.js docs
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
