---
order: 115
title: 'How do you configure Vitest for a Vue project?'
difficulty: 'intermediate'
tags: ['testing', 'tooling', 'pinia', 'vite', 'vitest', 'provide-inject']
summary: 'Vitest reuses your Vite config. Add @vue/test-utils + jsdom/happy-dom. Configure in vitest.config.ts or inside vite.config.ts under test.'
---

Vitest is a test runner built on Vite. It understands `.vue` files, TypeScript, and JSX out of the box because it reuses your Vite config. Combined with `@vue/test-utils` for component mounting and `jsdom` or `happy-dom` for DOM simulation, it's the standard testing setup for Vue 3 projects.

## Installation

```bash
npm install -D vitest @vue/test-utils happy-dom
```

## Configuration

Vitest can read from `vite.config.ts` directly. Add a `test` block:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true
  }
})
```

Or use a separate `vitest.config.ts` if you want to keep things isolated:

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      globals: true,
      include: ['src/**/*.{test,spec}.{ts,tsx}']
    }
  })
)
```

With `globals: true`, you don't need to import `describe`, `it`, `expect` in every test file. Add the types to your tsconfig:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

## Writing a component test

```ts
// src/components/__tests__/Counter.test.ts
import { mount } from '@vue/test-utils'
import Counter from '../Counter.vue'

describe('Counter', () => {
  it('renders the initial count', () => {
    const wrapper = mount(Counter, {
      props: { initial: 5 }
    })
    expect(wrapper.text()).toContain('5')
  })

  it('increments on click', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('1')
  })

  it('emits update event', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update')).toHaveLength(1)
    expect(wrapper.emitted('update')![0]).toEqual([1])
  })
})
```

## Testing a composable

Composables don't need a component. Use `withSetup` or test them directly:

```ts
// composables/__tests__/useCounter.test.ts
import { useCounter } from '../useCounter'

describe('useCounter', () => {
  it('starts at initial value', () => {
    const { count } = useCounter(10)
    expect(count.value).toBe(10)
  })

  it('increments', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })
})
```

If the composable uses lifecycle hooks or provide/inject, mount it inside a wrapper component:

```ts
import { mount } from '@vue/test-utils'
import { useRoute } from 'vue-router'

function withSetup<T>(composable: () => T) {
  let result: T
  mount({
    setup() {
      result = composable()
      return () => {}
    }
  })
  return result!
}
```

## Testing with Pinia

Create a fresh Pinia instance per test:

```ts
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../stores/cart'

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const cart = useCartStore()
    expect(cart.items).toEqual([])
    expect(cart.total).toBe(0)
  })

  it('adds an item', () => {
    const cart = useCartStore()
    cart.addItem({ id: '1', name: 'Shirt', price: 25, qty: 1 })
    expect(cart.items).toHaveLength(1)
    expect(cart.total).toBe(25)
  })
})
```

## Running tests

```bash
# Run once
npx vitest run

# Watch mode (re-runs on file changes)
npx vitest

# With coverage
npx vitest run --coverage

# Single file
npx vitest run src/components/__tests__/Counter.test.ts
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## happy-dom vs jsdom

|               | happy-dom                   | jsdom                                   |
| ------------- | --------------------------- | --------------------------------------- |
| Speed         | Faster                      | Slower                                  |
| Compatibility | Covers most use cases       | More complete DOM API                   |
| Best for      | Unit tests, component tests | Tests needing full browser API fidelity |

Start with `happy-dom`. Switch to `jsdom` only if you hit a missing API.

## Key configuration options

```ts
test: {
  environment: 'happy-dom',       // DOM implementation
  globals: true,                   // no need to import describe/it/expect
  include: ['src/**/*.test.ts'],   // test file patterns
  coverage: {
    provider: 'v8',                // or 'istanbul'
    include: ['src/**/*.{ts,vue}'],
    exclude: ['src/**/*.test.ts']
  },
  setupFiles: ['./src/test/setup.ts'] // global setup (e.g. custom matchers)
}
```

See also: [How do you test Vue components with Vitest?](/q/testing-with-vitest) · [What is Vite?](/q/what-is-vite) · [How do Vue DevTools help with debugging?](/q/vue-devtools)

## References

- [Vitest Configuration](https://vitest.dev/config/) - Vitest docs
- [Testing](https://vuejs.org/guide/scaling-up/testing.html) - Vue.js docs
- [Vue Test Utils](https://test-utils.vuejs.org/) - Vue Test Utils docs
