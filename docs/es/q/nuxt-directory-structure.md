---
order: 150
title: "¿Cuál es la convención de estructura de directorios en Nuxt?"
difficulty: "beginner"
tags: ["nuxt", "architecture", "vite"]
---

Nuxt está basado en convenciones. La estructura de directorios es la configuración. El lugar donde colocas un archivo determina su función: un archivo `.vue` en `pages/` se convierte en una ruta, un archivo `.ts` en `server/api/` se convierte en un endpoint de API, un composable en `composables/` se importa automáticamente. No hay configuración manual.

## Estructura completa del proyecto

```
my-app/
├── app.vue                  ← componente raíz
├── nuxt.config.ts           ← configuración en tiempo de build
├── app.config.ts            ← configuración de app en tiempo de ejecución
├── error.vue                ← página de error personalizada
├── components/              ← componentes Vue con auto-importación
├── composables/             ← composables con auto-importación
├── utils/                   ← funciones de utilidad con auto-importación
├── pages/                   ← enrutamiento basado en archivos
├── layouts/                 ← layouts para envolver páginas
├── middleware/              ← middleware de rutas
├── plugins/                 ← plugins de Vue (auto-registrados)
├── assets/                  ← procesados por el bundler (CSS, imágenes, fuentes)
├── public/                  ← servidos tal cual (favicon, robots.txt)
├── server/                  ← código de servidor Nitro
│   ├── api/                 ← rutas de API (/api/*)
│   ├── routes/              ← rutas de servidor (sin prefijo /api)
│   ├── middleware/          ← middleware de servidor (en cada petición)
│   ├── plugins/             ← plugins de arranque del servidor
│   └── utils/               ← utilidades de servidor con auto-importación
├── layers/                  ← layers locales (auto-detectados)
└── modules/                 ← módulos locales de Nuxt
```

## Qué hace cada directorio

### components/

Auto-importados por nombre de archivo. Los nombres de carpeta se convierten en prefijos:

```
components/
├── AppHeader.vue            → <AppHeader />
├── base/
│   └── Button.vue           → <BaseButton />
└── form/
    └── Input.vue            → <FormInput />
```

### composables/

Los archivos de primer nivel se auto-importan:

```
composables/
├── useAuth.ts               → useAuth() disponible en cualquier lugar
├── useCart.ts               → useCart() disponible en cualquier lugar
└── helpers/
    └── validate.ts          → NO se auto-importa (anidado)
```

### pages/

Cada archivo se convierte en una ruta:

```
pages/
├── index.vue                → /
├── about.vue                → /about
├── blog/
│   ├── index.vue            → /blog
│   └── [slug].vue           → /blog/:slug
└── [...slug].vue            → ruta comodín
```

Sin directorio `pages/`, vue-router no se incluye en absoluto.

### layouts/

Wrappers que rodean el contenido de las páginas:

```
layouts/
├── default.vue              → usado por todas las páginas salvo que se indique otro
└── admin.vue                → las páginas lo activan mediante definePageMeta
```

### middleware/

Guards de navegación de rutas:

```
middleware/
├── auth.ts                  → aplicado por página mediante definePageMeta
└── analytics.global.ts      → se ejecuta en cada cambio de ruta
```

### plugins/

Ejecutan código al iniciar la app. Auto-registrados, ordenados por nombre de archivo:

```
plugins/
├── 01.auth.ts               → se ejecuta primero
├── 02.analytics.client.ts   → solo en el cliente
└── 03.logger.server.ts      → solo en el servidor
```

### server/

Todo lo que hay aquí se ejecuta en Nitro, no en Vue:

```
server/
├── api/users.get.ts         → GET /api/users
├── api/users.post.ts        → POST /api/users
├── api/users/[id].ts        → /api/users/:id
├── middleware/log.ts         → se ejecuta en cada petición al servidor
├── plugins/db.ts            → se ejecuta una vez al arrancar el servidor
└── utils/db.ts              → auto-importado en el código del servidor
```

### public/ vs assets/

Los archivos de `public/` se sirven sin cambios en la URL raíz:
```
public/favicon.ico           → /favicon.ico
public/robots.txt            → /robots.txt
```

Los archivos de `assets/` son procesados por el bundler (con hash, optimizados):
```vue
<template>
  <img src="~/assets/images/hero.png" />
</template>

<style>
@import '~/assets/css/main.css';
</style>
```

## Convenciones de nombres de archivo

| Patrón | Significado |
|---|---|
| `[param].vue` | Parámetro de ruta dinámico |
| `[[param]].vue` | Parámetro de ruta opcional |
| `[...slug].vue` | Ruta comodín |
| `(group)/` | Grupo de rutas (carpeta no incluida en la URL) |
| `.client.vue` / `.client.ts` | Solo en el cliente |
| `.server.vue` / `.server.ts` | Solo en el servidor |
| `.global.ts` | Middleware global |

## Archivos especiales

| Archivo | Propósito |
|---|---|
| `app.vue` | Componente raíz (opcional si existe `pages/`) |
| `nuxt.config.ts` | Configuración en tiempo de build (módulos, Vite, Nitro) |
| `app.config.ts` | Configuración en tiempo de ejecución (tema, feature flags) |
| `error.vue` | Página de error personalizada |
| `.env` | Variables de entorno |

## Todo es opcional

Solo creas los directorios que necesitas. Una app Nuxt mínima puede ser solo `app.vue` y `nuxt.config.ts`. Añade `pages/` cuando necesites enrutamiento, `server/api/` cuando necesites endpoints de API, `components/` cuando tengas componentes compartidos.

Ver también: [¿Cómo funciona el routing basado en archivos en Nuxt?](/es/q/nuxt-file-based-routing) · [¿Cómo funcionan los auto-imports en Nuxt?](/es/q/nuxt-auto-imports) · [¿Qué son las layers de Nuxt?](/es/q/nuxt-layers)

## Referencias

- [Directory Structure](https://nuxt.com/docs/guide/directory-structure) - Nuxt docs
- [app.vue](https://nuxt.com/docs/guide/directory-structure/app) - Nuxt docs
- [nuxt.config.ts](https://nuxt.com/docs/guide/directory-structure/nuxt-config) - Nuxt docs
