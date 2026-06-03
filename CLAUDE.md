# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VueWiki.dev is a Vue.js interview Q&A site with 30 questions organized by difficulty (beginner, intermediate, advanced) and topic tags. Built with VitePress.

## Commands

- `pnpm dev` — start dev server (localhost:5173)
- `pnpm build` — static site build
- `pnpm preview` — preview production build

## Architecture

- `docs/` — VitePress source directory
- `docs/.vitepress/config.ts` — site config (i18n, search, nav, social links)
- `docs/.vitepress/theme/` — custom theme extending VitePress default
- `docs/.vitepress/theme/HomePage.vue` — homepage with search, difficulty filters, and tag filters
- `docs/.vitepress/theme/QuestionMeta.vue` — question detail metadata (back link, difficulty badge, tags)
- `docs/.vitepress/theme/questions.data.ts` — build-time data loader for question frontmatter
- `docs/.vitepress/theme/i18n.ts` — i18n composable using locale JSON files
- `docs/.vitepress/theme/locales/` — EN and ES translation files
- `docs/q/` — English question markdown files
- `docs/es/q/` — Spanish question markdown files (same content, not yet translated)
- `docs/public/` — static assets (favicon, robots.txt)

## Question format

Each question is a markdown file with this frontmatter:

```yaml
---
order: 1
title: 'Question title here?'
difficulty: 'beginner'
tags: ['composition-api', 'reactivity']
---
```

The markdown body is the answer, rendered by VitePress with syntax highlighting.

## Stack

- VitePress 1.6 with custom theme extending DefaultTheme
- i18n via VitePress locales config (EN default, ES at /es/)
- Deployed to Vercel as static site

## Conventions

- Conventional commits in English (`feat:`, `fix:`, `chore:`, `docs:`)
- Small, focused commits (one logical change per commit)
- Vue 3 Composition API with `<script setup lang="ts">`
- Slug-based markdown filenames (e.g. `ref-vs-reactive.md`)
