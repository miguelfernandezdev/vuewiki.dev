---
order: 104
title: "How do Vue DevTools help with debugging?"
difficulty: "beginner"
tags: ["tooling"]
---

Vue DevTools is a browser extension (Chrome, Firefox, Edge) and a standalone Vite plugin that lets you inspect your Vue app at runtime. You can see the component tree, reactive state, Pinia stores, routes, and performance data without adding `console.log` everywhere.

## Installing

**Browser extension** (Vue 3):

Install "Vue.js devtools" from the Chrome Web Store or Firefox Add-ons. It activates automatically when it detects a Vue app on the page.

**Vite plugin** (opens in a panel inside your app):

```bash
npm install -D vite-plugin-vue-devtools
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()]
})
```

In Nuxt 3, devtools are built-in. Enable them with:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true }
})
```

## Component inspector

The component tree shows every component in your app with its hierarchy. Select a component to see:

- **Props** — current values, types, whether they're required
- **Reactive state** — refs, reactive objects, computed values with their current values
- **Emitted events** — a log of every event the component has emitted
- **Slots** — which slots are being used

You can edit reactive state directly in the panel to test how the UI responds without changing code.

## Pinia integration

DevTools show every Pinia store with:

- Current state values (editable in the panel)
- Getters and their computed values
- A timeline of every action call with arguments and timing
- Time-travel debugging: click any previous state snapshot to revert the UI to that point

This is one of the main reasons to use Pinia over hand-rolled composables for complex state.

## Router tab

See all registered routes, the current route with its params/query/meta, and a history of navigations. Useful for debugging route guards and dynamic route matching.

## Timeline

A chronological log of events in your app:

- Component lifecycle hooks (mounted, updated, unmounted)
- Pinia actions and mutations
- Route navigations
- Custom events you emit

Filter by event type to focus on what you're debugging.

## Performance profiling

The performance tab measures:

- Component render time
- How often a component re-renders
- Which components are the most expensive

Use this to find components that re-render too often or take too long to render.

## Inspecting from the page

Click the "select component" button in DevTools, then click any element on the page. DevTools jumps to that component in the tree. This is faster than navigating the tree manually for deeply nested components.

## Common debugging workflows

| Problem | What to check in DevTools |
|---|---|
| UI not updating | Check if the reactive state actually changed (state tab) |
| Wrong data displayed | Inspect props passed to the component |
| Route not matching | Check the router tab for registered routes and current params |
| Pinia action not working | Check the timeline for action calls and errors |
| Component re-rendering too much | Use the performance tab to find excessive renders |
| Event not reaching parent | Check emitted events on the child component |
