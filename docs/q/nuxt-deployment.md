---
order: 97
title: "How do you deploy a Nuxt app?"
difficulty: "intermediate"
tags: ["nuxt", "tooling"]
---

Nuxt uses Nitro as its server engine, which compiles your app for any hosting platform. You build once, and Nitro adapts the output to the target: Node.js server, static files, serverless functions, or edge workers.

## Two build commands

**`nuxt build`** produces a server that handles SSR, API routes, and dynamic rendering:

```bash
nuxt build
node .output/server/index.mjs
```

**`nuxt generate`** pre-renders every page to static HTML:

```bash
nuxt generate
# deploy .output/public/ to any static host
```

## Presets

Tell Nitro which platform you're targeting:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    preset: 'vercel'
  }
})
```

Or set it at build time:

```bash
NITRO_PRESET=cloudflare-pages nuxt build
```

Most platforms are auto-detected, so you often don't need to set a preset at all.

## Platform examples

### Vercel

Zero config. Vercel detects Nuxt automatically:

```bash
npm i -g vercel
vercel
```

Supports SSR, API routes, edge functions, and preview deployments out of the box.

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

Good for static-heavy sites. SSR runs as serverless functions.

### Cloudflare Pages

```bash
NITRO_PRESET=cloudflare-pages nuxt build
```

Unlimited bandwidth on the free tier. Your app runs on Cloudflare's edge network, close to users worldwide. Some Node.js APIs are not available in Workers.

### Node.js server (VPS, Docker)

```bash
nuxt build
PORT=3000 node .output/server/index.mjs
```

Full control. Works on any server that runs Node.js.

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

## Choosing a platform

| Need | Platform |
|---|---|
| Fastest setup, great DX | Vercel |
| Static site with built-in forms | Netlify |
| Best global performance, low cost at scale | Cloudflare Pages |
| Full control, existing infrastructure | Node.js on VPS or Docker |

## Environment variables in production

Runtime config values come from environment variables:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    secretKey: '',          // server-only, reads NUXT_SECRET_KEY
    public: {
      apiBase: ''           // client + server, reads NUXT_PUBLIC_API_BASE
    }
  }
})
```

Set them in your platform's dashboard or `.env` file. Nuxt maps `NUXT_` prefixed env vars to config keys automatically.

## The .output directory

After building, everything lives in `.output/`:

```
.output/
├── server/
│   └── index.mjs      ← the server entry point
├── public/
│   └── _nuxt/          ← client assets (JS, CSS)
└── nitro.json          ← build metadata
```

This directory is self-contained. Copy it to any server and run it.

See also: [What are the rendering modes in Nuxt?](/q/nuxt-rendering-modes) · [How do Nitro server routes work?](/q/nuxt-nitro-server-routes) · [How does hybrid rendering work in Nuxt?](/q/nuxt-hybrid-rendering)

## References

- [Deployment](https://nuxt.com/docs/getting-started/deployment) - Nuxt docs
- [Nitro Deploy Presets](https://nitro.build/deploy) - Nitro docs
- [nuxt build](https://nuxt.com/docs/api/commands/build) - Nuxt docs
