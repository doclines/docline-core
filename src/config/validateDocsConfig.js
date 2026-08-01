function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function warn(message) {
  // Keep warnings in development and build logs without throwing.
  console.warn(`[docs-config] ${message}`);
}

export function validateDocsConfig(config) {
  if (!isObject(config)) {
    warn('docs.json must export an object. Falling back to defaults where possible.');
    return;
  }

  if (!isObject(config.branding)) {
    warn('Missing branding object. Expected branding.title, branding.subtitle, branding.homePath.');
  }

  if (!isObject(config.navigation) || !Array.isArray(config.navigation.tabs)) {
    warn('navigation.tabs should be an array. Sidebar and top nav may be empty.');
  }

  if (!Array.isArray(config.themes) || config.themes.length === 0) {
    warn('themes should include at least one theme entry. Built-in fallback themes will be used.');
  }

  if (!Array.isArray(config.layoutTemplates) || config.layoutTemplates.length === 0) {
    warn('layoutTemplates is empty. Built-in fallback templates will be used.');
  }

  const roots = config?.content?.roots;
  if (roots !== undefined && !Array.isArray(roots)) {
    warn('content.roots should be an array of folder roots, e.g. ["docs", "."].');
  }

  if (Array.isArray(roots) && roots.length === 0) {
    warn('content.roots is empty. No docs will load unless roots are configured.');
  }

  const matrix = config?.contentMatrix;
  const contentMode = String(config?.contentMode || 'versioned').toLowerCase();
  if (matrix !== undefined && !isObject(matrix)) {
    warn('contentMatrix should be an object with versions/locales/entries.');
  }

  if (contentMode !== 'standard' && isObject(matrix) && (!Array.isArray(matrix.entries) || matrix.entries.length === 0)) {
    warn('contentMatrix.entries is empty. Falling back to single-context docs mode.');
  }
}
