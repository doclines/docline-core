import rootDocsConfig from '../../docs.json';
import defaultDocsConfig from './defaultDocsConfig';
import { validateDocsConfig } from './validateDocsConfig';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (!isObject(base)) return override;
  if (!isObject(override)) return override === undefined ? base : override;

  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    if (Array.isArray(value)) {
      result[key] = value;
    } else if (isObject(value)) {
      result[key] = deepMerge(isObject(baseValue) ? baseValue : {}, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function normalizeBranding(config) {
  const branding = config.branding || {};
  const legacyLogo = config.logo || {};

  return {
    ...branding,
    title: branding.title || config.name || 'Documentation',
    subtitle: branding.subtitle || config.description || 'Developer Documentation',
    homePath: branding.homePath || '/introduction',
    logo: {
      src: branding.logo?.src || legacyLogo.light || '/opensourcedocs-logo.svg',
      alt: branding.logo?.alt || branding.title || config.name || 'Documentation',
      variant: branding.logo?.variant || 'icon',
      showText: branding.logo?.showText !== false,
    },
  };
}

function normalizeContent(config) {
  const rawRoots = config?.content?.roots;
  const legacyRoot = config?.contentRoot;

  let roots = [];
  if (Array.isArray(rawRoots) && rawRoots.length > 0) {
    roots = rawRoots;
  } else if (typeof legacyRoot === 'string' && legacyRoot.trim()) {
    roots = [legacyRoot.trim()];
  } else {
    roots = ['docs', '.'];
  }

  const normalizedRoots = roots
    .map((root) => String(root || '').trim().replace(/^\/+|\/+$/g, ''))
    .filter((root, index, arr) => arr.indexOf(root) === index);

  if (!normalizedRoots.includes('')) {
    normalizedRoots.push('');
  }

  return {
    ...config.content,
    roots: normalizedRoots,
  };
}

const mergedConfig = deepMerge(defaultDocsConfig, rootDocsConfig);

const docsConfig = {
  ...mergedConfig,
  branding: normalizeBranding(mergedConfig),
  content: normalizeContent(mergedConfig),
};

validateDocsConfig(docsConfig);

export function getContentRoots() {
  return docsConfig.content.roots;
}

export default docsConfig;
