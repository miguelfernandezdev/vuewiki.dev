---
order: 169
title: "¿Cómo se gestiona la accesibilidad en Vue?"
difficulty: "intermediate"
tags: ["accessibility", "components", "teleport"]
summary: "Usa HTML semántico, añade ARIA solo cuando la semántica nativa no baste, gestiona el foco en cambios de ruta y prueba con lectores de pantalla."
---

Empieza con elementos HTML semánticos en lugar de divs. Añade atributos ARIA solo cuando la semántica nativa no sea suficiente. Gestiona el foco explícitamente en los cambios de ruta y en el contenido dinámico. Vue no añade barreras a la accesibilidad, pero tampoco añade restricciones. La responsabilidad es tuya.

## Primero, HTML semántico

La decisión de accesibilidad con mayor impacto no tiene nada que ver con Vue:

```vue
<!-- MAL: sopa de divs con parches ARIA -->
<template>
  <div role="navigation">
    <div role="list">
      <div role="listitem" @click="navigate">Home</div>
    </div>
  </div>
</template>

<!-- BIEN: elementos nativos que funcionan sin configuración extra -->
<template>
  <nav aria-label="Main navigation">
    <ul>
      <li><RouterLink to="/">Home</RouterLink></li>
    </ul>
  </nav>
</template>
```

Los elementos nativos ofrecen soporte de teclado, anuncios de lectores de pantalla y comportamiento de foco de forma gratuita. ARIA no puede añadir funcionalidad, solo puede describir lo que ya existe.

## Atributos ARIA en templates Vue

Enlaza atributos ARIA dinámicamente cuando el estado controla la interfaz:

```vue
<script setup>
const isExpanded = ref(false)
const panelId = useId()
</script>

<template>
  <button
    :aria-expanded="isExpanded"
    :aria-controls="panelId"
    @click="isExpanded = !isExpanded"
  >
    Details
  </button>
  <div
    v-show="isExpanded"
    :id="panelId"
    role="region"
  >
    Panel content
  </div>
</template>
```

`useId()` (Vue 3.5+) genera un ID único para cada instancia del componente, evitando IDs duplicados cuando el componente se reutiliza.

## Gestión del foco

Las SPA rompen el comportamiento por defecto del navegador, donde la navegación entre páginas mueve el foco al inicio de la nueva página. Hay que gestionarlo manualmente:

```ts
// router/index.ts
router.afterEach((to, from) => {
  if (to.path !== from.path) {
    nextTick(() => {
      const heading = document.querySelector('h1')
      if (heading instanceof HTMLElement) {
        heading.setAttribute('tabindex', '-1')
        heading.focus()
      }
    })
  }
})
```

Para modales y diálogos, atrapa el foco dentro del elemento y devuélvelo cuando el modal se cierre:

```vue
<script setup>
const triggerRef = ref<HTMLElement>()
const dialogRef = ref<HTMLElement>()

function openModal() {
  isOpen.value = true
  nextTick(() => dialogRef.value?.focus())
}

function closeModal() {
  isOpen.value = false
  triggerRef.value?.focus()
}
</script>

<template>
  <button ref="triggerRef" @click="openModal">Open</button>

  <dialog
    v-if="isOpen"
    ref="dialogRef"
    tabindex="-1"
    @keydown.escape="closeModal"
  >
    <h2>Dialog title</h2>
    <p>Content here</p>
    <button @click="closeModal">Close</button>
  </dialog>
</template>
```

Usar el elemento nativo `<dialog>` gestiona el atrapamiento de foco automáticamente cuando se abre con `showModal()`.

## Regiones en vivo para contenido dinámico

Cuando el contenido se actualiza sin recargar la página, los lectores de pantalla no lo anuncian a menos que uses una región en vivo:

```vue
<script setup>
const notification = ref('')

async function save() {
  await submitForm()
  notification.value = 'Changes saved successfully'
}
</script>

<template>
  <form @submit.prevent="save">
    <!-- campos del formulario -->
    <button type="submit">Save</button>
  </form>

  <div aria-live="polite" role="status" class="sr-only">
    {{ notification }}
  </div>
</template>
```

`aria-live="polite"` espera a que el lector de pantalla termine su anuncio actual. Usa `aria-live="assertive"` solo para mensajes urgentes como errores.

## Visualmente oculto pero accesible

Contenido que debe estar disponible para lectores de pantalla pero no visible en pantalla:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

```vue
<template>
  <button @click="removeItem(item)">
    <TrashIcon />
    <span class="sr-only">Remove {{ item.name }}</span>
  </button>
</template>
```

Sin el texto visualmente oculto, un lector de pantalla solo anunciaría "botón" sin indicar qué hace.

## Lista de comprobación

| Área | Qué hacer |
|---|---|
| HTML semántico | Usa `nav`, `main`, `button`, `ul`, `dialog` en lugar de divs |
| ARIA | Solo añade cuando la semántica nativa no sea suficiente. Enlaza dinámicamente con `:aria-*` |
| Foco | Gestiona en cambios de ruta, modales y contenido dinámico |
| Regiones en vivo | Anuncia cambios de contenido dinámico con `aria-live` |
| Teclado | Asegura que todos los elementos interactivos son alcanzables y operables con el teclado |
| Contraste de color | Mínimo 4.5:1 para texto, 3:1 para texto grande (WCAG AA) |
| Etiquetas | Cada campo de formulario necesita un `<label>` visible o `aria-label` |

Ver también: [¿Cómo manejar formularios complejos?](/es/q/complex-forms) · [¿Cómo funciona Teleport?](/es/q/teleport-fragments-suspense) · [¿Cómo funcionan las template refs?](/es/q/template-refs)

## Referencias

- [Accessibility](https://vuejs.org/guide/best-practices/accessibility.html) - Vue.js docs
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/) - W3C
- [Vue A11y](https://vue-a11y.com/) - Vue accessibility community resources
