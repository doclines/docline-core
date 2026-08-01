#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const generatedPath = path.join(cwd, 'src', 'generated', 'docline-content.json');
const docsConfigPath = path.join(cwd, 'docs.json');

const args = new Set(process.argv.slice(2));
const checkAnchors = args.has('--check-anchors');
const checkExternal = args.has('--check-external');

function normalizePathForLookup(pathname) {
  return String(pathname || '')
    .replace(/^\/+/, '')
    .replace(/\.(md|mdx)$/i, '')
    .replace(/\/+$/, '');
}

function resolveInternalHref(currentSlug, href) {
  const [rawPath, rawHash] = String(href).split('#');
  const hash = rawHash || '';
  const hrefPath = String(rawPath || '').trim();

  if (!hrefPath) {
    return { slug: currentSlug, hash };
  }

  if (hrefPath.startsWith('/')) {
    return { slug: normalizePathForLookup(hrefPath), hash };
  }

  const baseDir = path.posix.dirname(`/${currentSlug}`);
  const resolved = path.posix.normalize(path.posix.join(baseDir, hrefPath));
  return { slug: normalizePathForLookup(resolved), hash };
}

async function checkExternalLink(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!fs.existsSync(generatedPath)) {
    console.error('[docline broken-links] Missing generated dataset. Run npm run docs:compile first.');
    process.exit(1);
  }

  const dataset = JSON.parse(fs.readFileSync(generatedPath, 'utf-8'));
  const docsConfig = fs.existsSync(docsConfigPath)
    ? JSON.parse(fs.readFileSync(docsConfigPath, 'utf-8'))
    : {};
  const redirectMap = new Map();
  for (const item of docsConfig.redirects || []) {
    const key = normalizePathForLookup(item.from || '');
    const value = normalizePathForLookup(item.to || '');
    const context = String(item.context || 'all');
    if (!key || !value) continue;
    if (!redirectMap.has(context)) redirectMap.set(context, new Map());
    redirectMap.get(context).set(key, value);
  }
  const pagesByContext = dataset.pages || {};

  const errors = [];
  const externalUrls = new Set();

  for (const [contextKey, pagesMap] of Object.entries(pagesByContext)) {
    const pageEntries = Object.values(pagesMap || {});

    for (const page of pageEntries) {
      const html = String(page.html || '');
      const hrefRegex = /\shref="([^"]+)"/g;
      let match;
      while ((match = hrefRegex.exec(html)) !== null) {
        const href = match[1];
        if (!href || href.startsWith('mailto:') || href.startsWith('#')) continue;

        if (/^(https?:)?\/\//i.test(href)) {
          if (checkExternal) {
            externalUrls.add(href);
          }
          continue;
        }

        const { slug, hash } = resolveInternalHref(page.slug, href);
        let target = pagesMap[slug] || pagesMap[`${slug}/index`];
        if (!target) {
          const contextRedirects = redirectMap.get(contextKey) || new Map();
          const sharedRedirects = redirectMap.get('all') || new Map();
          const redirected = contextRedirects.get(slug) || sharedRedirects.get(slug);
          if (redirected) {
            target = pagesMap[redirected] || pagesMap[`${redirected}/index`];
          }
        }

        if (!target) {
          errors.push(`[${contextKey}] ${page.slug} -> ${href} (target not found)`);
          continue;
        }

        if (checkAnchors && hash) {
          const tocIds = new Set((target.toc || []).map((item) => item.id));
          if (!tocIds.has(hash)) {
            errors.push(`[${contextKey}] ${page.slug} -> ${href} (anchor '#${hash}' not found)`);
          }
        }
      }
    }
  }

  if (checkExternal && externalUrls.size > 0) {
    for (const url of externalUrls) {
      const ok = await checkExternalLink(url);
      if (!ok) {
        errors.push(`[external] ${url} is unreachable`);
      }
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[docline broken-links] error: ${error}`);
    }
    process.exit(1);
  }

  console.log('[docline broken-links] OK: no internal link issues found.');
  if (checkExternal) {
    console.log(`[docline broken-links] Checked ${externalUrls.size} external URL(s).`);
  }
}

main();
