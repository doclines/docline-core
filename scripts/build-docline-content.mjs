#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compile, run } from '@mdx-js/mdx';
import * as jsxRuntime from 'react/jsx-runtime';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import hljs from 'highlight.js';
import { JSDOM } from 'jsdom';

const cwd = process.cwd();
const docsConfigPath = path.join(cwd, 'docs.json');
const outputPath = path.join(cwd, 'src', 'generated', 'docline-content.json');
const assetsOutputRoot = path.join(cwd, 'public', 'docline-assets');

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\.(md|mdx)$/i, '')
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '');
}

function readConfig() {
  if (!fileExists(docsConfigPath)) {
    return {
      template: 'docline',
      name: 'Docline',
      content: { roots: ['docs'] },
      navigation: { tabs: [] },
    };
  }

  const raw = fs.readFileSync(docsConfigPath, 'utf-8');
  return JSON.parse(raw);
}

function normalizePageTitle(pagePath) {
  const leaf = pagePath.split('/').filter(Boolean).pop() || 'page';
  if (leaf === 'index') {
    const parent = pagePath.split('/').filter(Boolean).slice(-2, -1)[0];
    return parent ? parent.replace(/[-_]+/g, ' ') : 'Overview';
  }
  return leaf
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function resolveContexts(config) {
  const mode = String(config?.contentMode || 'versioned').toLowerCase();
  const matrix = config.contentMatrix;
  if (mode !== 'standard' && matrix && Array.isArray(matrix.entries) && matrix.entries.length > 0) {
    const defaultLocale = matrix.defaultLocale || matrix.locales?.[0]?.id || 'en';
    const defaultVersion = matrix.defaultVersion || matrix.versions?.[0]?.id || 'v1';

    const contexts = matrix.entries
      .map((entry) => {
        if (!entry || !entry.locale || !entry.version || !Array.isArray(entry.roots)) return null;
        const localeLabel = matrix.locales?.find((l) => l.id === entry.locale)?.label || entry.locale;
        const versionLabel = matrix.versions?.find((v) => v.id === entry.version)?.label || entry.version;
        const key = `${entry.version}:${entry.locale}`;
        return {
          key,
          locale: entry.locale,
          localeLabel,
          version: entry.version,
          versionLabel,
          label: entry.label || `${versionLabel} - ${localeLabel}`,
          roots: entry.roots,
          navigation: entry.navigation || config.navigation || { tabs: [] },
        };
      })
      .filter(Boolean);

    const defaultContextKey = `${defaultVersion}:${defaultLocale}`;
    const hasDefault = contexts.some((ctx) => ctx.key === defaultContextKey);

    return {
      contexts,
      defaultContextKey: hasDefault ? defaultContextKey : contexts[0]?.key,
    };
  }

  const roots = Array.isArray(config.content?.roots) && config.content.roots.length > 0
    ? config.content.roots
    : ['docs'];

  return {
    contexts: [
      {
        key: 'default',
        locale: '',
        localeLabel: '',
        version: '',
        versionLabel: '',
        label: 'Documentation',
        roots,
        navigation: config.navigation || { tabs: [] },
      },
    ],
    defaultContextKey: 'default',
  };
}

function normalizeNavigation(navigation) {
  const tabs = Array.isArray(navigation?.tabs) ? navigation.tabs : [];
  return {
    tabs: tabs
      .map((tab) => {
        const label = tab?.tab || tab?.label || 'Docs';
        const id = toSlug(label) || 'docs';
        const groups = Array.isArray(tab?.groups)
          ? tab.groups
              .map((group) => {
                const groupName = group?.group || 'General';
                const pages = Array.isArray(group?.pages)
                  ? group.pages
                      .map((page) => {
                        if (typeof page === 'string') {
                          const pagePath = toSlug(page);
                          if (!pagePath) return null;
                          return {
                            path: pagePath,
                            title: normalizePageTitle(pagePath),
                          };
                        }

                        if (page && typeof page === 'object' && typeof page.path === 'string') {
                          const pagePath = toSlug(page.path);
                          if (!pagePath) return null;
                          return {
                            path: pagePath,
                            title: page.title || normalizePageTitle(pagePath),
                          };
                        }

                        return null;
                      })
                      .filter(Boolean)
                  : [];

                if (pages.length === 0) return null;

                return {
                  group: groupName,
                  pages,
                };
              })
              .filter(Boolean)
          : [];

        if (groups.length === 0) return null;

        return {
          id,
          label,
          groups,
        };
      })
      .filter(Boolean),
  };
}

function flattenNavigation(navigation) {
  const tabs = navigation.tabs || [];
  const pages = [];

  for (const tab of tabs) {
    for (const group of tab.groups || []) {
      for (const page of group.pages || []) {
        pages.push({
          ...page,
          tabId: tab.id,
          tabLabel: tab.label,
          groupName: group.group,
        });
      }
    }
  }

  return pages;
}

function resolvePageFile(roots, pagePath) {
  const candidates = [];
  for (const root of roots) {
    const cleanRoot = String(root || '').replace(/^\/+|\/+$/g, '');
    const absoluteRoot = path.resolve(cwd, cleanRoot || '.');
    candidates.push(path.join(absoluteRoot, `${pagePath}.mdx`));
    candidates.push(path.join(absoluteRoot, `${pagePath}.md`));
    candidates.push(path.join(absoluteRoot, pagePath, 'index.mdx'));
    candidates.push(path.join(absoluteRoot, pagePath, 'index.md'));
  }

  for (const candidate of candidates) {
    if (fileExists(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function resolveSnippetsMap(config) {
  if (!config?.snippets || typeof config.snippets !== 'object') return {};
  return config.snippets;
}

function applyReusableContentReferences(source, snippets, maxDepth = 6) {
  let output = String(source || '');
  const used = new Set();
  const tokenRegex = /\{\{\s*snippet\s*:\s*([a-zA-Z0-9._-]+)\s*\}\}|::include\s+([a-zA-Z0-9._-]+)/g;

  for (let depth = 0; depth < maxDepth; depth += 1) {
    let changed = false;

    output = output.replace(tokenRegex, (full, keyA, keyB) => {
      const key = keyA || keyB;
      if (!key) return full;
      const replacement = snippets[key];
      if (typeof replacement !== 'string') return full;
      used.add(key);
      changed = true;
      return replacement;
    });

    if (!changed) {
      break;
    }
  }

  return {
    content: output,
    includesUsed: Array.from(used),
  };
}

function extractToc(html) {
  const headings = [];
  const regex = /<h([1-4])\s+[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1]);
    const id = match[2];
    const text = String(match[3]).replace(/<[^>]+>/g, '').trim();
    if (!text) continue;
    headings.push({ level, id, text });
  }

  return headings;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFencedCodeMeta(source) {
  const entries = [];
  const fenceRegex = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = fenceRegex.exec(String(source || ''))) !== null) {
    const rawHeader = String(match[1] || '').trim();
    let rest = rawHeader;

    if (rest && !rest.startsWith('{')) {
      const firstSpace = rest.search(/\s/);
      if (firstSpace >= 0) {
        rest = rest.slice(firstSpace).trim();
      } else {
        rest = '';
      }
    }

    const highlightMatch = rest.match(/\{\s*([\d,\-\s]+)\s*\}/);
    const highlightSpec = highlightMatch ? highlightMatch[1].replace(/\s+/g, '') : '';

    let fileName = rest.replace(/\{\s*[\d,\-\s]+\s*\}/g, '').trim();
    fileName = fileName.replace(/^['"`]|['"`]$/g, '').trim();

    entries.push({
      fileName: fileName || '',
      highlightSpec,
    });
  }

  return entries;
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

function encodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeLanguageName(lang) {
  const raw = String(lang || '').trim().toLowerCase();
  if (!raw) return '';

  const alias = {
    shell: 'bash',
    sh: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    md: 'markdown',
    mdx: 'markdown',
    tsx: 'typescript',
    jsx: 'javascript',
  };

  return alias[raw] || raw;
}

function highlightHtmlCodeBlocks(html) {
  const blockRegex = /<pre><code(?:\s+class="([^"]*)")?>([\s\S]*?)<\/code><\/pre>/gi;

  return String(html || '').replace(blockRegex, (fullMatch, className = '', codeHtml = '') => {
    const languageMatch = String(className).match(/(?:^|\s)(?:language|lang)-([a-zA-Z0-9_+-]+)/i);
    const requestedLanguage = normalizeLanguageName(languageMatch?.[1] || '');
    const rawCode = decodeHtmlEntities(codeHtml);

    let highlighted = null;
    let resolvedLanguage = requestedLanguage;

    try {
      if (requestedLanguage && hljs.getLanguage(requestedLanguage)) {
        highlighted = hljs.highlight(rawCode, {
          language: requestedLanguage,
          ignoreIllegals: true,
        });
      } else {
        highlighted = hljs.highlightAuto(rawCode);
      }
    } catch {
      highlighted = null;
    }

    if (!highlighted || !highlighted.value) {
      const fallback = encodeHtmlEntities(rawCode);
      const fallbackLang = requestedLanguage || 'plaintext';
      return `<pre><code class="hljs language-${fallbackLang}">${fallback}</code></pre>`;
    }

    resolvedLanguage = normalizeLanguageName(highlighted.language || requestedLanguage || 'plaintext');
    return `<pre><code class="hljs language-${resolvedLanguage}">${highlighted.value}</code></pre>`;
  });
}

function languageFromCodeElement(codeElement) {
  const className = codeElement?.getAttribute('class') || '';
  const match = className.match(/(?:^|\s)language-([a-zA-Z0-9_+-]+)/);
  return (match?.[1] || 'code').toUpperCase();
}

function createCopyButton(document) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-copy-btn';
  button.title = 'Copy';
  button.textContent = 'Copy';
  return button;
}

function parseHighlightSpec(spec, totalLines) {
  const target = new Set();
  const clean = String(spec || '').trim();
  if (!clean) return target;

  for (const part of clean.split(',')) {
    const token = part.trim();
    if (!token) continue;

    if (token.includes('-')) {
      const [rawStart, rawEnd] = token.split('-');
      const start = Number(rawStart);
      const end = Number(rawEnd);
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
      const from = Math.max(1, Math.min(start, end));
      const to = Math.min(totalLines, Math.max(start, end));
      for (let i = from; i <= to; i += 1) target.add(i);
      continue;
    }

    const line = Number(token);
    if (Number.isFinite(line) && line >= 1 && line <= totalLines) {
      target.add(line);
    }
  }

  return target;
}

function applyLineHighlights(preElement, codeElement, highlightSpec) {
  const spec = String(highlightSpec || '').trim();
  if (!spec) return;

  const lines = codeElement.innerHTML.split('\n');
  const highlightLines = parseHighlightSpec(spec, lines.length);
  if (highlightLines.size === 0) return;

  const wrapped = lines
    .map((line, index) => {
      const lineNo = index + 1;
      const classes = highlightLines.has(lineNo) ? 'code-line code-line-highlight' : 'code-line';
      return `<span class="${classes}">${line || ' '}</span>`;
    })
    .join('\n');

  codeElement.innerHTML = wrapped;
  codeElement.classList.add('has-code-lines');
  preElement.classList.add('has-code-lines');
}

function enhanceCodeUxHtml(html, codeMeta = []) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const { document } = dom.window;
  const preBlocks = Array.from(document.querySelectorAll('pre'));
  const preMeta = new Map();

  preBlocks.forEach((pre, index) => {
    const meta = codeMeta[index] || {};
    preMeta.set(pre, meta);

    const code = pre.querySelector('code');
    if (!code) return;
    applyLineHighlights(pre, code, meta.highlightSpec);
  });

  // Build tabs UI for <Tabs><Tab .../></Tabs> output.
  document.querySelectorAll('.tabs-container').forEach((container) => {
    const tabPanels = Array.from(container.children).filter((child) =>
      child.classList?.contains('tabs-panel')
    );

    tabPanels.forEach((panel) => {
      const onlyPre = panel.children.length === 1 && panel.firstElementChild?.tagName === 'PRE';
      if (onlyPre) {
        panel.classList.add('tabs-panel-code');
      }
    });

    if (tabPanels.length > 1 && !container.querySelector(':scope > .tabs-nav')) {
      const nav = document.createElement('div');
      nav.className = 'tabs-nav';

      tabPanels.forEach((panel, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `tabs-nav-btn${index === 0 ? ' active' : ''}`;
        button.dataset.index = String(index);
        button.textContent = panel.getAttribute('data-tab-title') || `Tab ${index + 1}`;
        nav.appendChild(button);

        panel.style.display = index === 0 ? 'block' : 'none';
      });

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'tabs-copy-btn';
      copyBtn.title = 'Copy';
      copyBtn.textContent = 'Copy';
      nav.appendChild(copyBtn);

      container.insertBefore(nav, container.firstChild);
    }
  });

  // Build code-group tabs/copy for <CodeGroup> output.
  document.querySelectorAll('.code-group').forEach((group) => {
    if (group.querySelector(':scope > .code-group-tabs')) return;

    const directPreBlocks = Array.from(group.children).filter((child) => child.tagName === 'PRE');
    if (directPreBlocks.length < 2) return;

    const tabs = document.createElement('div');
    tabs.className = 'code-group-tabs';

    directPreBlocks.forEach((pre, index) => {
      const code = pre.querySelector('code');
      const meta = preMeta.get(pre) || {};
      const label = meta.fileName || languageFromCodeElement(code);

      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = `code-group-tab${index === 0 ? ' active' : ''}`;
      tabBtn.dataset.index = String(index);
      tabBtn.textContent = label;
      tabs.appendChild(tabBtn);

      const panel = document.createElement('div');
      panel.className = 'code-group-panel';
      panel.style.display = index === 0 ? 'block' : 'none';
      panel.appendChild(pre);
      group.appendChild(panel);
    });

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'code-group-copy';
    copyBtn.title = 'Copy';
    copyBtn.textContent = 'Copy';
    tabs.appendChild(copyBtn);

    group.prepend(tabs);
  });

  // Add copy button wrappers for standalone code blocks.
  document.querySelectorAll('pre').forEach((pre) => {
    if (pre.parentElement?.classList?.contains('code-block-wrapper')) return;
    if (pre.parentElement?.classList?.contains('code-group-panel')) return;
    if (pre.parentElement?.classList?.contains('tabs-panel')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    const button = createCopyButton(document);
    const meta = preMeta.get(pre) || {};
    const code = pre.querySelector('code');

    const toolbar = document.createElement('div');
    toolbar.className = 'code-block-toolbar';

    if (meta.fileName) {
      const fileLabel = document.createElement('span');
      fileLabel.className = 'code-filename';
      fileLabel.textContent = meta.fileName;
      wrapper.classList.add('has-filename');
      toolbar.appendChild(fileLabel);
    } else if (code) {
      const langLabel = document.createElement('span');
      langLabel.className = 'code-language';
      langLabel.textContent = languageFromCodeElement(code);
      toolbar.appendChild(langLabel);
    }

    pre.parentNode.insertBefore(wrapper, pre);
    toolbar.appendChild(button);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(pre);
  });

  return document.body.innerHTML;
}

function safeAssetPath(contextKey, relativePath) {
  const cleanContext = contextKey.replace(/[^a-z0-9:-]/gi, '_');
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return path.posix.join(cleanContext, normalized);
}

function maybeCopyAsset(assetPath, currentFilePath, contextKey, roots) {
  if (!assetPath) return assetPath;
  if (/^(https?:)?\/\//i.test(assetPath) || assetPath.startsWith('data:') || assetPath.startsWith('#')) {
    return assetPath;
  }

  const candidatePaths = [];
  if (assetPath.startsWith('/')) {
    candidatePaths.push(path.resolve(cwd, assetPath.slice(1)));
  } else {
    candidatePaths.push(path.resolve(path.dirname(currentFilePath), assetPath));
  }

  for (const root of roots) {
    const absoluteRoot = path.resolve(cwd, String(root || '').replace(/^\/+|\/+$/g, '') || '.');
    candidatePaths.push(path.resolve(absoluteRoot, assetPath.replace(/^\/+/, '')));
  }

  const source = candidatePaths.find((candidate) => fileExists(candidate));
  if (!source || !fs.statSync(source).isFile()) {
    return assetPath;
  }

  let relativeFromRoot = path.basename(source);
  for (const root of roots) {
    const absoluteRoot = path.resolve(cwd, String(root || '').replace(/^\/+|\/+$/g, '') || '.');
    const rel = path.relative(absoluteRoot, source);
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
      relativeFromRoot = rel;
      break;
    }
  }

  const targetRel = safeAssetPath(contextKey, relativeFromRoot);
  const targetAbs = path.join(assetsOutputRoot, targetRel);
  ensureDir(path.dirname(targetAbs));
  fs.copyFileSync(source, targetAbs);

  return `/docline-assets/${targetRel.replace(/\\/g, '/')}`;
}

function resolveRelativeDocLink(href, currentPageSlug) {
  if (!href) return href;
  if (/^(https?:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('#')) return href;

  const [pathPart, hashPart] = href.split('#');
  const cleanPath = String(pathPart || '').trim();

  if (cleanPath.startsWith('/')) {
    const normalized = cleanPath.replace(/\.(md|mdx)$/i, '');
    return `${normalized}${hashPart ? `#${hashPart}` : ''}`;
  }

  const baseParts = currentPageSlug.split('/').slice(0, -1);
  const joined = path.posix.normalize(path.posix.join('/', ...baseParts, cleanPath));
  const normalized = joined.replace(/\.(md|mdx)$/i, '');
  return `${normalized}${hashPart ? `#${hashPart}` : ''}`;
}

function postProcessHtml(html, context, pageFilePath, codeMeta = []) {
  let out = highlightHtmlCodeBlocks(html);
  out = enhanceCodeUxHtml(out, codeMeta);

  out = out.replace(/\ssrc=("([^"]+)"|'([^']+)')/gi, (full, _quoted, dq, sq) => {
    const src = dq || sq || '';
    const copied = maybeCopyAsset(src, pageFilePath, context.key, context.roots);
    return ` src="${copied}"`;
  });

  out = out.replace(/\shref=("([^"]+)"|'([^']+)')/gi, (full, _quoted, dq, sq) => {
    const href = dq || sq || '';
    const nextHref = resolveRelativeDocLink(href, context.currentPageSlug);
    return ` href="${nextHref}"`;
  });

  return out;
}

