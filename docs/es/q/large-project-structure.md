---
order: 29
title: "¿Cómo estructurarías un proyecto Vue grande?"
difficulty: "advanced"
tags: ["architecture", "pinia", "vite"]
---

Vue no impone ninguna estructura de proyecto en particular. Un scaffold nuevo con Vite te da una carpeta `src/` y el resto queda en tus manos. Eso funciona bien con unas pocas decenas de archivos, pero a medida que el código crece, la ausencia de convenciones se convierte en un problema real: nadie puede predecir dónde vive una determinada pieza de lógica, las revisiones se complican y incorporar nuevos desarrolladores tarda más de lo que debería. El objetivo de una estructura deliberada es simple: cualquier archivo debe ser encontrable por su responsabilidad, no de memoria.

## Estructura plana (apps pequeñas)

Para la mayoría de las apps con menos de unos cientos de archivos, una estructura de un solo nivel agrupada por rol técnico es suficiente. Cada carpeta tiene un único propósito:

```
src/
├── api/              # Clientes HTTP, funciones de servicio, mappers de respuesta
├── assets/           # Imágenes, fuentes, CSS global — todo lo que no exporta lógica
├── components/       # Componentes de UI reutilizables (Button, Modal, DataTable)
├── composables/      # Lógica reactiva reutilizable (useAuth, usePagination)
├── router/           # Configuración de Vue Router y guards de ruta
├── stores/           # Pinia stores — un archivo por dominio (useCartStore, useUserStore)
├── types/            # Interfaces y alias de tipos TypeScript compartidos
├── utils/            # Funciones auxiliares puras (formatDate, slugify)
├── views/            # Componentes de nivel de página mapeados a rutas
└── App.vue
```

La disciplina clave: **aquí solo vive el código compartido y transversal.** Si un componente solo se usa dentro de una vista, no pertenece a `components/` — pertenece junto a la vista que lo posee. Mezclar código compartido con código específico de una feature en la misma carpeta plana es lo que provoca que `components/` acabe con 80 archivos sin ninguna agrupación clara.

## Estructura por features (apps medianas y grandes)

Cuando una estructura plana empieza a generar carpetas con más de 20 archivos, o cuando varios desarrolladores trabajan en paralelo en distintas partes de la app, agrupar por feature (también llamado domain-driven o screaming architecture) es la mejor opción.

La idea es que la estructura de carpetas debería decirte qué **hace** la aplicación, no cómo está implementada técnicamente:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/     # LoginForm.vue, OAuthButton.vue
│   │   ├── composables/    # useSession.ts, usePermissions.ts
│   │   ├── stores/         # useAuthStore.ts
│   │   ├── types/          # AuthUser.ts, LoginPayload.ts
│   │   └── index.ts        # API pública — lo que otras features pueden importar
│   ├── catalog/
│   │   ├── components/     # ProductCard.vue, FilterPanel.vue
│   │   ├── composables/    # useProductSearch.ts, useFilters.ts
│   │   ├── stores/         # useCatalogStore.ts
│   │   ├── types/          # Product.ts, Category.ts
│   │   └── index.ts
│   └── checkout/
│       ├── components/     # CartSummary.vue, PaymentForm.vue
│       ├── composables/    # useCart.ts, useCheckout.ts
│       ├── stores/         # useCartStore.ts
│       ├── types/          # CartItem.ts, Order.ts
│       └── index.ts
├── shared/             # Código usado por 2 o más features
│   ├── components/     # AppButton.vue, AppModal.vue, AppIcon.vue
│   ├── composables/    # useToast.ts, useMediaQuery.ts
│   ├── types/          # Pagination.ts, ApiResponse.ts
│   └── utils/          # formatDate.ts, slugify.ts
├── router/
├── assets/
└── App.vue
```

¿Cuándo tiene más sentido que la estructura plana? Cuando tienes equipos que son dueños de features de principio a fin, cuando quieres que sea fácil eliminar o extraer una feature, o simplemente cuando la carpeta `components/` plana ha crecido demasiado como para navegar por ella.

## Código compartido vs. código de feature

El error más habitual en proyectos con estructura por features es dejar que las utilidades compartidas se acumulen dentro de una sola feature y luego importarlas desde ahí. La regla es estricta:

- El código usado por **una única feature** vive dentro de esa feature.
- El código usado por **dos o más features** se mueve a `shared/`.

```ts
// shared/composables/useToast.ts
import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info') {
    toasts.value.push({ id: Date.now(), message, type })
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, show, dismiss }
}
```

Tanto `auth` como `checkout` pueden importar `useToast` porque vive en `shared/`. Ninguna importa directamente de la otra feature.

## Barrel exports (API pública de la feature)

Cada carpeta de feature expone un archivo `index.ts` que define exactamente qué puede usar el mundo exterior. Todo lo demás dentro de la feature se considera interno.

```ts
// features/auth/index.ts
export { default as LoginForm } from './components/LoginForm.vue'
export { default as OAuthButton } from './components/OAuthButton.vue'
export { useSession } from './composables/useSession'
export { useAuthStore } from './stores/useAuthStore'
export type { AuthUser } from './types/AuthUser'

