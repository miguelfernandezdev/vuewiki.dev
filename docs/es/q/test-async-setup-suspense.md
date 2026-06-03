---
order: 119
title: '¿Cómo se prueban componentes que usan async setup y Suspense?'
difficulty: 'advanced'
tags: ['testing', 'components', 'vitest', 'suspense']
summary: 'Envuelve el componente en <Suspense> en tu test, luego llama a flushPromises() para esperar que el setup async se resuelva antes de hacer assertions.'
---

Envuelve el componente en un límite `<Suspense>` en tu test, luego usa `flushPromises()` para esperar a que el async setup se resuelva. Sin `<Suspense>`, Vue avisa de que el componente tiene un `setup()` asíncrono pero no tiene un límite Suspense padre, y el componente nunca se renderiza. El test monta un wrapper que proporciona el Suspense y luego hace las comprobaciones después de que todas las promesas se resuelvan.

## El componente bajo prueba

```vue
<!-- UserProfile.vue -->
<script setup>
const props = defineProps<{ userId: number }>()

const user = await $fetch(`/api/users/${props.userId}`)
</script>

<template>
  <h1>{{ user.name }}</h1>
  <p>{{ user.email }}</p>
</template>
```

<PlaygroundLink code="<!-- UserProfile.vue -->
<script setup>
const props = defineProps<{ userId: number }>()
&#10;const user = await $fetch(`/api/users/${props.userId}`)
</script>
&#10;<template>
  <h1>{{ user.name }}</h1>
  <p>{{ user.email }}</p>
</template>" />

El `await` de nivel superior convierte esto en un componente con async setup. El compilador de Vue envuelve todo el `<script setup>` en una función `async setup()`.

## El test

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Suspense, defineComponent, h } from 'vue'
import UserProfile from './UserProfile.vue'

function mountSuspense(component: any, props: Record<string, any> = {}) {
  return mount(
    defineComponent({
      setup() {
        return () =>
          h(Suspense, null, {
            default: () => h(component, props),
            fallback: () => h('div', 'Loading...')
          })
      }
    })
  )
}

describe('UserProfile', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ name: 'Alice', email: 'alice@example.com' })
        )
      )
    )
  })

  it('renderiza los datos del usuario tras resolver el async setup', async () => {
    const wrapper = mountSuspense(UserProfile, { userId: 1 })

    // Inicialmente muestra el fallback
    expect(wrapper.text()).toContain('Loading...')

    // Espera a que todas las promesas (el async setup) se resuelvan
    await flushPromises()

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('alice@example.com')
  })

  it('puede probar el estado de carga', async () => {
    // Crea una promesa que controlamos nosotros
    let resolveData: (value: any) => void
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveData = () =>
            resolve(
              new Response(
                JSON.stringify({ name: 'Bob', email: 'bob@test.com' })
              )
            )
        })
    )

    const wrapper = mountSuspense(UserProfile, { userId: 2 })
    expect(wrapper.text()).toContain('Loading...')

    // Resuelve el fetch
    resolveData!()
    await flushPromises()

    expect(wrapper.text()).toContain('Bob')
  })
})
```

## Por qué es necesario flushPromises

`flushPromises()` de `@vue/test-utils` espera a que todas las microtareas pendientes (resoluciones de Promise) se completen. El async setup es una Promise que Vue awaita internamente. Sin hacer el flush, las comprobaciones se ejecutan antes de que el setup se resuelva:

```
mount(wrapper de Suspense)
  → Suspense renderiza el fallback
  → El async setup comienza (el fetch se lanza)

await flushPromises()
  → El fetch se resuelve
  → El async setup se completa
  → Suspense cambia del fallback al slot por defecto
  → El componente se renderiza con los datos
```

## Probar estados de error con onErrorCaptured

Suspense no gestiona errores por sí solo. Usa `onErrorCaptured` en el wrapper:

```ts
function mountSuspenseWithError(
  component: any,
  props: Record<string, any> = {}
) {
  const errors: Error[] = []

  const wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((err) => {
          errors.push(err as Error)
          return false
        })
        return () =>
          h(Suspense, null, {
            default: () => h(component, props),
            fallback: () => h('div', 'Loading...')
          })
      }
    })
  )

  return { wrapper, errors }
}

it('captura errores del async setup', async () => {
  global.fetch = vi.fn(() => Promise.reject(new Error('Not found')))

  const { errors } = mountSuspenseWithError(UserProfile, { userId: 999 })
  await flushPromises()

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toBe('Not found')
})
```

## Helper de test reutilizable

Extrae el wrapper de Suspense a una utilidad de test:

```ts
// test/helpers.ts
import { mount, flushPromises } from '@vue/test-utils'
import { Suspense, defineComponent, h } from 'vue'

export async function mountAsync(
  component: any,
  options: { props?: Record<string, any>; global?: any } = {}
) {
  const wrapper = mount(
    defineComponent({
      setup() {
        return () =>
          h(Suspense, null, {
            default: () => h(component, options.props ?? {}),
            fallback: () => h('div', 'Loading...')
          })
      }
    }),
    { global: options.global }
  )

  await flushPromises()
  return wrapper
}
```

```ts
// Uso en los tests
it('renderiza los datos del usuario', async () => {
  const wrapper = await mountAsync(UserProfile, { props: { userId: 1 } })
  expect(wrapper.text()).toContain('Alice')
})
```

El helper `mountAsync` gestiona el envoltorio con Suspense y el flush de promesas en una sola llamada, para que los tests se centren en las comprobaciones.

Ver también: [¿Cómo funciona Suspense?](/es/q/suspense) · [¿Cómo testear un composable que usa fetch?](/es/q/testing-composable-fetch)

## Referencias

- [Testing Async Components](https://test-utils.vuejs.org/guide/advanced/async-suspense.html) - Vue Test Utils docs
- [flushPromises](https://test-utils.vuejs.org/api/#flushpromises) - Vue Test Utils docs
