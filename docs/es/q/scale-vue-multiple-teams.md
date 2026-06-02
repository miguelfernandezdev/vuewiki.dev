---
order: 139
title: "¿Cómo se arquitectura una app Vue 3 para escalar con múltiples equipos?"
difficulty: "advanced"
tags: ["architecture", "pinia"]
---

Organizar el código por dominio de negocio, no por capa técnica. Cada equipo posee un corte vertical de la aplicación (un módulo de funcionalidad) con sus propios componentes, composables, stores y rutas. El código compartido va en un paquete separado con límites de API claros. El objetivo es que los equipos puedan entregar de forma independiente sin pisarse el código.

## Estructura de directorios por funcionalidad

En lugar de agrupar por tipo (todos los componentes juntos, todos los stores juntos), agrupar por dominio:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── stores/
│   │   ├── routes.ts
│   │   └── index.ts          ← API pública
│   ├── billing/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── stores/
│   │   ├── routes.ts
│   │   └── index.ts
│   └── dashboard/
│       ├── components/
│       ├── composables/
│       ├── stores/
│       ├── routes.ts
│       └── index.ts
├── shared/
│   ├── components/            ← sistema de diseño
│   ├── composables/           ← utilidades transversales
│   ├── types/
│   └── index.ts
├── app/
│   ├── App.vue
│   ├── router.ts             ← ensambla las rutas de cada feature
│   └── main.ts
```

El `index.ts` de cada feature exporta solo lo que otras features tienen permitido importar. Los componentes y helpers internos permanecen privados.

## Límites de módulo con barrel exports

```ts
// features/auth/index.ts — API pública
export { useAuth } from './composables/useAuth'
export { LoginPage } from './components/LoginPage.vue'
export { authRoutes } from './routes'
export type { User, AuthState } from './types'

// Todo lo demás en auth/ es interno
```

Aplicar esto con reglas de ESLint que restrinjan las importaciones profundas:

```js
// eslint.config.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/features/*/components/*', '@/features/*/composables/*', '@/features/*/stores/*'],
          message: 'Import from the feature barrel (index.ts), not from internal files.'
        }
      ]
    }]
  }
}
```

## Composición de rutas

Cada feature define sus propias rutas. El router de la app las ensambla:

```ts
// features/billing/routes.ts
export const billingRoutes: RouteRecordRaw[] = [
  {
    path: '/billing',
    component: () => import('./components/BillingLayout.vue'),
    children: [
      { path: '', component: () => import('./components/BillingDashboard.vue') },
      { path: 'invoices', component: () => import('./components/Invoices.vue') }
    ]
  }
]
```

```ts
// app/router.ts
import { authRoutes } from '@/features/auth'
import { billingRoutes } from '@/features/billing'
import { dashboardRoutes } from '@/features/dashboard'

const router = createRouter({
  routes: [
    ...authRoutes,
    ...billingRoutes,
    ...dashboardRoutes
  ]
})
```

Los equipos añaden rutas a su propia feature sin tocar el fichero de router global.

## Estado compartido entre features

Las features deben evitar importar stores de otras features directamente. Cuando dos features necesitan compartir datos, usar uno de estos patrones:

```ts
// shared/composables/useCurrentUser.ts
// Interfaz ligera que auth gestiona, otros consumen
const currentUser = ref<User | null>(null)

export function useCurrentUser() {
  return { user: readonly(currentUser) }
}

export function setCurrentUser(user: User | null) {
  currentUser.value = user
}
```

La feature de auth llama a `setCurrentUser` tras el login. Otras features llaman a `useCurrentUser()` para leer. El composable compartido es el contrato entre ellas.

## Monorepo para organizaciones grandes

Cuando los equipos son completamente independientes, mover las features a paquetes:

```
packages/
├── auth/          ← Equipo Alpha
├── billing/       ← Equipo Beta
├── dashboard/     ← Equipo Gamma
├── ui/            ← Equipo de sistema de diseño
└── app/           ← Equipo shell (ensambla todo)
```

Cada paquete tiene su propio `package.json`, tests y pipeline de build. El paquete `app` importa los demás como dependencias. Aquí es donde entran herramientas como pnpm workspaces, Turborepo o Nx.

## Principios clave

| Principio | Por qué |
|---|---|
| Módulos por feature en lugar de capas técnicas | Los equipos poseen verticales, no horizontales |
| Barrel exports como API pública | Previene el acoplamiento a la estructura interna |
| El código compartido es explícito y versionado | Los cambios en código compartido son visibles para todos los consumidores |
| Las features no importan internos de otras features | Usar contratos compartidos (composables, tipos, eventos) |
| Rutas con lazy loading por feature | Cada feature es un chunk separado, reduciendo la carga inicial |
| Las reglas de lint refuerzan los límites | Los humanos olvidan, los linters no |

Ver también: [¿Cómo estructurar un proyecto Vue grande?](/es/q/large-project-structure) · [¿Cómo estructurar un micro-frontend con Vue?](/es/q/micro-frontends-vue) · [¿Cuáles son los anti-patrones comunes en codebases Vue grandes?](/es/q/vue-anti-patterns)

## Referencias

- [Project Structure](https://vuejs.org/guide/scaling-up/project-structure.html) - Vue.js docs
- [Style Guide](https://vuejs.org/style-guide/) - Vue.js docs
- [Pinia](https://pinia.vuejs.org/) - Pinia docs
