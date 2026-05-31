# VueWiki.dev

Vue.js interview questions with answers and code examples. Built with [VitePress](https://vitepress.dev/).

**[vuewiki.vercel.app](https://vuewiki.vercel.app)**

## Features

- 30 questions across beginner, intermediate, and advanced levels
- Filter by difficulty and topic tags
- Full-text search
- Dark/light mode
- i18n (English + Spanish)
- Syntax-highlighted code examples

## Development

```bash
pnpm install
pnpm dev
```

The site runs at `http://localhost:5173`.

## Build

```bash
pnpm build
pnpm preview
```

## Project structure

```text
docs/
  .vitepress/
    config.ts          # VitePress config (i18n, search, nav)
    theme/             # Custom theme (homepage, question layout, i18n)
  q/                   # English question markdown files
  es/q/                # Spanish question markdown files
  public/              # Static assets
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add questions, fix answers, or translate content.

## License

MIT
