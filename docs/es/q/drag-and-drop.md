---
order: 125
title: "¿Cómo implementarías drag and drop en Vue?"
difficulty: "intermediate"
tags: ["components"]
---

Hay tres enfoques: la API nativa de HTML Drag and Drop para casos simples, la librería `vue-draggable-plus` (o `vuedraggable`) para listas ordenables, y los pointer events para comportamiento completamente personalizado. La mayoría de casos reales (listas reordenables, tableros kanban) se resuelven mejor con una librería.

## API nativa de HTML Drag and Drop

Para escenarios simples de arrastrar desde A hasta B:

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
    items.value = items.value.filter(i => i !== item)
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

    <div
      class="column drop-zone"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <h3>Dropped</h3>
      <div v-for="item in dropped" :key="item" class="drag-item">
        {{ item }}
      </div>
    </div>
  </div>
</template>
```

La API nativa funciona, pero tiene peculiaridades: sin soporte táctil por defecto, retroalimentación visual limitada y gestión compleja de índices para listas ordenables.

## vue-draggable-plus (recomendado para listas ordenables)

Es un wrapper de Vue 3 sobre SortableJS. Gestiona la reordenación, el arrastre entre listas, las animaciones y los dispositivos táctiles:

```bash
npm install vue-draggable-plus
```

### Lista ordenable

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

El orden del array se actualiza automáticamente cuando se arrastran elementos. No es necesario hacer intercambios manuales de índices.

### Tablero kanban (arrastre entre listas)

```vue
<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'

const columns = ref({
  todo: [
    { id: 1, title: 'Research' },
    { id: 2, title: 'Design' }
  ],
  doing: [
    { id: 3, title: 'Implement API' }
  ],
  done: [
    { id: 4, title: 'Write docs' }
  ]
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

La prop `group="kanban"` permite mover elementos entre listas. El array de cada lista se actualiza de forma independiente.

### Gestionar el evento de reordenación

```vue
<VueDraggable
  v-model="tasks"
  @update="onReorder"
>
  ...
</VueDraggable>

<script setup>
function onReorder() {
  // el array tasks ya está actualizado por v-model
  // persiste el nuevo orden en el servidor
  $fetch('/api/tasks/reorder', {
    method: 'POST',
    body: tasks.value.map((t, i) => ({ id: t.id, order: i }))
  })
}
</script>
```

## Arrastre personalizado con pointer events

Para comportamiento completamente personalizado (handles de redimensión, elementos en posición libre, interacciones tipo canvas):

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

Los pointer events funcionan tanto en ratón como en dispositivos táctiles sin gestión adicional.

## Cómo elegir el enfoque

| Necesidad | Enfoque |
|---|---|
| Lista reordenable o tablero kanban | vue-draggable-plus |
| Arrastrar elemento de la zona A a la zona B | API nativa o vue-draggable-plus |
| Arrastre en posición libre (tipo canvas) | Pointer events |
| Handles de redimensión, restricciones personalizadas | Pointer events |
| Soltar archivos desde el escritorio | API nativa (`@drop` + `dataTransfer.files`) |
