---
order: 107
title: "¿Cómo tipas los slots con defineSlots?"
difficulty: "intermediate"
tags: ["typescript", "components", "slots"]
summary: "defineSlots (Vue 3.3+) declara el contrato de tipos de los slots, dando autocompletado y comprobación de tipos en scoped slots."
---

`defineSlots` es una macro del compilador (Vue 3.3+) que declara el contrato de tipos para los slots de tu componente. Sin ella, las props de los scoped slots no tienen tipo y los consumidores no obtienen autocompletado ni comprobación de tipos. Con ella, el template del padre sabe exactamente qué props expone cada slot.

## Uso básico

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

Ahora cuando un padre usa este componente, las props del slot tienen tipo:

```vue
<DataList :items="products">
  <!-- 'item' tiene tipo Item, 'index' tiene tipo number -->
  <template #default="{ item, index }">
    <span>{{ index + 1 }}. {{ item.label }}</span>
  </template>

  <template #empty>
    <p>No items found.</p>
  </template>
</DataList>
```

## Sintaxis

Cada slot es una firma de función donde el parámetro es el objeto de props del slot y el tipo de retorno es `any`:

```ts
defineSlots<{
  slotName(props: { /* props del scoped slot */ }): any
}>()
```

Para slots sin props de scope, usa una lista de parámetros vacía:

```ts
defineSlots<{
  header(): any
  default(): any
  footer(): any
}>()
```

## Ejemplo real: componente Table

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

Combinado con `generic`, las props del slot se infieren a partir del tipo de datos real pasado al componente.

## Renderizado condicional de slots

Usa `$slots` para comprobar si se proporcionó un slot y evitar renderizar wrappers vacíos:

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

## Antes de defineSlots (Vue < 3.3)

Había que usar `SlotsType` en `defineComponent`:

```ts
import { defineComponent, type SlotsType } from 'vue'

export default defineComponent({
  slots: Object as SlotsType<{
    default: { item: Item; index: number }
    empty: {}
  }>,
  setup(props, { slots }) {
    // slots.default tiene tipo
  }
})
```

`defineSlots` reemplazó esto con una macro de una sola línea dentro de `<script setup>`.

Ver también: [¿Qué son los slots?](/es/q/slots) · [¿Cómo funcionan los componentes genéricos?](/es/q/generic-components)

## Referencias

- [defineSlots()](https://vuejs.org/api/sfc-script-setup.html#defineslots) - Vue.js docs
- [Slots](https://vuejs.org/guide/components/slots.html) - Vue.js docs
