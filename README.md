<h1 style="display:flex; align-items:center; gap:10px;"><img src="https://unpkg.com/create-docline@latest/public/logos/dark.svg" alt="docline logo" width="34" style="vertical-align:middle;"/><span>docline</span></h1>

docline turns `.md` and `.mdx` into a beautiful, structured docs UI fast, with zero cost and full ownership.

Built for teams moving away from expensive paid tools, docline gives you a professional docs experience without platform lock-in.

[![npm version](https://img.shields.io/npm/v/create-docline?color=0b77d5)](https://www.npmjs.com/package/create-docline)
[![license](https://img.shields.io/github/license/doclines/docline-core)](https://github.com/doclines/docline-core/blob/main/LICENSE)
[![deploy](https://img.shields.io/github/actions/workflow/status/doclines/docline-core/deploy-github-pages.yml?branch=main&label=pages)](https://github.com/doclines/docline-core/actions/workflows/deploy-github-pages.yml)
[![themes](https://img.shields.io/badge/themes-13%2B-blue)](https://doclines.github.io/docline-core/index.html)

## Live Theme Previews

Animated theme tour:

[![Docline Theme Tour](https://unpkg.com/create-docline@latest/public/readme/generated/docline-preview.gif)](https://doclines.github.io/docline-core/index.html)

Effects tour (theme + contrast + density + reading focus):

[![Docline Effects Tour](https://unpkg.com/create-docline@latest/public/readme/generated/docline-desktop.png)](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=night-owl&contrast=high&density=compact&reading=on)

<details>
<summary>Theme preview dropdown (12 themes)</summary>

[Ayu Light](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=ayu-light) | [Catppuccin Latte](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=catppuccin-latte) | [GitHub Light](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=github-light)

[Solarized Light](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=solarized-light) | [Tokyo Night Storm](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=tokyo-night-storm) | [Dracula Pro](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=dracula-pro)

[One Dark Pro](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=one-dark-pro) | [Night Owl](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=night-owl) | [Solarized Dark](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=solarized-dark)

[Material Ocean](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=material-ocean) | [Catppuccin Mocha](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=catppuccin-mocha) | [Gruvbox Dark](https://doclines.github.io/docline-core/index.html?version=v1&lang=en&theme=gruvbox-dark)

</details>

Open live docs: https://doclines.github.io/docline-core



## Core Features

- Feature-first configuration for consistent documentation at scale
- Fast, reliable search across all pages
- Rich authoring experience with reusable content blocks
- Versioned and multilingual documentation support
- Portable output you can host anywhere
- Built-in quality checks for content health and accessibility

## Quick Start

```bash
npx create-docline@latest my-docs
cd my-docs
npx create-docline@latest dev
```

## Scaffold Options

- `--docs-mode standard` for single-context docs
- `--docs-mode versioned` for version + locale docs
- `--branding keep|remove` for attribution preference
- `--badge-style minimal|full` for branding style
- `--pm npm|pnpm|yarn|bun` for package manager selection
- `--no-install` to skip dependency installation

## Main Commands

- `npx create-docline@latest dev` start local preview
- `npx create-docline@latest validate` run docs/config validation
- `npx create-docline@latest broken-links` check internal links and anchors
- `npx create-docline@latest check` run validation + link checks
- `npx create-docline@latest a11y` run accessibility checks
- `npx create-docline@latest export` create distributable static package

## Setup Guide

1. Install and start

```bash
npx create-docline@latest my-docs
cd my-docs
npm install
npm run dev
```

2. Edit your main config

- Create `docs.json` in the project root if it does not exist, then update branding, theme, navigation, versions, and locales.
- Keep `content.roots` pointed to folders that contain your markdown/MDX docs.
- For versioned docs, define `contentMatrix.entries` with `version`, `locale`, `roots`, and `navigation`.

3. Add or update your docs pages

- Place content in your configured docs roots.
- Versioned mode example: `docs/v1/en/`, `docs/v1/es/`, `docs/v2/en/`.
- Standard mode example: `docs/` (single context, no locale folders).
- Add `.md` or `.mdx` pages.
- Register page paths in navigation so they appear in sidebar/top tabs.
- Versioned mode: update navigation inside each `contentMatrix.entries[].navigation` block.
- Standard mode: update top-level `navigation.tabs` in `docs.json`.

4. Validate and build

```bash
npm run validate
npm run build
```

5. How doc loading works

- `npm run docs:compile` scans configured roots and generates `src/generated/docline-content.json`.
- The app loads from that generated file at runtime for fast search/navigation.
- If a page is missing in UI, check: file path, `content.roots`, and `navigation`/`contentMatrix` entries.

## Branding Assets

Use theme-aware favicon icons and a single top-left wordmark logo in `docs.json`:

```json
{
	"favicon": {
		"light": "/logos/light.svg",
		"dark": "/logos/dark.svg"
	},
	"branding": {
		"logo": {
			"src": "/logos/wordmark.svg",
			"variant": "wordmark",
			"showText": false
		}
	}
}
```

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
Licensed under the [MIT License](https://github.com/doclines/docline-core/blob/main/LICENSE).