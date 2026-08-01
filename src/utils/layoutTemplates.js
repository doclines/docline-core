import docsConfig from '../config/docsConfig';

const FALLBACK_LAYOUT_TEMPLATES = [
  { id: 'atlas', label: 'Atlas', description: 'Balanced docs shell' },
  { id: 'slate', label: 'Slate', description: 'Dense technical cockpit' },
  { id: 'editorial', label: 'Editorial', description: 'Magazine-like reading flow' },
  { id: 'neon', label: 'Neon', description: 'High-contrast experimental' },
  { id: 'zen', label: 'Zen', description: 'Minimal distraction-free layout' },
  { id: 'panorama', label: 'Panorama', description: 'Wide dashboard shell' },
  { id: 'notebook', label: 'Notebook', description: 'Paper-like writing desk' },
  { id: 'ops-console', label: 'Ops Console', description: 'Compact monitor stack' },
];

function mergeLayoutTemplates() {
  const configured = Array.isArray(docsConfig?.layoutTemplates) ? docsConfig.layoutTemplates : [];
  if (configured.length === 0) return FALLBACK_LAYOUT_TEMPLATES;

  const byId = new Map();

  // Start with built-ins so they remain available.
  for (const template of FALLBACK_LAYOUT_TEMPLATES) {
    if (!template?.id) continue;
    byId.set(template.id, template);
  }

  // Overlay/extend from config; matching ids override built-ins.
  for (const template of configured) {
    if (!template?.id) continue;
    const existing = byId.get(template.id) || {};
    byId.set(template.id, { ...existing, ...template });
  }

  return Array.from(byId.values());
}

export const LAYOUT_TEMPLATES = mergeLayoutTemplates();

const DEFAULT_LAYOUT_SETTINGS = {
  showTopNav: true,
  showSidebar: true,
  showToc: true,
  sidebarWidth: 300,
  contentMaxWidth: 0,
  headerStyle: 'default',
  sidebarStyle: 'default',
  tocStyle: 'default',
  contentStyle: 'default',
  headerActions: {
    order: ['search', 'theme', 'template', 'view', 'themeGallery', 'quickSearch'],
    hidden: [],
  },
  sidebarActions: {
    order: ['search', 'status', 'repo', 'themeGallery'],
    hidden: ['status', 'repo', 'themeGallery'],
    hiddenDesktop: [],
    hiddenMobile: ['repo'],
  },
  recipe: {
    headerDensity: 'normal',
    sidebarVisual: 'default',
    cardRadius: 'md',
    shadowLevel: 'normal',
    spacingScale: 'normal',
    contentWidth: 'normal',
  },
};

const ALLOWED_HEADER_ACTIONS = new Set(['search', 'theme', 'template', 'view', 'themeGallery', 'platform', 'quickSearch', 'customActions']);
const ALLOWED_SIDEBAR_ACTIONS = new Set(['search', 'status', 'repo', 'platform', 'themeGallery']);
const ALLOWED_HEADER_STYLES = new Set(['default', 'floating', 'compact', 'dashed']);
const ALLOWED_SIDEBAR_STYLES = new Set(['default', 'rail', 'carded', 'dense']);
const ALLOWED_TOC_STYLES = new Set(['default', 'minimal', 'card']);
const ALLOWED_CONTENT_STYLES = new Set(['default', 'wide', 'reading', 'framed']);
const ALLOWED_HEADER_DENSITY = new Set(['compact', 'normal', 'relaxed']);
const ALLOWED_SIDEBAR_VISUAL = new Set(['default', 'soft', 'strong']);
const ALLOWED_CARD_RADIUS = new Set(['sm', 'md', 'lg', 'xl']);
const ALLOWED_SHADOW_LEVEL = new Set(['flat', 'normal', 'deep']);
const ALLOWED_SPACING_SCALE = new Set(['compact', 'normal', 'relaxed']);
const ALLOWED_CONTENT_WIDTH = new Set(['narrow', 'normal', 'wide']);

