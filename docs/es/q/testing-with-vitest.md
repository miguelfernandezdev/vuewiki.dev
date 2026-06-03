---
order: 114
title: '¿Cómo se testean componentes Vue con Vitest?'
difficulty: 'intermediate'
tags: ['testing', 'vitest', 'v-model']
summary: 'Vitest + @vue/test-utils: mount() para tests de integración con hijos, shallowMount() para tests aislados del padre. Se ejecuta en jsdom o happy-dom.'
---

Vitest ejecuta tests de componentes Vue usando `@vue/test-utils` para montar componentes y la propia API de aserciones de Vitest. Los tests corren en un entorno DOM simulado (jsdom o happy-dom), no en un navegador real, lo que mantiene el ciclo de feedback rápido. La contrapartida es que las APIs específicas del navegador son mocked. Para comportamiento real de navegador, considera Playwright o Cypress.

## Montar un componente

`@vue/test-utils` ofrece dos estrategias de montaje. `mount` renderiza el árbol completo de componentes incluyendo los hijos, lo que es ideal para tests de integración donde el comportamiento de los hijos importa. `shallowMount` reemplaza los componentes hijo con stubs, lo que es útil cuando quieres testear un componente padre de forma aislada sin arrastrar hijos complejos.

```ts
import { describe, it, expect } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import TodoList from '../TodoList.vue'

describe('TodoList', () => {
  it('renders the list items', () => {
    // mount renderiza los componentes hijo (integración)
    const wrapper = mount(TodoList, {
      props: { items: ['Buy milk', 'Walk the dog'] }
    })

    const items = wrapper.findAll('li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toBe('Buy milk')
  })

  it('renders empty state when no items', () => {
    // shallowMount hace stub de los hijos (unitario)
    const wrapper = shallowMount(TodoList, {
      props: { items: [] }
    })

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No tasks')
  })
})
```

Usa `wrapper.find()` para localizar un único elemento y `wrapper.findAll()` para varios. Prefiere atributos `data-testid` antes que clases CSS o etiquetas de elemento. Expresan la intención y son resistentes a refactorizaciones de estilos.

## Testar interacciones del usuario

Las interacciones con el DOM son asíncronas en Vue porque el framework agrupa las actualizaciones del DOM. Siempre usa `await` con las llamadas a `trigger()` y `setValue()`, y luego verifica el estado actualizado.

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Counter from '../Counter.vue'

describe('Counter', () => {
  it('increments when the button is clicked', async () => {
    const wrapper = mount(Counter)

    expect(wrapper.find('[data-testid="count"]').text()).toBe('0')

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('[data-testid="count"]').text()).toBe('1')
  })

  it('updates from text input', async () => {
    const wrapper = mount(Counter)

    await wrapper.find('input').setValue('hello')

    // setValue dispara el evento input y actualiza el valor
    expect(wrapper.find('[data-testid="output"]').text()).toBe('hello')
  })
})
```

Si necesitas esperar algo más allá del siguiente ciclo de renderizado, usa la herramienta adecuada para cada caso. Para actualizaciones pendientes del DOM de Vue, usa `await nextTick()`. Para resoluciones de Promesas pendientes (como llamadas a APIs), usa `await flushPromises()` de `@vue/test-utils`. Para timers (`setTimeout`), usa los fake timers de Vitest (`vi.useFakeTimers()`).

## Testar props y eventos emitidos

Los componentes se comunican hacia afuera mediante emits. `wrapper.emitted()` devuelve un objeto donde cada clave es el nombre de un evento y el valor es un array de arrays (un array interior por cada emisión, con los argumentos que se pasaron en ese momento).

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CheckboxItem from '../CheckboxItem.vue'

describe('CheckboxItem', () => {
  it('emits update:modelValue with the new value when toggled', async () => {
    const wrapper = mount(CheckboxItem, {
      props: {
        label: 'Accept terms',
        modelValue: false
      }
    })

    await wrapper.find('input[type="checkbox"]').setValue(true)

    // emitted() devuelve { 'update:modelValue': [[true]] }
    // array exterior = emisiones, array interior = argumentos por emisión
    const emissions = wrapper.emitted('update:modelValue')
    expect(emissions).toBeTruthy()
    expect(emissions![0]).toEqual([true])
  })
})
```

