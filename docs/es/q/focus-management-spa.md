---
order: 170
title: "¿Cómo gestionas el foco en SPAs con Vue?"
difficulty: "advanced"
tags: ["accessibility", "vue-router", "watchers", "suspense"]
---

En un sitio web tradicional, el navegador mueve el foco al principio de la página en cada navegación. Las SPAs rompen esto porque la página nunca se recarga. Después de un cambio de ruta del lado del cliente, el foco permanece donde estaba, lo que significa que un usuario de lector de pantalla no tiene forma de saber que la página cambió. Necesitas mover el foco manualmente en los cambios de ruta, atraparlo dentro de los modales y devolverlo cuando el contenido dinámico se cierra.

## Foco en los cambios de ruta

Mueve el foco al encabezado principal después de cada navegación:

```ts
// router/index.ts
router.afterEach((to, from) => {
  if (to.path === from.path) return

  nextTick(() => {
    const heading = document.querySelector('h1')
    if (heading instanceof HTMLElement) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: false })
    }
  })
})
```

`tabindex="-1"` hace que el encabezado sea enfocable programáticamente sin añadirlo al orden de tabulación. `nextTick` garantiza que la nueva página se haya renderizado antes de intentar enfocar.

Una alternativa es un anunciador de ruta que lee el título de la página sin mover el foco visible:

```vue
<!-- App.vue -->
<script setup>
const route = useRoute()
const announcement = ref('')

watch(() => route.path, () => {
  nextTick(() => {
    announcement.value = document.title
  })
})
</script>

<template>
  <div aria-live="assertive" aria-atomic="true" class="sr-only">
    {{ announcement }}
  </div>
  <RouterView />
</template>
```

Esto anuncia el nuevo título de la página a los lectores de pantalla sin interrumpir el foco visual, lo que puede ser mejor para los usuarios con teclado que no quieren que su posición de scroll cambie.

## Trampa de foco en modales

Cuando se abre un modal, el foco debe permanecer dentro hasta que se cierre. El elemento nativo `<dialog>` con `showModal()` gestiona esto automáticamente:

```vue
<script setup>
const dialogRef = ref<HTMLDialogElement>()
const triggerRef = ref<HTMLElement>()

function open() {
  dialogRef.value?.showModal()
}

function close() {
  dialogRef.value?.close()
  triggerRef.value?.focus()
}
</script>

<template>
  <button ref="triggerRef" @click="open">Settings</button>

  <dialog ref="dialogRef" @close="triggerRef?.focus()">
    <h2>Settings</h2>
    <label>
      Name
      <input type="text" />
    </label>
    <button @click="close">Done</button>
  </dialog>
</template>
```

`showModal()` hace tres cosas que el navegador gestiona por ti: mueve el foco al primer elemento enfocable del interior, atrapa el ciclo de tabulación dentro del diálogo y restaura el foco cuando el diálogo se cierra con la tecla Escape.

Si necesitas un modal personalizado sin `<dialog>`, tienes que implementar la trampa tú mismo:

```ts
// composables/useFocusTrap.ts
export function useFocusTrap(containerRef: Ref<HTMLElement | undefined>) {
  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const container = containerRef.value
    if (!container) return

    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}
```

## Foco tras contenido dinámico

Cuando el contenido aparece o desaparece dinámicamente, mueve el foco a donde el usuario necesita estar:

```vue
<script setup>
const items = ref([...])
const listRef = ref<HTMLElement>()

async function deleteItem(id: number) {
  const index = items.value.findIndex(i => i.id === id)
  items.value = items.value.filter(i => i.id !== id)

  await nextTick()

  if (items.value.length === 0) {
    listRef.value?.focus()
  }
}
</script>

<template>
  <ul ref="listRef" tabindex="-1" aria-label="Items">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
      <button @click="deleteItem(item.id)">Delete</button>
    </li>
  </ul>
  <p v-if="items.length === 0">No items remaining.</p>
</template>
```

Sin esto, eliminar el elemento enfocado deja el foco del usuario en el limbo, lo que desorienta.

## Skip links

Permite a los usuarios de teclado saltar la navegación repetitiva:

```vue
<!-- App.vue -->
<template>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <TheNavbar />
  <main id="main-content" tabindex="-1">
    <RouterView />
  </main>
</template>

<style>
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: white;
}
.skip-link:focus {
  top: 0;
}
</style>
```

El enlace está oculto hasta que recibe el foco, momento en que salta a la parte superior de la pantalla.

## Resumen

| Escenario | Acción |
|---|---|
| Cambio de ruta | Mover el foco a `h1` o anunciar el título de la página mediante live region |
| Modal se abre | Usar `<dialog>` con `showModal()`, o atrapar el foco manualmente |
| Modal se cierra | Devolver el foco al elemento que lo activó |
| Elemento eliminado | Mover el foco al siguiente elemento o al contenedor de la lista |
| Contenido cargado | Enfocar el nuevo contenido o anunciarlo con `aria-live` |
| Saltar navegación | Proporcionar un skip link como primer elemento enfocable |

Ver también: [¿Cómo manejar la accesibilidad en Vue?](/es/q/accessibility-in-vue) · [¿Cómo funciona Vue Router?](/es/q/vue-router-navigation-guards) · [¿Qué son teleport, fragments y Suspense?](/es/q/teleport-fragments-suspense)

## Referencias

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - W3C
- [Managing Focus in Single Page Applications](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Focus_management) - MDN
- [The dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) - MDN
