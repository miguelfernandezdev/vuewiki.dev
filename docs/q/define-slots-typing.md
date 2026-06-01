---
order: 107
title: "How do you type slots with defineSlots?"
difficulty: "intermediate"
tags: ["typescript", "components"]
---

`defineSlots` is a compiler macro (Vue 3.3+) that declares the type contract for your component's slots. Without it, scoped slot props are untyped and consumers get no autocomplete or type checking. With it, the parent template knows exactly what props each slot exposes.

## Basic usage

```vue
<!-- DataList.vue -->
<script setup lang="ts">
interface Item {
  id: number
  label: string
}

defineProps<{ items: Item[] }>()

defineSlots<{
  default(props: { item: Item; index: number }): any
  empty(): any
}>()
</script>

<template>
  <ul v-if="items.length">
    <li v-for="(item, index) in items" :key="item.id">
      <slot :item="item" :index="index" />
    </li>
  </ul>
  <slot v-else name="empty" />
</template>
```

Now when a parent uses this component, the slot props are typed:

```vue
<DataList :items="products">
  <!-- 'item' is typed as Item, 'index' as number -->
  <template #default="{ item, index }">
    <span>{{ index + 1 }}. {{ item.label }}</span>
  </template>

  <template #empty>
    <p>No items found.</p>
  </template>
</DataList>
```

## Syntax

Each slot is a function signature where the parameter is the slot props object and the return type is `any`:

```ts
defineSlots<{
  slotName(props: { /* scoped slot props */ }): any
}>()
```

For slots with no scoped props, use an empty parameter list:

```ts
defineSlots<{
  header(): any
  default(): any
  footer(): any
}>()
```

## Real-world example: Table component

```vue
<!-- DataTable.vue -->
<script setup lang="ts" generic="T extends { id: string | number }">
defineProps<{
  rows: T[]
  columns: Array<{ key: keyof T; label: string }>
}>()

defineSlots<{
  header(props: { columns: Array<{ key: keyof T; label: string }> }): any
  cell(props: { row: T; column: keyof T; value: T[keyof T] }): any
  empty(): any
}>()
</script>

<template>
  <table>
    <thead>
      <slot name="header" :columns="columns">
        <tr>
          <th v-for="col in columns" :key="String(col.key)">{{ col.label }}</th>
        </tr>
      </slot>
    </thead>
    <tbody>
      <template v-if="rows.length">
        <tr v-for="row in rows" :key="row.id">
          <td v-for="col in columns" :key="String(col.key)">
            <slot name="cell" :row="row" :column="col.key" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </template>
      <tr v-else>
        <td :colspan="columns.length">
          <slot name="empty">No data</slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

Combined with `generic`, the slot props are inferred from the actual data type passed to the component.

## Conditional slot rendering

Use `$slots` to check if a slot was provided and avoid rendering empty wrappers:

```vue
<script setup lang="ts">
defineSlots<{
  header(): any
  default(): any
  footer(): any
}>()
</script>

<template>
  <div class="card">
    <header v-if="$slots.header" class="card-header">
      <slot name="header" />
    </header>
    <div class="card-body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>
```

## Before defineSlots (Vue < 3.3)

You had to use `SlotsType` on `defineComponent`:

```ts
import { defineComponent, type SlotsType } from 'vue'

export default defineComponent({
  slots: Object as SlotsType<{
    default: { item: Item; index: number }
    empty: {}
  }>,
  setup(props, { slots }) {
    // slots.default is typed
  }
})
```

`defineSlots` replaced this with a cleaner single-line macro inside `<script setup>`.
