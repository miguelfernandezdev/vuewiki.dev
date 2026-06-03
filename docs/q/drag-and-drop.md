---
order: 42
title: 'How would you implement drag and drop in Vue?'
difficulty: 'intermediate'
tags: ['components', 'v-model']
summary: 'Use vue-draggable-plus for sortable lists, the native HTML Drag and Drop API for simple cases, or pointer events for custom drag behavior.'
---

There are three approaches: the native HTML Drag and Drop API for simple cases, the `vue-draggable-plus` (or `vuedraggable`) library for sortable lists, and pointer events for fully custom behavior. Most real-world cases (reorderable lists, kanban boards) are best served by a library.

## Native HTML Drag and Drop API

For simple drag-from-A-to-B scenarios:

```vue
<script setup lang="ts">
const items = ref(['Item 1', 'Item 2', 'Item 3'])
const dropped = ref<string[]>([])

function onDragStart(event: DragEvent, item: string) {
  event.dataTransfer!.setData('text/plain', item)
  event.dataTransfer!.effectAllowed = 'move'
}

function onDrop(event: DragEvent) {
  const item = event.dataTransfer!.getData('text/plain')
  if (!dropped.value.includes(item)) {
    dropped.value.push(item)
    items.value = items.value.filter((i) => i !== item)
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}
</script>

<template>
  <div class="columns">
    <div class="column">
      <h3>Available</h3>
      <div
        v-for="item in items"
        :key="item"
        draggable="true"
        @dragstart="onDragStart($event, item)"
        class="drag-item"
      >
        {{ item }}
      </div>
    </div>

    <div class="column drop-zone" @drop="onDrop" @dragover="onDragOver">
      <h3>Dropped</h3>
      <div v-for="item in dropped" :key="item" class="drag-item">
        {{ item }}
      </div>
    </div>
  </div>
</template>
```

The native API works but has quirks: no touch support by default, limited visual feedback, and complex index management for sortable lists.

## vue-draggable-plus (recommended for sortable lists)

This is a Vue 3 wrapper around SortableJS. It handles reordering, cross-list dragging, animations, and touch devices:

```bash
npm install vue-draggable-plus
```

### Sortable list

```vue
<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

const tasks = ref([
  { id: 1, name: 'Design mockups' },
  { id: 2, name: 'Write tests' },
  { id: 3, name: 'Deploy to staging' }
])
</script>

<template>
  <VueDraggable v-model="tasks" animation="150" ghostClass="ghost">
    <div v-for="task in tasks" :key="task.id" class="task-item">
      {{ task.name }}
    </div>
  </VueDraggable>
</template>

<style>
.ghost {
  opacity: 0.4;
}
</style>
```

The array order updates automatically when items are dragged. No manual index swapping needed.

### Kanban board (cross-list dragging)

```vue
<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

const columns = ref({
  todo: [
    { id: 1, title: 'Research' },
    { id: 2, title: 'Design' }
  ],
  doing: [{ id: 3, title: 'Implement API' }],
  done: [{ id: 4, title: 'Write docs' }]
})
</script>

<template>
  <div class="kanban">
    <div v-for="(tasks, status) in columns" :key="status" class="kanban-column">
      <h3>{{ status }}</h3>
      <VueDraggable
        v-model="columns[status]"
        group="kanban"
        animation="150"
        ghostClass="ghost"
      >
        <div v-for="task in tasks" :key="task.id" class="kanban-card">
          {{ task.title }}
        </div>
      </VueDraggable>
    </div>
  </div>
</template>
```

The `group="kanban"` prop lets items move between lists. Each list's array updates independently.

### Handling the reorder event

```vue
<VueDraggable v-model="tasks" @update="onReorder">
  ...
</VueDraggable>

<script setup>
function onReorder() {
  // tasks array is already updated by v-model
  // persist the new order to the server
  $fetch('/api/tasks/reorder', {
    method: 'POST',
    body: tasks.value.map((t, i) => ({ id: t.id, order: i }))
  })
}
</script>
```

## Custom drag with pointer events

For fully custom behavior (resize handles, free-position elements, canvas-like interactions):

```vue
<script setup lang="ts">
const position = ref({ x: 100, y: 100 })
const isDragging = ref(false)
const offset = ref({ x: 0, y: 0 })

function onPointerDown(event: PointerEvent) {
  isDragging.value = true
  offset.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y
  }
  ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging.value) return
  position.value = {
    x: event.clientX - offset.value.x,
    y: event.clientY - offset.value.y
  }
}

function onPointerUp() {
  isDragging.value = false
}
</script>

<template>
  <div
    class="draggable-box"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    Drag me
  </div>
</template>
```

Pointer events work on both mouse and touch devices without extra handling.

## Choosing an approach

| Need                                    | Approach                                    |
| --------------------------------------- | ------------------------------------------- |
| Reorderable list or kanban board        | vue-draggable-plus                          |
| Drag item from zone A to zone B         | Native API or vue-draggable-plus            |
| Free-position dragging (like a canvas)  | Pointer events                              |
| Resize handles, custom drag constraints | Pointer events                              |
| File drop from desktop                  | Native API (`@drop` + `dataTransfer.files`) |

See also: [How do template refs work?](/q/template-refs) · [How does event handling work?](/q/event-handling)

## References

- [Template Refs](https://vuejs.org/guide/essentials/template-refs.html) - Vue.js docs
- [Event Handling](https://vuejs.org/guide/essentials/event-handling.html) - Vue.js docs
