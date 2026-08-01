import docsConfig from '../config/docsConfig';
import generatedContent from '../generated/docline-content.json';

function normalizeSlug(pathname) {
  return String(pathname || '')
    .replace(/^\/+/, '')
    .replace(/\.(md|mdx)$/i, '')
    .replace(/\/+$/, '');
}

function getDataset() {
  return generatedContent;
}

function getAllContexts() {
  return Array.isArray(generatedContent?.contexts) ? generatedContent.contexts : [];
}

function getContextByKey(contextKey) {
  return getAllContexts().find((item) => item.key === contextKey) || null;
}

function getDefaultContextKey() {
  const configDefaultVersion = docsConfig?.contentMatrix?.defaultVersion;
  const configDefaultLocale = docsConfig?.contentMatrix?.defaultLocale;
  const fromConfig = configDefaultVersion && configDefaultLocale
    ? `${configDefaultVersion}:${configDefaultLocale}`
    : null;

  const contexts = getAllContexts();
  if (fromConfig && contexts.some((ctx) => ctx.key === fromConfig)) return fromConfig;
  if (generatedContent?.defaultContextKey && contexts.some((ctx) => ctx.key === generatedContent.defaultContextKey)) {
    return generatedContent.defaultContextKey;
  }
  return contexts[0]?.key || 'default';
}

function hasContextSwitcher() {
  const contexts = getAllContexts();
  if (contexts.length <= 1) return false;

  const versions = new Set(contexts.map((ctx) => String(ctx.version || '')).filter(Boolean));
  const locales = new Set(contexts.map((ctx) => String(ctx.locale || '')).filter(Boolean));
  return versions.size > 1 || locales.size > 1;
}

function resolveContextFromSearch(search) {
  const params = new URLSearchParams(search || '');
  const requestedVersion = params.get('version');
  const requestedLocale = params.get('lang');

  const contexts = getAllContexts();
  if (requestedVersion && requestedLocale) {
    const key = `${requestedVersion}:${requestedLocale}`;
    const direct = contexts.find((ctx) => ctx.key === key);
    if (direct) return direct;
  }

  if (requestedVersion) {
    const byVersion = contexts.find((ctx) => ctx.version === requestedVersion);
    if (byVersion) return byVersion;
  }

  if (requestedLocale) {
    const byLocale = contexts.find((ctx) => ctx.locale === requestedLocale);
    if (byLocale) return byLocale;
  }

  return getContextByKey(getDefaultContextKey()) || null;
}

function getContextSearch(search, context) {
  if (!hasContextSwitcher()) {
    const params = new URLSearchParams(search || '');
    params.delete('version');
    params.delete('lang');
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  const params = new URLSearchParams(search || '');
  if (context?.version) params.set('version', context.version);
  else params.delete('version');
  if (context?.locale) params.set('lang', context.locale);
  else params.delete('lang');
  return `?${params.toString()}`;
}

function getNavigationForContext(contextKey) {
  const context = getContextByKey(contextKey);
  return context?.navigation || { tabs: [] };
}

function getOrderedPages(contextKey) {
  const navigation = getNavigationForContext(contextKey);
  return (navigation.tabs || []).flatMap((tab) =>
    (tab.groups || []).flatMap((group) =>
      (group.pages || []).map((page) => ({
        ...page,
        tabId: tab.id,
        tabLabel: tab.label,
        groupName: group.group,
      }))
    )
  );
}

function getPagesForContext(contextKey) {
  return generatedContent?.pages?.[contextKey] || {};
}

function getPage(contextKey, pathname) {
  const slug = normalizeSlug(pathname);
  const pages = getPagesForContext(contextKey);
  if (pages[slug]) return pages[slug];
  if (slug && pages[`${slug}/index`]) return pages[`${slug}/index`];
  if (!slug && pages.introduction) return pages.introduction;
  return null;
}

function getSearchEntries(contextKey) {
  return generatedContent?.searchIndex?.[contextKey] || [];
}

function getContextParts(contextKey) {
  const [version = '', locale = ''] = String(contextKey || '').split(':');
  return { version, locale };
}

function getPageBlocks(contextKey, slug) {
  const normalizedSlug = normalizeSlug(slug);
  const configured = docsConfig?.pageBlocks;
  if (!configured || typeof configured !== 'object') return [];

  const fromContext = Array.isArray(configured[contextKey]?.[normalizedSlug])
    ? configured[contextKey][normalizedSlug]
    : [];
  const fromGlobal = Array.isArray(configured.global?.[normalizedSlug])
    ? configured.global[normalizedSlug]
    : [];

  return [...fromGlobal, ...fromContext];
}

function resolvePageForVersion(version, locale, slug) {
  const key = `${version}:${locale}`;
  const pages = getPagesForContext(key);
  const normalized = normalizeSlug(slug);
  return pages[normalized] || pages[`${normalized}/index`] || null;
}

function getAvailableVersionsForSlug(locale, slug) {
  const contexts = getAllContexts().filter((ctx) => !locale || ctx.locale === locale);
  return contexts
    .filter((ctx) => Boolean(resolvePageForVersion(ctx.version, ctx.locale, slug)))
    .map((ctx) => ({
      key: ctx.key,
      version: ctx.version,
      versionLabel: ctx.versionLabel || ctx.version,
      locale: ctx.locale,
      localeLabel: ctx.localeLabel || ctx.locale,
    }));
}

function lcsDiff(oldLines, newLines) {
  const aLen = oldLines.length;
  const bLen = newLines.length;
  const dp = Array.from({ length: aLen + 1 }, () => Array(bLen + 1).fill(0));

  for (let i = aLen - 1; i >= 0; i -= 1) {
    for (let j = bLen - 1; j >= 0; j -= 1) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result = [];
  let i = 0;
  let j = 0;
  while (i < aLen && j < bLen) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: 'same', text: oldLines[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'removed', text: oldLines[i] });
      i += 1;
    } else {
      result.push({ type: 'added', text: newLines[j] });
      j += 1;
    }
  }

  while (i < aLen) {
    result.push({ type: 'removed', text: oldLines[i] });
    i += 1;
  }
  while (j < bLen) {
    result.push({ type: 'added', text: newLines[j] });
    j += 1;
  }

  return result;
}

