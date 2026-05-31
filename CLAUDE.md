# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VueWiki.dev is a Vue.js interview Q&A site with questions organized by difficulty (beginner, intermediate, advanced). Built with Nuxt 4, Nuxt UI v4, and Tailwind CSS v4.

## Commands

- `pnpm dev` — start dev server (localhost:3000)
- `pnpm build` — production build
- `pnpm generate` — static site generation
- `pnpm preview` — preview production build

## Architecture

- `app/pages/` — file-based routing (Nuxt auto-imports)
- `app/layouts/` — page layouts (default layout has header/footer)
- `app/components/` — auto-imported Vue components
- `app/assets/css/main.css` — Tailwind v4 + Nuxt UI CSS entry point
- Questions are currently hardcoded in `app/pages/index.vue` (will move to Nuxt Content later)

## Stack

- **Nuxt 4** with Nuxt UI v4 components (UCard, UBadge, UButton, UInput, UHeader, etc.)
- **Tailwind CSS v4** via Nuxt UI (no separate `@nuxtjs/tailwindcss` module needed)
- **pnpm** as package manager

## Conventions

- Conventional commits in English (`feat:`, `fix:`, `chore:`, `docs:`)
- Small, focused commits (one logical change per commit)
- Vue 3 Composition API with `<script setup lang="ts">`
- Nuxt auto-imports (no manual imports for Vue/Nuxt APIs)