function prebuiltComponents() {
  const Box = ({ children, className = '', ...props }) => (
    React.createElement('div', { className, ...props }, children)
  );

  const Callout = ({ tone = 'note', title, children }) => {
    const toneClass = tone === 'warning' ? 'callout-warning' : tone === 'tip' ? 'callout-tip' : 'callout-note';
    return React.createElement(
      'div',
      { className: `callout ${toneClass}` },
      title ? React.createElement('p', { style: { marginTop: 0, fontWeight: 700 } }, title) : null,
      children
    );
  };

  const Card = ({ title, href, children }) => {
    const inner = React.createElement(
      'div',
      { className: 'card' },
      title ? React.createElement('p', { style: { fontWeight: 700, marginBottom: '0.4rem' } }, title) : null,
      children ? React.createElement('p', null, children) : null
    );
    if (href) {
      return React.createElement('a', { href, style: { textDecoration: 'none', color: 'inherit' } }, inner);
    }
    return inner;
  };

  const CardGroup = ({ cols = 2, children }) => React.createElement(
    'div',
    { className: 'card-group', style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } },
    children
  );

  const Steps = ({ children }) => React.createElement('div', { className: 'steps' }, children);
  const Step = ({ title, children }) => React.createElement('div', { className: 'step' }, title ? React.createElement('p', { style: { fontWeight: 700, marginBottom: '0.4rem' } }, title) : null, children);

  const Accordion = ({ title, children }) => React.createElement(
    'details',
    { className: 'accordion' },
    React.createElement('summary', null, title || 'Details'),
    children
  );

  const Badge = ({ tone = 'neutral', children }) => React.createElement(
    'span',
    { className: `doc-badge ${tone !== 'neutral' ? `is-${tone}` : ''}`.trim() },
    children
  );

  const BadgeGroup = ({ children }) => React.createElement('div', { className: 'doc-badge-group' }, children);

  const Columns = ({ cols = 2, children }) => React.createElement(
    'div',
    { className: 'doc-columns', style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } },
    children
  );

  const Column = ({ children }) => React.createElement('div', { className: 'doc-column' }, children);

  const Frame = ({ caption, children }) => React.createElement(
    'figure',
    { className: 'frame' },
    children,
    caption ? React.createElement('figcaption', null, caption) : null
  );

  const Tabs = ({ children }) => React.createElement('div', { className: 'tabs-container' }, children);
  const Tab = ({ title, children }) => React.createElement('section', { className: 'tabs-panel', 'data-tab-title': title || '' }, children);
  const CodeGroup = ({ children }) => React.createElement('div', { className: 'code-group' }, children);

  const Endpoint = ({ method = 'GET', path: endpointPath = '/', children }) => React.createElement(
    'div',
    { className: 'endpoint-block' },
    React.createElement(
      'div',
      { className: 'endpoint-header', style: { display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' } },
      React.createElement('span', { className: 'doc-badge', style: { fontWeight: 700 } }, String(method).toUpperCase()),
      React.createElement('code', null, endpointPath)
    ),
    children
  );

  const ParamTable = ({ children }) => React.createElement('table', null,
    React.createElement('thead', null,
      React.createElement('tr', null,
        React.createElement('th', null, 'Name'),
        React.createElement('th', null, 'Type'),
        React.createElement('th', null, 'Required'),
        React.createElement('th', null, 'Description')
      )
    ),
    React.createElement('tbody', null, children)
  );

  const Param = ({ name = '', type = 'string', required = false, children }) => React.createElement(
    'tr',
    null,
    React.createElement('td', null, React.createElement('code', null, name)),
    React.createElement('td', null, React.createElement('code', null, type)),
    React.createElement('td', null, required ? 'yes' : 'no'),
    React.createElement('td', null, children)
  );

  const ResponseExample = ({ status = '200', title = 'Response', children }) => React.createElement(
    'div',
    { className: 'response-example' },
    React.createElement(
      'p',
      { style: { marginBottom: '0.5rem' } },
      React.createElement('strong', null, title),
      ' ',
      React.createElement('span', { className: 'doc-badge' }, status)
    ),
    React.createElement('pre', null, React.createElement('code', null, children))
  );

  return {
    Tip: (props) => React.createElement(Callout, { ...props, tone: 'tip' }),
    Note: (props) => React.createElement(Callout, { ...props, tone: 'note' }),
    Warning: (props) => React.createElement(Callout, { ...props, tone: 'warning' }),
    Callout,
    Card,
    CardGroup,
    Steps,
    Step,
    Accordion,
    Badge,
    BadgeGroup,
    Columns,
    Column,
    Frame,
    Tabs,
    Tab,
    CodeGroup,
    Endpoint,
    ParamTable,
    Param,
    ResponseExample,
    Box,
  };
}

async function compileMdxToHtml(source, filePath) {
  const compiled = await compile(source, {
    outputFormat: 'function-body',
    format: filePath.endsWith('.md') ? 'md' : 'mdx',
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    providerImportSource: '@mdx-js/react',
  });

  const module = await run(String(compiled), {
    ...jsxRuntime,
    useMDXComponents: () => prebuiltComponents(),
    baseUrl: import.meta.url,
  });

  const Content = module.default;
  const element = React.createElement(Content, { components: prebuiltComponents() });
  return renderToStaticMarkup(element);
}

async function build() {
  const config = readConfig();
  const { contexts, defaultContextKey } = resolveContexts(config);
  const snippets = resolveSnippetsMap(config);

  ensureDir(path.dirname(outputPath));
  ensureDir(assetsOutputRoot);

  const dataset = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    siteName: config?.branding?.title || config?.name || 'Docline',
    defaultContextKey,
    contexts: [],
    pages: {},
    searchIndex: {},
    redirects: Array.isArray(config.redirects)
      ? config.redirects.map((item) => ({
          from: String(item.from || ''),
          to: String(item.to || ''),
          context: String(item.context || 'all'),
          permanent: item.permanent !== false,
        }))
      : [],
  };

  for (const context of contexts) {
    const navigation = normalizeNavigation(context.navigation);
    const navPages = flattenNavigation(navigation);

    const pagesBySlug = {};
    const searchEntries = [];

    for (const page of navPages) {
      const pageFilePath = resolvePageFile(context.roots, page.path);
      if (!pageFilePath) {
        // Keep navigation entry even if file is missing for visibility.
        continue;
      }

      const raw = fs.readFileSync(pageFilePath, 'utf-8');
      const { data: frontmatter, content } = matter(raw);
      const withIncludes = applyReusableContentReferences(content, snippets);
      const codeMeta = extractFencedCodeMeta(withIncludes.content);
      const compiledHtml = await compileMdxToHtml(withIncludes.content, pageFilePath);

      const contextWithPage = {
        ...context,
        currentPageSlug: page.path,
      };

      const html = postProcessHtml(compiledHtml, contextWithPage, pageFilePath, codeMeta);
      const toc = extractToc(html);
      const title = frontmatter.title || page.title;
      const description = frontmatter.description || '';
      const plainText = stripHtml(`${title} ${description} ${html}`);
      const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
      const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
      const section = frontmatter.section || page.groupName || '';
      const stat = fs.statSync(pageFilePath);
      const sourceRelPath = path.relative(cwd, pageFilePath).replace(/\\/g, '/');
      const contentHash = crypto
        .createHash('sha256')
        .update(withIncludes.content)
        .digest('hex')
        .slice(0, 16);

      pagesBySlug[page.path] = {
        slug: page.path,
        title,
        description,
        html,
        toc,
        wordCount,
        readingMinutes,
        tabId: page.tabId,
        tabLabel: page.tabLabel,
        groupName: page.groupName,
        section,
        sourceFile: sourceRelPath,
        sourceUpdatedAt: stat.mtime.toISOString(),
        contentHash,
        includesUsed: withIncludes.includesUsed,
        frontmatter: {
          ...frontmatter,
        },
        plainText,
      };

      searchEntries.push({
        slug: page.path,
        title,
        description,
        tabId: page.tabId,
        tabLabel: page.tabLabel,
        groupName: page.groupName,
        text: plainText,
      });
    }

    dataset.contexts.push({
      key: context.key,
      locale: context.locale,
      localeLabel: context.localeLabel,
      version: context.version,
      versionLabel: context.versionLabel,
      label: context.label,
      navigation,
    });
    dataset.pages[context.key] = pagesBySlug;
    dataset.searchIndex[context.key] = searchEntries;
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf-8');
  console.log(`[docline] Generated static content dataset: ${path.relative(cwd, outputPath)}`);
  console.log(`[docline] Contexts: ${dataset.contexts.length}`);
}

build().catch((error) => {
  console.error('[docline] Failed to build static content dataset');
  console.error(error);
  process.exitCode = 1;
});