function textToDiffLines(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractAutoBreakingChanges(diffRows) {
  const pattern = /(breaking|deprecated|removed|no longer|drop|renam)/i;
  return diffRows
    .filter((row) => row.type === 'removed' || row.type === 'added')
    .filter((row) => pattern.test(row.text))
    .slice(0, 8)
    .map((row) => `${row.type === 'removed' ? 'Removed' : 'Added'}: ${row.text}`);
}

function getConfiguredBreakingChanges(version) {
  const list = Array.isArray(docsConfig?.releases?.breakingChanges)
    ? docsConfig.releases.breakingChanges
    : [];
  const matched = list.find((item) => String(item.version || '') === String(version || ''));
  return Array.isArray(matched?.items) ? matched.items : [];
}

function comparePageAcrossVersions(contextKey, slug, targetVersion) {
  const { version: currentVersion, locale } = getContextParts(contextKey);
  const target = resolvePageForVersion(targetVersion, locale, slug);
  const current = resolvePageForVersion(currentVersion, locale, slug);
  if (!current || !target) return null;

  const oldLines = textToDiffLines(current.plainText || '');
  const newLines = textToDiffLines(target.plainText || '');
  const rows = lcsDiff(oldLines, newLines);
  const changedRows = rows.filter((row) => row.type !== 'same');

  return {
    currentVersion,
    targetVersion,
    locale,
    hasChanges: changedRows.length > 0,
    summary: {
      added: rows.filter((row) => row.type === 'added').length,
      removed: rows.filter((row) => row.type === 'removed').length,
      unchanged: rows.filter((row) => row.type === 'same').length,
    },
    rows: rows.slice(0, 220),
    breakingChanges: [
      ...getConfiguredBreakingChanges(targetVersion),
      ...extractAutoBreakingChanges(rows),
    ],
  };
}

function resolveRedirect(contextKey, pathname) {
  const slug = normalizeSlug(pathname);
  const redirects = Array.isArray(generatedContent?.redirects) ? generatedContent.redirects : [];
  const direct = redirects.find((item) => {
    const from = normalizeSlug(item?.from || '');
    const context = String(item?.context || 'all');
    return from === slug && (context === 'all' || context === contextKey);
  });

  if (!direct) return null;

  const to = String(direct.to || '');
  const target = to.startsWith('/') ? to : `/${normalizeSlug(to)}`;
  return {
    to: target,
    permanent: direct.permanent !== false,
  };
}

function getVersionOptions() {
  if (!hasContextSwitcher()) return [];
  const seen = new Set();
  const options = [];
  for (const ctx of getAllContexts()) {
    if (seen.has(ctx.version)) continue;
    seen.add(ctx.version);
    options.push({ id: ctx.version, label: ctx.versionLabel || ctx.version });
  }
  return options;
}

function getLocaleOptions(version) {
  if (!hasContextSwitcher()) return [];
  const seen = new Set();
  const options = [];
  for (const ctx of getAllContexts()) {
    if (version && ctx.version !== version) continue;
    if (seen.has(ctx.locale)) continue;
    seen.add(ctx.locale);
    options.push({ id: ctx.locale, label: ctx.localeLabel || ctx.locale });
  }
  return options;
}

function resolveContextByVersionLocale(version, locale) {
  const contexts = getAllContexts();
  if (!hasContextSwitcher()) return contexts[0] || null;
  return contexts.find((ctx) => ctx.version === version && ctx.locale === locale) || null;
}

export {
  getDataset,
  getAllContexts,
  getContextByKey,
  getDefaultContextKey,
  resolveContextFromSearch,
  getContextSearch,
  getNavigationForContext,
  getOrderedPages,
  getPagesForContext,
  getPage,
  getSearchEntries,
  getPageBlocks,
  getAvailableVersionsForSlug,
  comparePageAcrossVersions,
  resolveRedirect,
  getVersionOptions,
  getLocaleOptions,
  resolveContextByVersionLocale,
  hasContextSwitcher,
  normalizeSlug,
};
