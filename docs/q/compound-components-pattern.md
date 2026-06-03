---
order: 135
title: 'What is the compound components pattern in Vue?'
difficulty: 'advanced'
tags: ['architecture', 'components', 'vite', 'provide-inject']
summary: 'Components that share implicit state via provide/inject. The parent manages state, children consume it. Classic examples: tabs, accordions, selects.'
---

Compound components are a set of components that work together and share implicit state through provide/inject. The parent manages the state, the children consume it. The consumer arranges the children freely without wiring props or events between them manually.

The classic example is an accordion, tabs, or select component where the parent tracks which item is active and the children register themselves.

## Example: Tabs

```vue
<!-- components/Tabs.vue -->
<script setup lang="ts">
const activeTab = ref(0)
const tabs = ref<string[]>([])

function register(label: string) {
  tabs.value.push(label)
  return tabs.value.length - 1
}

function select(index: number) {
  activeTab.value = index
}

provide('tabs', {
  activeTab: readonly(activeTab),
  register,
  select
})
</script>

<template>
  <div class="tabs">
    <div class="tabs-header">
      <button
        v-for="(label, i) in tabs"
        :key="i"
        :class="{ active: activeTab === i }"
        @click="select(i)"
      >
        {{ label }}
      </button>
    </div>
    <div class="tabs-body">
      <slot />
    </div>
  </div>
</template>
```

<PlaygroundLink code="<!-- components/Tabs.vue -->
<script setup lang=&quot;ts&quot;>
const activeTab = ref(0)
const tabs = ref<string[]>([])
&#10;function register(label: string) {
  tabs.value.push(label)
  return tabs.value.length - 1
}
&#10;function select(index: number) {
  activeTab.value = index
}
&#10;provide('tabs', {
  activeTab: readonly(activeTab),
  register,
  select
})
</script>
&#10;<template>
  <div class=&quot;tabs&quot;>
    <div class=&quot;tabs-header&quot;>
      <button
        v-for=&quot;(label, i) in tabs&quot;
        :key=&quot;i&quot;
        :class=&quot;{ active: activeTab === i }&quot;
        @click=&quot;select(i)&quot;
      >
        {{ label }}
      </button>
    </div>
    <div class=&quot;tabs-body&quot;>
      <slot />
    </div>
  </div>
</template>" />

    </div>
  </div>
</template>" />

```vue
<!-- components/Tab.vue -->
<script setup lang="ts">
const props = defineProps<{ label: string }>()

const { activeTab, register } = inject('tabs')!
const index = register(props.label)

const isActive = computed(() => activeTab.value === index)
</script>

<template>
  <div v-show="isActive">
    <slot />
  </div>
</template>
```

<PlaygroundLink code="<!-- components/Tab.vue -->
<script setup lang=&quot;ts&quot;>
const props = defineProps<{ label: string }>()
&#10;const { activeTab, register } = inject('tabs')!
const index = register(props.label)
&#10;const isActive = computed(() => activeTab.value === index)
</script>
&#10;<template>
  <div v-show=&quot;isActive&quot;>
    <slot />
  </div>
</template>" />

  </div>
</template>" />

### Usage

```vue
<template>
  <Tabs>
    <Tab label="Profile">
      <UserProfile />
    </Tab>
    <Tab label="Settings">
      <UserSettings />
    </Tab>
    <Tab label="Billing">
      <BillingInfo />
    </Tab>
  </Tabs>
</template>
```

<PlaygroundLink code="<template>
  <Tabs>
    <Tab label=&quot;Profile&quot;>
      <UserProfile />
    </Tab>
    <Tab label=&quot;Settings&quot;>
      <UserSettings />
    </Tab>
    <Tab label=&quot;Billing&quot;>
      <BillingInfo />
    </Tab>
  </Tabs>
</template>" />

    </Tab>
    <Tab label=&quot;Settings&quot;>
      <UserSettings />
    </Tab>
    <Tab label=&quot;Billing&quot;>
      <BillingInfo />
    </Tab>
  </Tabs>
</template>" />

The consumer doesn't manage active state, doesn't wire click handlers, doesn't pass indices. The `Tabs` and `Tab` components coordinate internally through provide/inject.

## Type-safe provide/inject

Use an `InjectionKey` to avoid string keys and get full typing:

```ts
// composables/useTabs.ts
import type { InjectionKey, Ref } from 'vue'

interface TabsContext {
  activeTab: Readonly<Ref<number>>
  register: (label: string) => number
  select: (index: number) => void
}

export const TABS_KEY: InjectionKey<TabsContext> = Symbol('tabs')
```

```vue
<!-- Tabs.vue -->
<script setup>
import { TABS_KEY } from '@/composables/useTabs'
provide(TABS_KEY, { activeTab: readonly(activeTab), register, select })
</script>
```

<PlaygroundLink code="<!-- Tabs.vue -->
<script setup>
import { TABS_KEY } from '@/composables/useTabs'
provide(TABS_KEY, { activeTab: readonly(activeTab), register, select })
</script>" />

```vue
<!-- Tab.vue -->
<script setup>
import { TABS_KEY } from '@/composables/useTabs'
const ctx = inject(TABS_KEY)
if (!ctx) throw new Error('Tab must be used inside Tabs')
</script>
```

