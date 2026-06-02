---
order: 97
title: "¿Cómo se despliega una aplicación Nuxt?"
difficulty: "intermediate"
tags: ["nuxt", "tooling"]
---

Nuxt usa Nitro como motor de servidor, que compila la aplicación para cualquier plataforma de alojamiento. Se construye una vez y Nitro adapta la salida al destino: servidor Node.js, archivos estáticos, funciones serverless o edge workers.

## Dos comandos de build

**`nuxt build`** genera un servidor que gestiona SSR, rutas de API y renderizado dinámico:

```bash
nuxt build
node .output/server/index.mjs
```

**`nuxt generate`** pre-renderiza todas las páginas a HTML estático:

```bash
nuxt generate
# despliega .output/public/ en cualquier host estático
```

## Presets

Indica a Nitro qué plataforma es el destino:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel'
  }
})
```

O configúralo en tiempo de build:

```bash
NITRO_PRESET=cloudflare-pages nuxt build
```

La mayoría de plataformas se detectan automáticamente, por lo que normalmente no hace falta configurar ningún preset.

## Ejemplos por plataforma

### Vercel

Sin configuración. Vercel detecta Nuxt automáticamente:

```bash
npm i -g vercel
vercel
```

Admite SSR, rutas de API, edge functions y despliegues de previsualización de forma nativa.

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

Adecuado para sitios con gran cantidad de contenido estático. El SSR se ejecuta como funciones serverless.

### Cloudflare Pages

```bash
NITRO_PRESET=cloudflare-pages nuxt build
```

Ancho de banda ilimitado en el plan gratuito. La aplicación se ejecuta en la red edge de Cloudflare, cerca de los usuarios en todo el mundo. Algunas APIs de Node.js no están disponibles en Workers.

### Servidor Node.js (VPS, Docker)

```bash
nuxt build
PORT=3000 node .output/server/index.mjs
```

Control total. Funciona en cualquier servidor que ejecute Node.js.

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output .output
ENV PORT=3000
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

## Elegir plataforma

| Necesidad | Plataforma |
|---|---|
| Configuración más rápida, buena experiencia de desarrollo | Vercel |
| Sitio estático con formularios integrados | Netlify |
| Mejor rendimiento global, bajo coste a escala | Cloudflare Pages |
| Control total, infraestructura existente | Node.js en VPS o Docker |

## Variables de entorno en producción

Los valores de configuración en tiempo de ejecución provienen de variables de entorno:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    secretKey: '',          // solo en el servidor, lee NUXT_SECRET_KEY
    public: {
      apiBase: ''           // cliente y servidor, lee NUXT_PUBLIC_API_BASE
    }
  }
})
```

Configúralas en el panel de la plataforma o en el archivo `.env`. Nuxt mapea automáticamente las variables de entorno con prefijo `NUXT_` a las claves de configuración.

## El directorio .output

Tras el build, todo reside en `.output/`:

```
.output/
├── server/
│   └── index.mjs      ← punto de entrada del servidor
├── public/
│   └── _nuxt/          ← assets del cliente (JS, CSS)
└── nitro.json          ← metadatos del build
```

Este directorio es autocontenido. Cópialo a cualquier servidor y ejecútalo.

Ver también: [¿Cuáles son los modos de renderizado en Nuxt?](/es/q/nuxt-rendering-modes) · [¿Cómo funcionan las rutas de servidor de Nitro?](/es/q/nuxt-nitro-server-routes) · [¿Cómo funciona el renderizado híbrido en Nuxt?](/es/q/nuxt-hybrid-rendering)

## Referencias

- [Deployment](https://nuxt.com/docs/getting-started/deployment) - Nuxt docs
- [Nitro Deploy Presets](https://nitro.build/deploy) - Nitro docs
- [nuxt build](https://nuxt.com/docs/api/commands/build) - Nuxt docs
