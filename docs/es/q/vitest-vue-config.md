---
order: 105
title: "¿Cómo se configura Vitest para un proyecto Vue?"
difficulty: "intermediate"
tags: ["testing", "tooling"]
---

Vitest es un test runner construido sobre Vite. Entiende archivos `.vue`, TypeScript y JSX sin configuración adicional porque reutiliza tu config de Vite. Combinado con `@vue/test-utils` para montar componentes y `jsdom` o `happy-dom` para simular el DOM, es la configuración de testing estándar para proyectos Vue 3.

## Instalación

```bash
npm install -D vitest @vue/test-utils happy-dom
```

## Configuración

Vitest puede leer directamente desde `vite.config.ts`. Añade un bloque `test`:

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

O usa un `vitest.config.ts` separado si quieres mantener las cosas aisladas:

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
}))
```

Con `globals: true`, no necesitas importar `describe`, `it`, `expect` en cada archivo de test. Añade los tipos a tu tsconfig:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

## Escribir un test de componente

```ts
// src/components/__tests__/Counter.test.ts
import { mount } from '@vue/test-utils'
import Counter from '../Counter.vue'

describe('Counter', () => {
  it('renderiza el conteo inicial', () => {
    const wrapper = mount(Counter, {
      props: { initial: 5 }
    })
    expect(wrapper.text()).toContain('5')
  })

  it('incrementa al hacer clic', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('1')
  })

  it('emite el evento update', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update')).toHaveLength(1)
    expect(wrapper.emitted('update')![0]).toEqual([1])
  })
})
```

## Testear un composable

Los composables no necesitan un componente. Usa `withSetup` o pruébalos directamente:

```ts
// composables/__tests__/useCounter.test.ts
import { useCounter } from '../useCounter'

describe('useCounter', () => {
  it('empieza en el valor inicial', () => {
    const { count } = useCounter(10)
    expect(count.value).toBe(10)
  })

  it('incrementa', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })
})
```

Si el composable usa lifecycle hooks o provide/inject, móntalo dentro de un componente envolvente:

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

## Testear con Pinia

Crea una instancia de Pinia nueva por test:

```ts
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '../stores/cart'

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('empieza vacío', () => {
    const cart = useCartStore()
    expect(cart.items).toEqual([])
    expect(cart.total).toBe(0)
  })

  it('añade un elemento', () => {
    const cart = useCartStore()
    cart.addItem({ id: '1', name: 'Shirt', price: 25, qty: 1 })
    expect(cart.items).toHaveLength(1)
    expect(cart.total).toBe(25)
  })
})
```

## Ejecutar los tests

```bash
# Ejecutar una vez
npx vitest run

# Modo watch (re-ejecuta al cambiar archivos)
npx vitest

# Con cobertura
npx vitest run --coverage

# Archivo individual
npx vitest run src/components/__tests__/Counter.test.ts
```

Añade scripts a `package.json`:

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

| | happy-dom | jsdom |
|---|---|---|
| Velocidad | Más rápido | Más lento |
| Compatibilidad | Cubre la mayoría de casos de uso | API DOM más completa |
| Ideal para | Tests unitarios, tests de componentes | Tests que necesitan fidelidad completa de la API del navegador |

Empieza con `happy-dom`. Cambia a `jsdom` solo si te falta alguna API.

## Opciones de configuración principales

```ts
test: {
  environment: 'happy-dom',       // implementación DOM
  globals: true,                   // no es necesario importar describe/it/expect
  include: ['src/**/*.test.ts'],   // patrones de archivos de test
  coverage: {
    provider: 'v8',                // o 'istanbul'
    include: ['src/**/*.{ts,vue}'],
    exclude: ['src/**/*.test.ts']
  },
  setupFiles: ['./src/test/setup.ts'] // configuración global (p.ej. matchers personalizados)
}
```