// NO se exporta: helpers internos, sub-componentes, llamadas directas a la API
```

Las demás features importan desde el barrel, nunca desde rutas internas:

```ts
// Correcto — importando desde la API pública de la feature
import { useSession, type AuthUser } from '@/features/auth'

// Incorrecto — accediendo a los internos, rompe el límite
import { useSession } from '@/features/auth/composables/useSession'
```

Esto crea contratos explícitos entre features. Cuando refactorizas los internos de `auth`, nada se rompe en `checkout` mientras las exportaciones de `index.ts` sigan siendo estables.

## Convenciones de nomenclatura

| Tipo | Convención | Ejemplo |
| --- | --- | --- |
| Componentes | PascalCase, sustantivo | `ProductCard.vue`, `AppModal.vue` |
| Composables | camelCase, prefijo `use` | `useCart.ts`, `useMediaQuery.ts` |
| Pinia stores | camelCase, `useXxxStore` | `useAuthStore.ts`, `useCartStore.ts` |
| Tipos / interfaces | PascalCase | `AuthUser.ts`, `CartItem.ts` |
| Funciones utilitarias | camelCase, verbo | `formatDate.ts`, `slugify.ts` |
| Carpetas de features | kebab-case | `user-profile/`, `order-history/` |

Estas no son preferencias de estilo arbitrarias. PascalCase para los componentes los distingue de los elementos HTML nativos en los templates. El prefijo `use` para los composables señala "esto devuelve estado reactivo y efectos secundarios" a cualquiera que lea el import. La consistencia aquí elimina por completo una categoría de microdecisiones.

## Cuándo cambiar de estructura

| Situación | Estructura recomendada |
| --- | --- |
| App pequeña, 1–2 desarrolladores, < 100 componentes | Plana (`src/components`, `src/composables`, etc.) |
| App mediana, 3–5 desarrolladores, features por dominio | Por features (`src/features/xxx`) |
| App grande, múltiples equipos, sistema de diseño compartido | Por features + `shared/` + considerar un monorepo |
| Múltiples apps que comparten componentes UI o lógica de negocio | Monorepo con packages (`packages/ui`, `packages/core`) |

El error que cometen los equipos es saltar directamente a la estructura más compleja antes de que exista la complejidad que la justifique. Una estructura plana bien mantenida es mejor que una estructura por features aplicada de forma inconsistente. Elige la estructura más simple que mantenga las carpetas navegables y migra cuando el dolor sea real.

---

Ver también: [¿Cuáles son los anti-patrones más comunes en codebases Vue grandes?](/es/q/vue-anti-patterns) · [¿Cómo arquitectas una app Vue 3 para escalar con múltiples equipos?](/es/q/scale-vue-multiple-teams) · [¿Cómo funciona el sistema de plugins de Vue?](/es/q/plugin-system)

## Referencias

- [Project Structure](https://vuejs.org/guide/scaling-up/project-structure.html) - Vue.js docs  
- [Style Guide](https://vuejs.org/style-guide/) - Vue.js docs
- [Pinia](https://pinia.vuejs.org/) - Pinia docs