function normalizeHeaderActions(layoutActions) {
  const baseActions = docsConfig?.ui?.header?.actions || {};
  const baseOrder = Array.isArray(baseActions.order) ? baseActions.order : DEFAULT_LAYOUT_SETTINGS.headerActions.order;
  const baseHidden = Array.isArray(baseActions.hidden) ? baseActions.hidden : DEFAULT_LAYOUT_SETTINGS.headerActions.hidden;

  const templateOrder = Array.isArray(layoutActions?.order) ? layoutActions.order : [];
  const templateHidden = Array.isArray(layoutActions?.hidden) ? layoutActions.hidden : [];

  const isAllowedHeaderAction = (action) => ALLOWED_HEADER_ACTIONS.has(action) || String(action || '').startsWith('custom:');

  const mergedOrder = [...templateOrder, ...baseOrder]
    .filter((action, index, arr) => isAllowedHeaderAction(action) && arr.indexOf(action) === index);

  for (const action of DEFAULT_LAYOUT_SETTINGS.headerActions.order) {
    if (!mergedOrder.includes(action)) {
      mergedOrder.push(action);
    }
  }

  if (!mergedOrder.includes('template')) {
    mergedOrder.push('template');
  }

  const mergedHidden = [...baseHidden, ...templateHidden]
    .filter((action, index, arr) => isAllowedHeaderAction(action) && arr.indexOf(action) === index && action !== 'template');

  return {
    order: mergedOrder,
    hidden: mergedHidden,
  };
}

function normalizeSidebarActions(layoutActions) {
  const baseActions = docsConfig?.ui?.sidebar?.actions || {};
  const baseOrder = Array.isArray(baseActions.order) ? baseActions.order : DEFAULT_LAYOUT_SETTINGS.sidebarActions.order;
  const baseHidden = Array.isArray(baseActions.hidden) ? baseActions.hidden : DEFAULT_LAYOUT_SETTINGS.sidebarActions.hidden;
  const baseHiddenDesktop = Array.isArray(baseActions.hiddenDesktop)
    ? baseActions.hiddenDesktop
    : DEFAULT_LAYOUT_SETTINGS.sidebarActions.hiddenDesktop;
  const baseHiddenMobile = Array.isArray(baseActions.hiddenMobile)
    ? baseActions.hiddenMobile
    : DEFAULT_LAYOUT_SETTINGS.sidebarActions.hiddenMobile;

  const templateOrder = Array.isArray(layoutActions?.order) ? layoutActions.order : [];
  const templateHidden = Array.isArray(layoutActions?.hidden) ? layoutActions.hidden : [];
  const templateHiddenDesktop = Array.isArray(layoutActions?.hiddenDesktop) ? layoutActions.hiddenDesktop : [];
  const templateHiddenMobile = Array.isArray(layoutActions?.hiddenMobile) ? layoutActions.hiddenMobile : [];

  const mergedOrder = [...templateOrder, ...baseOrder]
    .filter((action, index, arr) => ALLOWED_SIDEBAR_ACTIONS.has(action) && arr.indexOf(action) === index);

  for (const action of DEFAULT_LAYOUT_SETTINGS.sidebarActions.order) {
    if (!mergedOrder.includes(action)) {
      mergedOrder.push(action);
    }
  }

  const mergedHidden = [...baseHidden, ...templateHidden]
    .filter((action, index, arr) => ALLOWED_SIDEBAR_ACTIONS.has(action) && arr.indexOf(action) === index);

  const mergedHiddenDesktop = [...baseHiddenDesktop, ...templateHiddenDesktop]
    .filter((action, index, arr) => ALLOWED_SIDEBAR_ACTIONS.has(action) && arr.indexOf(action) === index);

  const mergedHiddenMobile = [...baseHiddenMobile, ...templateHiddenMobile]
    .filter((action, index, arr) => ALLOWED_SIDEBAR_ACTIONS.has(action) && arr.indexOf(action) === index);

  return {
    order: mergedOrder,
    hidden: mergedHidden,
    hiddenDesktop: mergedHiddenDesktop,
    hiddenMobile: mergedHiddenMobile,
  };
}

