# Contributing to VueWiki.dev

You can add questions, fix existing answers, or help translate content to Spanish.

## Adding a new question

1. Fork the repo and create a branch: `git checkout -b add-question-name`
2. Create a markdown file in `docs/q/` with a slug-based name (e.g. `docs/q/your-question-slug.md`)
3. Use this frontmatter template:

```yaml
---
order: 31
title: "Your question title here?"
difficulty: "beginner"
tags: ["composition-api", "reactivity"]
---
```

4. Write the answer below the frontmatter. Include code examples with language tags for syntax highlighting:

````markdown
```vue
<script setup lang="ts">
const count = ref(0)
</script>
```
````

5. Open a pull request

### Frontmatter fields

| Field | Type | Values |
|-------|------|--------|
| `order` | number | Next available number (check existing files) |
| `title` | string | The interview question |
| `difficulty` | enum | `beginner`, `intermediate`, `advanced` |
| `tags` | string[] | One or more from the list below |

### Available tags

`composition-api`, `reactivity`, `typescript`, `directives`, `components`, `state-management`, `testing`, `composables`, `vue-router`, `performance`, `architecture`, `migration`

If your question needs a new tag, propose it in the PR description.

## Fixing an existing answer

1. Find the question file in `docs/q/`
2. Edit the markdown content
3. Open a pull request with a brief explanation of what was wrong

## Translating to Spanish

Question files in `docs/es/q/` mirror the English files in `docs/q/`. To translate:

1. Pick a file from `docs/es/q/` that still has English content
2. Translate the markdown body (keep code examples in English, translate surrounding text)
3. Open a pull request

UI translations live in `docs/.vitepress/theme/locales/es.json`.

## Running locally

```bash
pnpm install
pnpm dev
```

The site runs at `http://localhost:5173`. Changes to markdown files hot-reload automatically.

## Guidelines

- Keep answers concise and practical
- Always include at least one code example
- Use Vue 3 Composition API with `<script setup>` in examples
- Prefer TypeScript in code examples
- One question per file
