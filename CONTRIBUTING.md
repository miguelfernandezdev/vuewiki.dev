# Contributing to VueWiki

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

Thanks for your interest in contributing! Every improvement matters, whether it's fixing a typo, improving an answer, adding a new question, or translating content.

## Before you start

- For new questions or structural changes, open an issue first so we can discuss the approach.
- For typos, small fixes, or translations, go ahead and open a PR directly.
- One pull request per concern. Don't mix a new question with a translation fix.

## Development setup

Prerequisites:

- Node.js >= 20
- pnpm >= 9

```bash
git clone https://github.com/miguelfernandezdev/vuewiki.dev.git
cd vuewiki.dev
pnpm install
pnpm dev
```

The site runs at `http://localhost:5173`. Markdown changes hot-reload automatically.

This is a content-focused project. There are no test suites. A successful `pnpm build` is the quality gate.

## Adding a new question

1. Create a markdown file in `docs/q/` with a slug-based name (e.g. `docs/q/your-question-slug.md`).
2. Use this frontmatter template:

```yaml
---
order: 171
title: 'Your question title here?'
difficulty: 'beginner'
tags: ['composition-api', 'reactivity']
---
```

1. Write the answer below the frontmatter. Include at least one code example.
1. Open a pull request.

### Frontmatter fields

| Field        | Type     | Values                                       |
| ------------ | -------- | -------------------------------------------- |
| `order`      | number   | Next available number (check existing files) |
| `title`      | string   | The interview question                       |
| `difficulty` | enum     | `beginner`, `intermediate`, `advanced`       |
| `tags`       | string[] | One or more from the list below              |

### Available tags

`accessibility`, `animation`, `architecture`, `components`, `composables`, `composition-api`, `core`, `data-fetching`, `debugging`, `directives`, `error-handling`, `errors`, `forms`, `lifecycle`, `migration`, `nuxt`, `performance`, `reactivity`, `security`, `ssr`, `state-management`, `styling`, `testing`, `tooling`, `typescript`, `vue-router`

If your question needs a new tag, propose it in the PR description.

## Fixing an existing answer

1. Find the question file in `docs/q/`.
2. Edit the markdown content.
3. Open a pull request explaining what was wrong or what you improved.

## Translating content

English is the source of truth. Translated files live in `docs/{lang}/q/` mirroring `docs/q/`.

Currently supported: English (en), Spanish (es). Looking for contributors for: Chinese (zh), Portuguese (pt), Japanese (ja), Korean (ko), French (fr), German (de), Russian (ru), Arabic (ar), Vietnamese (vi), Hindi (hi). See the [translation issues](https://github.com/miguelfernandezdev/vuewiki.dev/issues?q=label%3Aenhancement+i18n) for details.

1. Pick a question file from `docs/{lang}/q/` that still has English content or needs improvement.
1. Translate the markdown body. Keep code examples in English, translate surrounding text.
1. Keep the same frontmatter structure (translate only the `title`).
1. Open a pull request.

UI labels for all languages live in `docs/.vitepress/theme/locales/{lang}.json`.

## Commit convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: add question about provide/inject
fix: correct code example in reactivity question
docs: update contributing guide
fix(i18n): translate missing UI labels to Spanish
```

## Guidelines

- Keep answers concise and practical.
- Always include at least one code example.
- Use Vue 3 Composition API with `<script setup>` in examples.
- Prefer TypeScript in code examples.
- One question per file.