function isKnownLayoutTemplate(templateId) {
  return LAYOUT_TEMPLATES.some((template) => template.id === templateId);
}

function normalizeRecipe(recipe = {}) {
  return {
    ...DEFAULT_LAYOUT_SETTINGS.recipe,
    headerDensity: ALLOWED_HEADER_DENSITY.has(recipe.headerDensity)
      ? recipe.headerDensity
      : DEFAULT_LAYOUT_SETTINGS.recipe.headerDensity,
    sidebarVisual: ALLOWED_SIDEBAR_VISUAL.has(recipe.sidebarVisual)
      ? recipe.sidebarVisual
      : DEFAULT_LAYOUT_SETTINGS.recipe.sidebarVisual,
    cardRadius: ALLOWED_CARD_RADIUS.has(recipe.cardRadius)
      ? recipe.cardRadius
      : DEFAULT_LAYOUT_SETTINGS.recipe.cardRadius,
    shadowLevel: ALLOWED_SHADOW_LEVEL.has(recipe.shadowLevel)
      ? recipe.shadowLevel
      : DEFAULT_LAYOUT_SETTINGS.recipe.shadowLevel,
    spacingScale: ALLOWED_SPACING_SCALE.has(recipe.spacingScale)
      ? recipe.spacingScale
      : DEFAULT_LAYOUT_SETTINGS.recipe.spacingScale,
    contentWidth: ALLOWED_CONTENT_WIDTH.has(recipe.contentWidth)
      ? recipe.contentWidth
      : DEFAULT_LAYOUT_SETTINGS.recipe.contentWidth,
  };
}

function mergeLayoutSettings(base, override) {
  if (!override || typeof override !== 'object') return base;

  const merged = {
    ...base,
    ...override,
    headerActions: normalizeHeaderActions(override.headerActions || base.headerActions),
    sidebarActions: normalizeSidebarActions(override.sidebarActions || base.sidebarActions),
    recipe: normalizeRecipe({ ...(base.recipe || {}), ...(override.recipe || {}) }),
  };

  const sidebarWidth = Number(merged.sidebarWidth);
  const contentMaxWidth = Number(merged.contentMaxWidth);
  merged.sidebarWidth = Number.isFinite(sidebarWidth) && sidebarWidth >= 220 && sidebarWidth <= 420
    ? sidebarWidth
    : DEFAULT_LAYOUT_SETTINGS.sidebarWidth;
  merged.contentMaxWidth = Number.isFinite(contentMaxWidth) && contentMaxWidth >= 620 && contentMaxWidth <= 1440
    ? contentMaxWidth
    : DEFAULT_LAYOUT_SETTINGS.contentMaxWidth;
  merged.headerStyle = ALLOWED_HEADER_STYLES.has(merged.headerStyle) ? merged.headerStyle : DEFAULT_LAYOUT_SETTINGS.headerStyle;
  merged.sidebarStyle = ALLOWED_SIDEBAR_STYLES.has(merged.sidebarStyle) ? merged.sidebarStyle : DEFAULT_LAYOUT_SETTINGS.sidebarStyle;
  merged.tocStyle = ALLOWED_TOC_STYLES.has(merged.tocStyle) ? merged.tocStyle : DEFAULT_LAYOUT_SETTINGS.tocStyle;
  merged.contentStyle = ALLOWED_CONTENT_STYLES.has(merged.contentStyle) ? merged.contentStyle : DEFAULT_LAYOUT_SETTINGS.contentStyle;
  merged.showTopNav = merged.showTopNav !== false;
  merged.showSidebar = merged.showSidebar !== false;
  merged.showToc = merged.showToc !== false;

  return merged;
}

