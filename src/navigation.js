import docsConfig from './config/docsConfig';

function tabId(label) {
  return String(label || 'docs')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'docs';
}

function stripMarkdownExtension(path) {
  return String(path || '').replace(/\.(md|mdx)$/i, '');
}

function toTitleCase(token) {
  const acronyms = {
    aiga: 'AIGA',
    api: 'API',
    cli: 'CLI',
    mcp: 'MCP',
    llm: 'LLM',
    ui: 'UI',
    adrs: 'ADRs',
    faq: 'FAQ',
    faqs: 'FAQs',
    ag2: 'AG2',
    agui: 'AGUI',
    acp: 'ACP',
    a2a: 'A2A',
    scct: 'SCCT',
    vipo: 'VIPO',
    kpi: 'KPI',
    rc: 'RC',
    rbac: 'RBAC',
    sme: 'SME',
    openwebui: 'OpenWebUI',
  };

  const key = token.toLowerCase();
  if (acronyms[key]) return acronyms[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function inferPageTitle(pagePath, groupName) {
  const cleanPath = stripMarkdownExtension(pagePath);
  const parts = cleanPath.split('/').filter(Boolean);
  const leaf = parts[parts.length - 1] || '';

  if (leaf === 'index') {
    return groupName === 'Overview' ? 'Overview' : groupName;
  }

  return leaf
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(toTitleCase)
    .join(' ');
}

function normalizePage(page, groupName) {
  if (typeof page === 'string') {
    const path = stripMarkdownExtension(page);
    return {
      path,
      title: inferPageTitle(path, groupName),
    };
  }

  if (page && typeof page === 'object' && typeof page.path === 'string') {
    const path = stripMarkdownExtension(page.path);
    return {
      path,
      title: page.title || inferPageTitle(path, groupName),
    };
  }

  return null;
}

function normalizeGroup(group) {
  const groupName = group?.group || 'General';
  const pages = Array.isArray(group?.pages)
    ? group.pages.map((p) => normalizePage(p, groupName)).filter(Boolean)
    : [];

  return {
    group: groupName,
    pages,
  };
}

function normalizeTab(tab) {
  const label = tab?.tab || tab?.label || 'Docs';
  const groups = Array.isArray(tab?.groups)
    ? tab.groups.map(normalizeGroup).filter((g) => g.pages.length > 0)
    : [];

  return {
    id: tabId(label),
    label,
    groups,
  };
}

const rawTabs = docsConfig?.navigation?.tabs || [];

export const navigation = {
  tabs: rawTabs.map(normalizeTab).filter((t) => t.groups.length > 0),
};
