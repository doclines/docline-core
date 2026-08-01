#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

const cwd = process.cwd();
const docsConfigPath = path.join(cwd, 'docs.json');

function parseArgs(argv) {
  const options = { context: '', url: '', slug: '', title: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--url') options.url = argv[++i] || '';
    else if (t === '--context') options.context = argv[++i] || '';
    else if (t === '--slug') options.slug = argv[++i] || '';
    else if (t === '--title') options.title = argv[++i] || '';
    else if (t.startsWith('--url=')) options.url = t.slice(6);
    else if (t.startsWith('--context=')) options.context = t.slice(10);
    else if (t.startsWith('--slug=')) options.slug = t.slice(7);
    else if (t.startsWith('--title=')) options.title = t.slice(8);
  }
  if (!options.url || !options.context || !options.slug) {
    console.error('Usage: node scripts/import-doc-page.mjs --url <https://...> --context <v1:en> --slug <path/to/page> [--title "Page title"]');
    process.exit(1);
  }
  options.slug = options.slug.replace(/^\/+|\/+$/g, '').replace(/\.(md|mdx)$/i, '');
  return options;
}

function findContext(config, key) {
  return (config?.contentMatrix?.entries || []).find((entry) => `${entry.version}:${entry.locale}` === key);
}

function inferTitle(document, fallback) {
  const h1 = document.querySelector('h1')?.textContent?.trim();
  if (h1) return h1;
  const title = document.querySelector('title')?.textContent?.trim();
  if (title) return title;
  return fallback || 'Imported Page';
}

function main() {
  if (!fs.existsSync(docsConfigPath)) {
    console.error('docs.json not found.');
    process.exit(1);
  }

  const { url, context, slug, title } = parseArgs(process.argv.slice(2));
  const config = JSON.parse(fs.readFileSync(docsConfigPath, 'utf-8'));
  const targetContext = findContext(config, context);

  if (!targetContext) {
    console.error(`Context not found: ${context}`);
    process.exit(1);
  }

  const root = targetContext.roots?.[0];
  if (!root) {
    console.error(`Context ${context} has no content roots.`);
    process.exit(1);
  }

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((html) => {
      const dom = new JSDOM(html);
      const { document } = dom.window;
      const main = document.querySelector('main') || document.body;

      const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
      const markdown = td.turndown(main.innerHTML).trim();
      const pageTitle = inferTitle(document, title || slug.split('/').pop());
      const frontmatter = `---\ntitle: ${JSON.stringify(pageTitle)}\ndescription: ${JSON.stringify(`Imported from ${url}`)}\n---\n\n`;

      const targetPath = path.join(cwd, root, `${slug}.mdx`);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, frontmatter + markdown + '\n', 'utf-8');

      const nav = targetContext.navigation || { tabs: [] };
      targetContext.navigation = nav;
      if (!Array.isArray(nav.tabs) || nav.tabs.length === 0) {
        nav.tabs = [{ tab: 'Imported', groups: [{ group: 'Imported Pages', pages: [] }] }];
      }
      const group = nav.tabs[0].groups?.[0] || (nav.tabs[0].groups = [{ group: 'Imported Pages', pages: [] }])[0];
      if (!group.pages.some((p) => (typeof p === 'string' ? p.replace(/\.(md|mdx)$/i, '') : p.path?.replace(/\.(md|mdx)$/i, '')) === slug)) {
        group.pages.push({ path: slug, title: pageTitle });
      }

      fs.writeFileSync(docsConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
      console.log(`[docline import] Imported ${url} into ${targetPath}`);
    })
    .catch((error) => {
      console.error('[docline import] Failed:', error.message || error);
      process.exit(1);
    });
}

main();
