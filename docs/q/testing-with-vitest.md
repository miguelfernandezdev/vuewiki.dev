---
order: 15
title: "How do you test Vue components with Vitest?"
difficulty: "intermediate"
tags: ["testing", "vitest", "v-model"]
---

Vitest runs Vue component tests using `@vue/test-utils` for mounting components and Vitest's own assertion API. Tests execute in a simulated DOM environment (jsdom or happy-dom), not a real browser, which keeps the feedback loop fast. The trade-off is that browser-specific APIs are mocked — for real browser behavior, consider Playwright or Cypress.

## Mounting a component

`@vue/test-utils` gives you two mounting strategies. `mount` renders the full component tree including children — good for integration-style tests where child behavior matters. `shallowMount` replaces child components with stubs — useful when you want to test a parent component in isolation without pulling in complex children.

```ts
import { describe, it, expect } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import TodoList from '../TodoList.vue'

describe('TodoList', () => {
  it('renders the list items', () => {
    // mount renders child components (integration)
    const wrapper = mount(TodoList, {
      props: { items: ['Buy milk', 'Walk the dog'] }
    })

    const items = wrapper.findAll('li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toBe('Buy milk')
  })

  it('renders empty state when no items', () => {
    // shallowMount stubs children (unit)
    const wrapper = shallowMount(TodoList, {
      props: { items: [] }
    })

    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No tasks')
  })
})
```

Use `wrapper.find()` to locate a single element and `wrapper.findAll()` for multiple. Prefer `data-testid` attributes over CSS classes or element tags — they express intent and are resilient to style refactors.

## Testing user interactions

DOM interactions are asynchronous in Vue because the framework batches DOM updates. Always `await` `trigger()` and `setValue()` calls, then assert on the updated state.

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

    // setValue triggers the input event and updates the value
    expect(wrapper.find('[data-testid="output"]').text()).toBe('hello')
  })
})
```

If you need to wait for something beyond the next render cycle, use the right tool for the job. For pending Vue DOM updates, use `await nextTick()`. For pending Promise resolutions (like API calls), use `await flushPromises()` from `@vue/test-utils`. For timers (`setTimeout`), use Vitest's fake timers (`vi.useFakeTimers()`).

## Testing props and emitted events

Components communicate outward via emits. `wrapper.emitted()` returns an object where each key is an event name and the value is an array of arrays — one inner array per emission, each holding the arguments passed that time.

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

    // emitted() returns { 'update:modelValue': [[true]] }
    // outer array = emissions, inner array = arguments per emission
    const emissions = wrapper.emitted('update:modelValue')
    expect(emissions).toBeTruthy()
    expect(emissions![0]).toEqual([true])
  })
})
```

## Testing composables

Composables are plain functions — test them by calling them directly and asserting on the returned refs. No component mounting needed, which makes these tests the simplest to write.

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

One caveat: composables that use lifecycle hooks (`onMounted`, `onUnmounted`) need to run inside a component context. Wrap them in a minimal host component using `mount` with a `setup` function, or use the `withSetup` helper pattern documented in the Vue Testing Guide.

## Mocking

Use `vi.fn()` to create a mock callback you can pass as a prop and assert on. Use `vi.mock()` to replace an entire module — useful for mocking API calls or third-party services.

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UserProfile from '../UserProfile.vue'
import * as api from '../api/users'

// Replace the entire module — the mock is hoisted to the top of the file
vi.mock('../api/users')

describe('UserProfile', () => {
  it('displays the user name after loading', async () => {
    vi.mocked(api.getUser).mockResolvedValue({ id: 1, name: 'Ana García' })

    const wrapper = mount(UserProfile, { props: { userId: 1 } })

    await flushPromises() // wait for the async call to resolve

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

## What to test

Focus on behavior observable from the outside — what the user sees or what the component communicates to its parent.

| Test | Example |
| --- | --- |
| Rendering based on props | Component shows "empty state" when `items=[]` |
| User interactions | Click button → counter increments |
| Emitted events | Checkbox toggle → emits `update:modelValue` with new value |
| Computed behavior | Filtered list shows only matching items |
| Edge cases | Empty input, boundary values, null/undefined props |

What NOT to test: implementation details like the internal shape of reactive state (testing that `count` is stored as a `ref` vs a `reactive` property), framework behavior (`v-if` working correctly is Vue's responsibility, not yours), or CSS styling.

The guiding principle: if you can refactor the implementation without changing the user-facing behavior, the test should still pass.

---

See also: [How do you configure Vitest for a Vue project?](/q/vitest-vue-config) · [What are common anti-patterns in large Vue codebases?](/q/vue-anti-patterns) · [How do Vue DevTools help with debugging?](/q/vue-devtools)

## References

- [Testing](https://vuejs.org/guide/scaling-up/testing.html) - Vue.js docs
- [Vue Test Utils](https://test-utils.vuejs.org/) - Vue Test Utils docs
- [Vitest](https://vitest.dev/) - Vitest docs
