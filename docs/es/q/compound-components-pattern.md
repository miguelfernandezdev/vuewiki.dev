---
order: 135
title: '¿Qué es el patrón de componentes compuestos en Vue?'
difficulty: 'advanced'
tags: ['architecture', 'components', 'vite', 'provide-inject']
summary: 'Componentes que comparten estado implícito via provide/inject. El padre gestiona el estado, los hijos lo consumen. Ejemplos: tabs, acordeones, selects.'
---

Los componentes compuestos son un conjunto de componentes que trabajan juntos y comparten estado implícito a través de provide/inject. El padre gestiona el estado, los hijos lo consumen. El consumidor organiza los hijos libremente sin necesidad de conectar props o eventos entre ellos manualmente.

El ejemplo clásico es un accordion, un sistema de pestañas o un componente select donde el padre rastrea qué elemento está activo y los hijos se registran en él.

<img src="/diagrams/es/compound-components-pattern.svg" alt="Diagrama de árbol mostrando padre proveyendo contexto e hijos consumiendo via inject" style="max-width: 100%;" />

## Ejemplo: Pestañas

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

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
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

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
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

### Uso

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

El consumidor no gestiona el estado activo, no conecta manejadores de click, no pasa índices. Los componentes `Tabs` y `Tab` se coordinan internamente a través de provide/inject.

## provide/inject con tipos seguros

Usa una `InjectionKey` para evitar claves de cadena y obtener tipado completo:

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

<PlaygroundLink code="<script setup>
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

<PlaygroundLink code="<script setup>
import { TABS_KEY } from '@/composables/useTabs'
const ctx = inject(TABS_KEY)
if (!ctx) throw new Error('Tab must be used inside Tabs')
</script>" />

## Ejemplo: Accordion

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

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
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

<PlaygroundLink code="<script setup lang=&quot;ts&quot;>
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

## Cuándo usar componentes compuestos

| Situación                                                                            | ¿Usar componentes compuestos?  |
| ------------------------------------------------------------------------------------ | ------------------------------ |
| Grupo de elementos de UI que comparten estado (pestañas, accordion, select, stepper) | Sí                             |
| Componentes que siempre se usan juntos en una relación padre-hijo                    | Sí                             |
| Componentes independientes que ocasionalmente interactúan                            | No, usa props/emits o un store |
| Padre-hijo simple con 1-2 props                                                      | No, sería sobreingeniería      |

## Componentes compuestos frente al enfoque solo con props

El enfoque solo con props pasa todos los datos a un único componente:

```vue
<!-- Solo props: menos flexible, más simple para casos pequeños -->
<Tabs
  :items="[
    { label: 'Profile', content: '...' },
    { label: 'Settings', content: '...' }
  ]"
/>

<!-- Compuesto: más flexible, el consumidor controla el layout -->
<Tabs>
  <Tab label="Profile"><UserProfile /></Tab>
  <Tab label="Settings"><UserSettings /></Tab>
</Tabs>
```

<PlaygroundLink code="<Tabs
  :items=&quot;[
    { label: 'Profile', content: '...' },
    { label: 'Settings', content: '...' }
  ]&quot;
/>
&#10;<Tabs>
  <Tab label=&quot;Profile&quot;><UserProfile /></Tab>
  <Tab label=&quot;Settings&quot;><UserSettings /></Tab>
</Tabs>" />

Los componentes compuestos ganan cuando los hijos tienen contenido complejo (componentes, slots, lógica condicional) que no encaja bien en un array de datos.

Ver también: [¿Cómo funciona provide/inject?](/es/q/provide-inject) · [¿Qué son los slots?](/es/q/slots) · [¿Qué es el patrón container-presentational?](/es/q/container-presentational-pattern)

## Referencias

- [Provide / Inject](https://vuejs.org/guide/components/provide-inject.html) - Vue.js docs
- [Slots](https://vuejs.org/guide/components/slots.html) - Vue.js docs
