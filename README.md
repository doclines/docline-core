# docline

docline helps teams publish beautiful, structured documentation fast, with lower cost and full ownership.

Built for teams moving away from expensive paid tools, docline gives you a professional docs experience without platform lock-in.


## Core Features

- Feature-first configuration for consistent documentation at scale
- Fast, reliable search across all pages
- Rich authoring experience with reusable content blocks
- Versioned and multilingual documentation support
- Portable output you can host anywhere
- Built-in quality checks for content health and accessibility

## Quick Start

```bash
npx create-docline@1.0.1 my-docs
cd my-docs
npx create-docline@1.0.1 dev
```

## Scaffold Options

- `--docs-mode standard` for single-context docs
- `--docs-mode versioned` for version + locale docs
- `--branding keep|remove` for attribution preference
- `--badge-style minimal|full` for branding style
- `--pm npm|pnpm|yarn|bun` for package manager selection
- `--no-install` to skip dependency installation

## Main Commands

- `npx create-docline@1.0.1 dev` start local preview
- `npx create-docline@1.0.1 validate` run docs/config validation
- `npx create-docline@1.0.1 broken-links` check internal links and anchors
- `npx create-docline@1.0.1 check` run validation + link checks
- `npx create-docline@1.0.1 a11y` run accessibility checks
- `npx create-docline@1.0.1 export` create distributable static package

## Deployment

docline output is deployment-ready and can be hosted on any modern static hosting platform.

## Repository

```bash
git clone https://github.com/doclines/docline-core
cd docline-core
npm install
npm run dev
```
## License
MIT


