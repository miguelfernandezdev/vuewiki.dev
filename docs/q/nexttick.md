---
order: 63
title: "What is nextTick and when do you need it?"
difficulty: "intermediate"
tags: ["reactivity"]
---

[nextTick](https://vuejs.org/api/general.html#nexttick) is a utility that lets you wait until Vue has finished updating the DOM after a state change. Vue batches DOM updates asynchronously for performance, so if you read from the DOM right after changing reactive state, you'll see stale values.

## The problem

```ts
import { ref } from 'vue'

const message = ref('Hello')
const messageEl = ref<HTMLElement | null>(null)

function update() {
  message.value = 'Updated!'

  // DOM still shows "Hello" here
  console.log(messageEl.value?.textContent) // "Hello"
}
```

Vue changed `message` in memory, but the DOM hasn't re-rendered yet. The update happens in the next microtask.

## The fix

```ts
import { ref, nextTick } from 'vue'

const message = ref('Hello')
const messageEl = ref<HTMLElement | null>(null)

async function update() {
  message.value = 'Updated!'

  await nextTick()

  // DOM is now up to date
  console.log(messageEl.value?.textContent) // "Updated!"
}
```

`nextTick` also accepts a callback:

```ts
function update() {
  message.value = 'Updated!'

  nextTick(() => {
    console.log(messageEl.value?.textContent) // "Updated!"
  })
}
```

## Common use cases

**Scroll to new content after adding items:**

```ts
const items = ref<string[]>([])
const listEl = ref<HTMLElement | null>(null)

async function addItem(text: string) {
  items.value.push(text)

  await nextTick()
  listEl.value?.lastElementChild?.scrollIntoView({ behavior: 'smooth' })
}
```

**Focus an input after it appears:**

```ts
const showInput = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

async function openSearch() {
  showInput.value = true

  await nextTick()
  inputEl.value?.focus()
}
```

**Measure element dimensions after content changes:**

```ts
const content = ref('')
const containerEl = ref<HTMLElement | null>(null)

async function loadContent(text: string) {
  content.value = text

  await nextTick()
  const height = containerEl.value?.offsetHeight
  console.log('New height:', height)
}
```

## When you don't need nextTick

If you can solve the problem with reactive data instead of reading the DOM, you don't need `nextTick`. Watchers and computed properties already run after state changes, so they always see the latest values.

```ts
// No nextTick needed: computed reacts to state, not DOM
const isEmpty = computed(() => items.value.length === 0)

// No nextTick needed: watch fires after state settles
watch(items, (newItems) => {
  console.log('Items changed:', newItems.length)
})
```

Reserve `nextTick` for when you genuinely need to interact with the DOM (scrolling, focusing, measuring).

See also: [How does Vue batch DOM updates?](/q/dom-update-batching) · [When should you use the updated hook?](/q/perf-updated-hook)

## References

- [nextTick() — Vue docs](https://vuejs.org/api/general.html#nexttick)
- [watch() — Vue docs](https://vuejs.org/api/reactivity-core.html#watch)
- [Reactivity in Depth — Vue guide](https://vuejs.org/guide/extras/reactivity-in-depth.html)