function normalizePathPrefix(value) {
  return String(value || '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function matchesOverride(override, pageMeta = {}, contextKey) {
  if (!override || typeof override !== 'object') return false;

  if (override.context && override.context !== contextKey && override.context !== 'all') {
    return false;
  }

  const slug = String(pageMeta.slug || '').replace(/^\/+/, '');
  if (override.pathPrefix) {
    const prefix = normalizePathPrefix(override.pathPrefix);
    if (prefix && !slug.startsWith(prefix)) return false;
  }

  if (override.section) {
    if (String(pageMeta.section || '').toLowerCase() !== String(override.section).toLowerCase()) {
      return false;
    }
  }

  if (override.group) {
    if (String(pageMeta.groupName || '').toLowerCase() !== String(override.group).toLowerCase()) {
      return false;
    }
  }

  if (override.tabId) {
    if (String(pageMeta.tabId || '') !== String(override.tabId)) {
      return false;
    }
  }

  return true;
}

function getSectionOverrideList() {
  return Array.isArray(docsConfig?.sectionLayoutOverrides) ? docsConfig.sectionLayoutOverrides : [];
}

export function getEffectiveLayoutTemplateSettings(templateId, pageMeta = {}, contextKey = '') {
  let settings = getLayoutTemplateSettings(templateId);

  const overrides = getSectionOverrideList().filter((item) => matchesOverride(item, pageMeta, contextKey));
  for (const override of overrides) {
    settings = mergeLayoutSettings(settings, override.layout || {});
  }

  return settings;
}

export function getLayoutTemplateById(templateId) {
  return LAYOUT_TEMPLATES.find((template) => template.id === templateId) || LAYOUT_TEMPLATES[0];
}

export function getDefaultLayoutTemplateId() {
  return LAYOUT_TEMPLATES[0]?.id || 'atlas';
}

export function getInitialLayoutTemplateId() {
  const fallbackId = getDefaultLayoutTemplateId();
  const stored = localStorage.getItem('docs-layout-template');
  if (stored && isKnownLayoutTemplate(stored)) {
    return stored;
  }
  return fallbackId;
}

export function applyLayoutTemplate(templateId) {
  const selected = getLayoutTemplateById(templateId);
  const settings = getLayoutTemplateSettings(selected.id);

  document.documentElement.dataset.layoutTemplate = selected.id;
  document.documentElement.dataset.headerStyle = settings.headerStyle;
  document.documentElement.dataset.sidebarStyle = settings.sidebarStyle;
  document.documentElement.dataset.tocStyle = settings.tocStyle;
  document.documentElement.dataset.contentStyle = settings.contentStyle;
  document.documentElement.dataset.headerDensity = settings.recipe.headerDensity;
  document.documentElement.dataset.sidebarVisual = settings.recipe.sidebarVisual;
  document.documentElement.dataset.cardRadius = settings.recipe.cardRadius;
  document.documentElement.dataset.shadowLevel = settings.recipe.shadowLevel;
  document.documentElement.dataset.spacingScale = settings.recipe.spacingScale;
  document.documentElement.dataset.contentWidthMode = settings.recipe.contentWidth;

  localStorage.setItem('docs-layout-template', selected.id);
  return selected;
}

export function parseLayoutTemplateQuery(value) {
  if (!value) return null;
  return isKnownLayoutTemplate(value) ? value : null;
}

export function getLayoutTemplateSettings(templateId) {
  const selected = getLayoutTemplateById(templateId);
  const layout = selected?.layout || {};

  const base = {
    ...DEFAULT_LAYOUT_SETTINGS,
    ...layout,
    headerActions: normalizeHeaderActions(layout.headerActions || {}),
    sidebarActions: normalizeSidebarActions(layout.sidebarActions || {}),
    recipe: normalizeRecipe(layout.recipe || {}),
  };

  return mergeLayoutSettings(base, {});
}
