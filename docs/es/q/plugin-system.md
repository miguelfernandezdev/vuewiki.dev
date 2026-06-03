---
order: 130
title: '¿Cómo funciona el sistema de plugins de Vue?'
difficulty: 'intermediate'
tags: ['architecture', 'provide-inject']
summary: 'Los plugins añaden funcionalidad a nivel de app via app.use(). Dentro de install() puedes registrar componentes globales, directivas, provide valores o añadir propiedades.'
---

Un plugin es una forma de añadir funcionalidad a nivel de app en Vue. Se instala con `app.use()`, y dentro de la función `install` del plugin se pueden registrar componentes globales, directivas, proveer valores para inyección o añadir propiedades globales.

## Estructura de un plugin

Un plugin es un objeto con un método `install` o una función simple:

```ts
import type { App } from 'vue'

// Forma de objeto
const myPlugin = {
  install(app: App, options?: { debug: boolean }) {
    // registrar cosas aquí
  }
}

// Forma de función
function myPlugin(app: App, options?: { debug: boolean }) {
  // registrar cosas aquí
}

// Uso
app.use(myPlugin, { debug: true })
```

## Qué se puede hacer dentro de install

```ts
import type { App } from 'vue'

const uiPlugin = {
  install(app: App) {
    // Componente global (disponible en todos los templates)
    app.component('AppButton', AppButton)

    // Directiva global
    app.directive('focus', { mounted: (el) => el.focus() })

    // Proveer un servicio para inject()
    app.provide(httpKey, axiosInstance)

    // Propiedad global (disponible como this.$http en Options API)
    app.config.globalProperties.$http = axiosInstance
  }
}
```

## Claves de inyección tipadas

Las claves de tipo string como `'http'` pueden colisionar entre plugins. Usar símbolos `InjectionKey<T>` para seguridad de tipos y unicidad:

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

## Consumir valores del plugin con un composable

Envolver `inject` en un composable que lance un error claro si el plugin no se instaló:

```ts
import { inject } from 'vue'
import { httpKey } from '@/plugins/api'

export function useHttp() {
  const http = inject(httpKey)
  if (!http) {
    throw new Error(
      'API plugin not installed. Did you forget app.use(apiPlugin)?'
    )
  }
  return http
}
```

Los componentes usan el composable sin conocer la clave de inyección:

```vue
<script setup>
const http = useHttp()

const { data } = await http.get('/users')
</script>
```

<PlaygroundLink code="<script setup>
const http = useHttp()
&#10;const { data } = await http.get('/users')
</script>" />

## Plugin con opciones (tipado)

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

## Cuándo escribir un plugin vs un composable

| Necesidad                                                     | Usar                                      |
| ------------------------------------------------------------- | ----------------------------------------- |
| Configuración a nivel de app que se ejecuta una vez al inicio | Plugin                                    |
| Componentes globales, directivas o propiedades                | Plugin                                    |
| Lógica reutilizable consumida por componentes individuales    | Composable                                |
| Integración de librería de terceros (analytics, i18n, HTTP)   | Plugin que provee, composable que consume |

Ver también: [¿Qué es un composable?](/es/q/what-is-a-composable) · [¿Cómo manejar la internacionalización en Vue?](/es/q/i18n-vue) · [¿Cómo estructurar un proyecto Vue grande?](/es/q/large-project-structure)

## Referencias

- [Plugins](https://vuejs.org/guide/reusability/plugins.html) - Vue.js docs
- [app.use()](https://vuejs.org/api/application.html#app-use) - Vue.js docs
- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
