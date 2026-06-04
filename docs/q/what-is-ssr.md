---
order: 141
title: 'What is Server Side Rendering and what are its advantages?'
difficulty: 'intermediate'
tags: ['ssr', 'vite']
summary: 'The server runs Vue components and sends complete HTML. The browser shows content immediately, then JavaScript loads and hydrates for interactivity.'
---

Server Side Rendering (SSR) means generating the HTML for a page on the server instead of in the browser. When a user requests a page, the server runs your Vue components, produces complete HTML, and sends it. The browser shows the content immediately, then JavaScript loads and makes the page interactive (hydration).

## How SSR works in Vue

```
1. Browser requests /about
2. Server creates a Vue app instance
3. Server runs components, resolves async data
4. Server renders the component tree to an HTML string
5. Server sends the HTML + serialized state to the browser
6. Browser displays the HTML instantly (content visible)
7. JavaScript bundle loads
8. Vue "hydrates" the static HTML: attaches event listeners, makes it interactive
```

## SSR vs CSR (Client Side Rendering)

With CSR (the default SPA approach), the server sends an empty HTML shell and the browser builds the entire page with JavaScript:

```
CSR:
  Server sends → <div id="app"></div> + JS bundle
  Browser downloads JS → executes → renders content
  User sees blank page until JS finishes

SSR:
  Server sends → full HTML with content + JS bundle
  Browser shows HTML immediately
  JS loads in background → hydrates → page becomes interactive
```

<img src="/diagrams/en/what-is-ssr.svg" alt="Sequence diagram comparing SSR and CSR request timelines" style="max-width: 100%;" />

## Advantages of SSR

**Faster first contentful paint.** Users see content before JavaScript loads. On slow connections or low-end devices, this difference is significant.

**Better SEO.** Search engine crawlers receive complete HTML. While Google can execute JavaScript, other crawlers often can't, and even Google indexes pre-rendered content faster.

**Better social sharing.** When someone shares a link on Twitter, Slack, or Discord, the preview card is generated from the HTML response. CSR pages show blank previews unless you add separate meta tag handling.

**Works without JavaScript.** The initial content is visible even if JavaScript fails to load or is disabled. Forms and links can still work through standard HTML behavior.

## Disadvantages of SSR

**Server cost.** Every request runs Vue on the server. A CSR app serves static files from a CDN. SSR needs compute resources that scale with traffic.

**Development constraints.** Code runs in two environments. You can't use `window`, `document`, or browser-only APIs in code that runs on the server. Lifecycle hooks like `onMounted` only run on the client.

**Longer Time to Interactive.** The page is visible sooner, but it's not interactive until hydration completes. Users might click a button that doesn't respond yet.

**More complexity.** State management needs to be SSR-safe (no singletons). Third-party libraries might not support SSR. Debugging spans two environments.

## SSR in Vue without a framework

Vue provides `@vue/server-renderer` for manual SSR:

```ts
// server.js
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'

async function render(url) {
  const app = createSSRApp(App)
  const html = await renderToString(app)
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <div id="app">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `
}
```

```ts
// client.js
import { createSSRApp } from 'vue'
import App from './App.vue'

const app = createSSRApp(App)
app.mount('#app') // hydrates existing HTML instead of replacing it
```

Note `createSSRApp` instead of `createApp`. This tells Vue to hydrate existing markup rather than creating new DOM.

## SSR with Nuxt (the practical approach)

Nuxt handles all the SSR plumbing for you: server rendering, hydration, state serialization, code splitting, and platform-specific API guards:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true // this is the default
})
```

No manual server setup, no separate entry files, no state serialization code. This is why most Vue SSR apps use Nuxt.

## When to use SSR

| Use case                         | SSR?                                   |
| -------------------------------- | -------------------------------------- |
| Marketing site, blog, docs       | Yes, or prerender (SSG)                |
| E-commerce product pages         | Yes (SEO + performance)                |
| Dashboard behind login           | No (CSR is simpler, no SEO needed)     |
| Real-time collaborative app      | Maybe (SSR for initial load, then CSR) |
| Static site with no dynamic data | SSG (prerender at build time)          |

See also: [What is hydration?](/q/what-is-hydration) · [What causes SSR hydration mismatches?](/q/ssr-hydration-mismatch) · [What are the rendering modes in Nuxt?](/q/nuxt-rendering-modes)

## References

- [Server-Side Rendering](https://vuejs.org/guide/scaling-up/ssr.html) - Vue.js docs
- [Rendering](https://nuxt.com/docs/getting-started/rendering) - Nuxt docs
- [Vite SSR](https://vite.dev/guide/ssr.html) - Vite docs
