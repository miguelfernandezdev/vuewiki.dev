---
order: 169
title: "How do you test components that use async setup and Suspense?"
difficulty: "advanced"
tags: ["testing", "components"]
---

Wrap the component in a `<Suspense>` boundary in your test, then use `flushPromises()` to wait for the async setup to resolve. Without `<Suspense>`, Vue warns that the component has an async `setup()` but no parent Suspense boundary, and the component never renders. The test mounts a wrapper that provides the Suspense, then asserts after all promises settle.

## The component under test

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

The top-level `await` makes this an async setup component. Vue's compiler wraps the entire `<script setup>` in an `async setup()` function.

## The test

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { Suspense, defineComponent, h } from 'vue'
import UserProfile from './UserProfile.vue'

function mountSuspense(component: any, props: Record<string, any> = {}) {
  return mount(
    defineComponent({
      setup() {
        return () => h(Suspense, null, {
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
        new Response(JSON.stringify({ name: 'Alice', email: 'alice@example.com' }))
      )
    )
  })

  it('renders user data after async setup resolves', async () => {
    const wrapper = mountSuspense(UserProfile, { userId: 1 })

    // Initially shows fallback
    expect(wrapper.text()).toContain('Loading...')

    // Wait for all promises (the async setup) to resolve
    await flushPromises()

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('alice@example.com')
  })

  it('can test the loading state', async () => {
    // Create a promise we control
    let resolveData: (value: any) => void
    global.fetch = vi.fn(() =>
      new Promise(resolve => {
        resolveData = () => resolve(
          new Response(JSON.stringify({ name: 'Bob', email: 'bob@test.com' }))
        )
      })
    )

    const wrapper = mountSuspense(UserProfile, { userId: 2 })
    expect(wrapper.text()).toContain('Loading...')

    // Resolve the fetch
    resolveData!()
    await flushPromises()

    expect(wrapper.text()).toContain('Bob')
  })
})
```

## Why flushPromises is necessary

`flushPromises()` from `@vue/test-utils` waits for all pending microtasks (Promise resolutions) to complete. The async setup is a Promise that Vue awaits internally. Without flushing, the assertions run before the setup resolves:

```
mount(Suspense wrapper)
  → Suspense renders fallback
  → Async setup starts (fetch fires)

await flushPromises()
  → fetch resolves
  → Async setup completes
  → Suspense swaps fallback for default slot
  → Component renders with data
```

## Testing error states with onErrorCaptured

Suspense doesn't handle errors by itself. Use `onErrorCaptured` in the wrapper:

```ts
function mountSuspenseWithError(component: any, props: Record<string, any> = {}) {
  const errors: Error[] = []

  const wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((err) => {
          errors.push(err as Error)
          return false
        })
        return () => h(Suspense, null, {
          default: () => h(component, props),
          fallback: () => h('div', 'Loading...')
        })
      }
    })
  )

  return { wrapper, errors }
}

it('captures errors from async setup', async () => {
  global.fetch = vi.fn(() => Promise.reject(new Error('Not found')))

  const { errors } = mountSuspenseWithError(UserProfile, { userId: 999 })
  await flushPromises()

  expect(errors).toHaveLength(1)
  expect(errors[0].message).toBe('Not found')
})
```

## Reusable test helper

Extract the Suspense wrapper into a test utility:

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
        return () => h(Suspense, null, {
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
// Usage in tests
it('renders user data', async () => {
  const wrapper = await mountAsync(UserProfile, { props: { userId: 1 } })
  expect(wrapper.text()).toContain('Alice')
})
```

The `mountAsync` helper handles the Suspense wrapping and promise flushing in one call, so tests stay focused on assertions.
