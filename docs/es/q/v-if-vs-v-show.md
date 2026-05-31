---
order: 6
title: "¿Cuál es la diferencia entre v-if y v-show?"
difficulty: "beginner"
tags: ["directives"]
---

- **`v-if`** — Monta y desmonta el elemento del DOM. Más costoso de alternar, pero no renderiza nada si la condición inicial es `false`.
- **`v-show`** — Siempre monta el elemento, solo alterna `display: none`. Más eficiente para toggles frecuentes.

**Regla:** `v-if` para condiciones que cambian raramente. `v-show` para toggles frecuentes (tabs, dropdowns).
