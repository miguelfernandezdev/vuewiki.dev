# VueWiki.dev

[![Deploy](https://img.shields.io/github/deployments/miguelfernandezdev/vuewiki.dev/production?label=vercel&logo=vercel)](https://vuewiki.dev)

Vue.js interview questions with answers and code examples. Built with [VitePress](https://vitepress.dev/).

**[vuewiki.dev](https://vuewiki.dev)**

## Features

- 170+ questions across beginner, intermediate, and advanced levels
- Filter by difficulty and topic tags
- Full-text search
- Dark/light mode
- i18n (English + Spanish, 10 more languages in progress)
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

## Community

- [GitHub Discussions](https://github.com/miguelfernandezdev/vuewiki.dev/discussions) for questions, ideas, and feedback
- [Issues](https://github.com/miguelfernandezdev/vuewiki.dev/issues) for bug reports and content improvements

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add questions, fix answers, or translate content.

## License

MIT
