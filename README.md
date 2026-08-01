# docline

docline helps teams publish beautiful, structured documentation fast, with lower cost and full ownership.

Built for teams moving away from expensive paid tools, docline gives you a professional docs experience without platform lock-in.

[![npm version](https://img.shields.io/npm/v/create-docline?color=0b77d5)](https://www.npmjs.com/package/create-docline)
[![license](https://img.shields.io/github/license/doclines/docline-core)](https://github.com/doclines/docline-core/blob/main/LICENSE)
[![deploy](https://img.shields.io/github/actions/workflow/status/doclines/docline-core/deploy-github-pages.yml?branch=main&label=pages)](https://github.com/doclines/docline-core/actions/workflows/deploy-github-pages.yml)
[![themes](https://img.shields.io/badge/themes-13%2B-blue)](https://doclines.github.io/docline-core/index.html)

## Live Theme Previews

Animated theme tour:

[![Docline Theme Tour](public/readme/generated/docline-preview.gif)](https://doclines.github.io/docline-core/index.html)

Effects tour (theme + contrast + density + reading focus):

[![Docline Effects Tour](public/readme/generated/docline-effects.gif)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=night-owl&contrast=high&density=compact&reading=on)

<details>
<summary>Theme preview dropdown (12 themes)</summary>

| Ayu Light | Catppuccin Latte | GitHub Light |
| --- | --- | --- |
| [![Ayu Light](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=ayu-light)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=ayu-light) | [![Catppuccin Latte](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=catppuccin-latte)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=catppuccin-latte) | [![GitHub Light](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=github-light)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=github-light) |

| Solarized Light | Tokyo Night Storm | Dracula Pro |
| --- | --- | --- |
| [![Solarized Light](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=solarized-light)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=solarized-light) | [![Tokyo Night Storm](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=tokyo-night-storm)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=tokyo-night-storm) | [![Dracula Pro](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=dracula-pro)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=dracula-pro) |

| One Dark Pro | Night Owl | Solarized Dark |
| --- | --- | --- |
| [![One Dark Pro](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=one-dark-pro)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=one-dark-pro) | [![Night Owl](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=night-owl)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=night-owl) | [![Solarized Dark](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=solarized-dark)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=solarized-dark) |

| Material Ocean | Catppuccin Mocha | Gruvbox Dark |
| --- | --- | --- |
| [![Material Ocean](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=material-ocean)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=material-ocean) | [![Catppuccin Mocha](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=catppuccin-mocha)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=catppuccin-mocha) | [![Gruvbox Dark](https://image.thum.io/get/width/1200/noanimate/https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=gruvbox-dark)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=gruvbox-dark) |

</details>

Open live docs: https://doclines.github.io/docline-core/index.html


## Core Features

- Feature-first configuration for consistent documentation at scale
- Fast, reliable search across all pages
- Rich authoring experience with reusable content blocks
- Versioned and multilingual documentation support
- Portable output you can host anywhere
- Built-in quality checks for content health and accessibility

## Quick Start

```bash
npx create-docline@1.0.2 my-docs
cd my-docs
npx create-docline@1.0.2 dev
```

## Scaffold Options

- `--docs-mode standard` for single-context docs
- `--docs-mode versioned` for version + locale docs
- `--branding keep|remove` for attribution preference
- `--badge-style minimal|full` for branding style
- `--pm npm|pnpm|yarn|bun` for package manager selection
- `--no-install` to skip dependency installation

## Main Commands

- `npx create-docline@1.0.2 dev` start local preview
- `npx create-docline@1.0.2 validate` run docs/config validation
- `npx create-docline@1.0.2 broken-links` check internal links and anchors
- `npx create-docline@1.0.2 check` run validation + link checks
- `npx create-docline@1.0.2 a11y` run accessibility checks
- `npx create-docline@1.0.2 export` create distributable static package

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