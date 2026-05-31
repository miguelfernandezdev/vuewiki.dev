---
order: 15
title: "How do you test Vue components with Vitest?"
difficulty: "intermediate"
---

```ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoList from '../TodoList.vue'

describe('TodoList', () => {
  it('renders empty state', () => {
    const wrapper = mount(TodoList)
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(wrapper.text()).toContain('No tasks')
  })

  it('adds a todo', async () => {
    const wrapper = mount(TodoList)
    await wrapper.find('input').setValue('New todo')
    await wrapper.find('button').trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('New todo')
  })

  it('emits event on completion', async () => {
    const wrapper = mount(TodoList, {
      props: { items: [{ id: 1, text: 'Test', done: false }] }
    })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(wrapper.emitted('complete')).toBeTruthy()
    expect(wrapper.emitted('complete')![0]).toEqual([1])
  })
})
```

**Testing composables:**
```ts
import { useCounter } from '../useCounter'

it('increments', () => {
  const { count, increment } = useCounter()
  expect(count.value).toBe(0)
  increment()
  expect(count.value).toBe(1)
})
```