## Testar composables

Los composables son funciones normales. Testéalos llamándolos directamente y verificando los refs que devuelven. No hace falta montar ningún componente, lo que hace que estos tests sean los más sencillos de escribir.

```ts
import { it, expect } from 'vitest'
import { useCounter } from '../composables/useCounter'

it('starts at zero and increments', () => {
  const { count, increment } = useCounter()

  expect(count.value).toBe(0)
  increment()
  expect(count.value).toBe(1)
})
```

Un matiz importante: los composables que usan hooks de ciclo de vida (`onMounted`, `onUnmounted`) necesitan ejecutarse dentro de un contexto de componente. Envuélvelos en un componente host mínimo usando `mount` con una función `setup`, o usa el patrón helper `withSetup` documentado en la Vue Testing Guide.

## Mocking

Usa `vi.fn()` para crear un mock de callback que puedes pasar como prop y verificar después. Usa `vi.mock()` para reemplazar un módulo completo, lo que es útil para hacer mock de llamadas a APIs o servicios de terceros.

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UserProfile from '../UserProfile.vue'
import * as api from '../api/users'

// Reemplaza el módulo completo — el mock se eleva al inicio del archivo
vi.mock('../api/users')

describe('UserProfile', () => {
  it('displays the user name after loading', async () => {
    vi.mocked(api.getUser).mockResolvedValue({ id: 1, name: 'Ana García' })

    const wrapper = mount(UserProfile, { props: { userId: 1 } })

    await flushPromises() // espera a que se resuelva la llamada asíncrona

    expect(wrapper.find('[data-testid="name"]').text()).toBe('Ana García')
  })

  it('calls the onSave callback prop when the form is submitted', async () => {
    const onSave = vi.fn()
    const wrapper = mount(UserProfile, {
      props: { userId: 1, onSave }
    })

    await wrapper.find('form').trigger('submit')

    expect(onSave).toHaveBeenCalledOnce()
  })
})
```

## Qué testear

Céntrate en el comportamiento observable desde fuera: lo que el usuario ve o lo que el componente comunica a su padre.

| Test                        | Ejemplo                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Renderizado según las props | El componente muestra "estado vacío" cuando `items=[]`             |
| Interacciones del usuario   | Clic en botón → el contador incrementa                             |
| Eventos emitidos            | Toggle del checkbox → emite `update:modelValue` con el nuevo valor |
| Comportamiento computado    | La lista filtrada muestra solo los elementos que coinciden         |
| Casos límite                | Input vacío, valores en el límite, props null/undefined            |

Qué NO testear: detalles de implementación como la estructura interna del estado reactivo (testear que `count` está almacenado como `ref` vs propiedad `reactive`), comportamiento del framework (`v-if` funcionando correctamente es responsabilidad de Vue, no tuya), ni estilos CSS.

El principio rector: si puedes refactorizar la implementación sin cambiar el comportamiento visible para el usuario, el test debe seguir pasando.

---

Ver también: [¿Cómo se configura Vitest para un proyecto Vue?](/es/q/vitest-vue-config) · [¿Cuáles son los anti-patrones más comunes en bases de código Vue grandes?](/es/q/vue-anti-patterns) · [¿Cómo ayudan las Vue DevTools al depurar?](/es/q/vue-devtools)

## Referencias

- [Testing](https://vuejs.org/guide/scaling-up/testing.html) - Vue.js docs
- [Vue Test Utils](https://test-utils.vuejs.org/) - Vue Test Utils docs
- [Vitest](https://vitest.dev/) - Vitest docs