<PlaygroundLink code="<!-- Tab.vue -->
<script setup>
import { TABS_KEY } from '@/composables/useTabs'
const ctx = inject(TABS_KEY)
if (!ctx) throw new Error('Tab must be used inside Tabs')
</script>" />

## Example: Accordion

```vue
<!-- components/Accordion.vue -->
<script setup lang="ts">
const openItems = ref<Set<string>>(new Set())

function toggle(id: string) {
  if (openItems.value.has(id)) {
    openItems.value.delete(id)
  } else {
    openItems.value.add(id)
  }
}

function isOpen(id: string) {
  return openItems.value.has(id)
}

provide('accordion', { toggle, isOpen })
</script>

<template>
  <div class="accordion">
    <slot />
  </div>
</template>
```

<PlaygroundLink code="<!-- components/Accordion.vue -->
<script setup lang=&quot;ts&quot;>
const openItems = ref<Set<string>>(new Set())
&#10;function toggle(id: string) {
  if (openItems.value.has(id)) {
    openItems.value.delete(id)
  } else {
    openItems.value.add(id)
  }
}
&#10;function isOpen(id: string) {
  return openItems.value.has(id)
}
&#10;provide('accordion', { toggle, isOpen })
</script>
&#10;<template>
  <div class=&quot;accordion&quot;>
    <slot />
  </div>
</template>" />

  </div>
</template>" />

```vue
<!-- components/AccordionItem.vue -->
<script setup lang="ts">
const props = defineProps<{ id: string; title: string }>()
const { toggle, isOpen } = inject('accordion')!
</script>

<template>
  <div class="accordion-item">
    <button @click="toggle(id)">
      {{ title }}
      <span>{{ isOpen(id) ? '−' : '+' }}</span>
    </button>
    <div v-show="isOpen(id)">
      <slot />
    </div>
  </div>
</template>
```

<PlaygroundLink code="<!-- components/AccordionItem.vue -->
<script setup lang=&quot;ts&quot;>
const props = defineProps<{ id: string; title: string }>()
const { toggle, isOpen } = inject('accordion')!
</script>
&#10;<template>
  <div class=&quot;accordion-item&quot;>
    <button @click=&quot;toggle(id)&quot;>
      {{ title }}
      <span>{{ isOpen(id) ? '−' : '+' }}</span>
    </button>
    <div v-show=&quot;isOpen(id)&quot;>
      <slot />
    </div>
  </div>
</template>" />

    </div>
  </div>
</template>" />

```vue
<template>
  <Accordion>
    <AccordionItem id="faq-1" title="What is Vue?">
      <p>A progressive JavaScript framework.</p>
    </AccordionItem>
    <AccordionItem id="faq-2" title="What is Vite?">
      <p>A build tool for modern web projects.</p>
    </AccordionItem>
  </Accordion>
</template>
```

<PlaygroundLink code="<template>
  <Accordion>
    <AccordionItem id=&quot;faq-1&quot; title=&quot;What is Vue?&quot;>
      <p>A progressive JavaScript framework.</p>
    </AccordionItem>
    <AccordionItem id=&quot;faq-2&quot; title=&quot;What is Vite?&quot;>
      <p>A build tool for modern web projects.</p>
    </AccordionItem>
  </Accordion>
</template>" />

## When to use compound components

| Situation                                                                | Use compound components?       |
| ------------------------------------------------------------------------ | ------------------------------ |
| Group of UI elements that share state (tabs, accordion, select, stepper) | Yes                            |
| Components always used together in a parent-child relationship           | Yes                            |
| Independent components that occasionally interact                        | No, use props/emits or a store |
| Simple parent-child with 1-2 props                                       | No, over-engineering           |

## Compound components vs props-only approach

The props-only approach passes all data to a single component:

```vue
<!-- Props-only: less flexible, simpler for small cases -->
<Tabs
  :items="[
    { label: 'Profile', content: '...' },
    { label: 'Settings', content: '...' }
  ]"
/>

<!-- Compound: more flexible, consumer controls layout -->
<Tabs>
  <Tab label="Profile"><UserProfile /></Tab>
  <Tab label="Settings"><UserSettings /></Tab>
</Tabs>
```

<PlaygroundLink code="<!-- Props-only: less flexible, simpler for small cases -->
<Tabs
  :items=&quot;[
    { label: 'Profile', content: '...' },
    { label: 'Settings', content: '...' }
  ]&quot;
/>
&#10;<!-- Compound: more flexible, consumer controls layout -->
<Tabs>
  <Tab label=&quot;Profile&quot;><UserProfile /></Tab>
  <Tab label=&quot;Settings&quot;><UserSettings /></Tab>
</Tabs>" />

&#10;<!-- Compound: more flexible, consumer controls layout -->
<Tabs>
  <Tab label=&quot;Profile&quot;><UserProfile /></Tab>
  <Tab label=&quot;Settings&quot;><UserSettings /></Tab>
</Tabs>" />

Compound components win when the children have complex content (components, slots, conditional logic) that doesn't fit cleanly in a data array.

See also: [How does provide/inject work?](/q/provide-inject) · [What are slots?](/q/slots) · [What is the container-presentational pattern?](/q/container-presentational-pattern)

## References

- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
- [Slots](https://vuejs.org/guide/components/slots.html) - Vue.js docs
