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
  const logo = branding.logo || {};

  const logoSrc = logo.src || legacyLogo.light || legacyLogo.dark || '';
  const logoLight = logo.light || logo.src || legacyLogo.light || legacyLogo.dark || '';
  const logoDark = logo.dark || logo.src || legacyLogo.dark || legacyLogo.light || logoLight;

  return {
    ...branding,
    title: branding.title || config.name || 'Documentation',
    subtitle: branding.subtitle || config.description || 'Developer Documentation',
    homePath: branding.homePath || '/introduction',
    logo: {
      src: logoSrc,
      light: logoLight,
      dark: logoDark,
      alt: logo.alt || branding.title || config.name || 'Documentation',
      variant: logo.variant || 'icon',
      showText: logo.showText !== false,
    },
  };
}

function normalizeFavicon(config, normalizedBranding) {
  const rawFavicon = config?.favicon;

  if (typeof rawFavicon === 'string') {
    const value = rawFavicon.trim();
    return {
      light: value,
      dark: value,
    };
  }

  if (isObject(rawFavicon)) {
    const src = String(rawFavicon.src || '').trim();
    const light = String(rawFavicon.light || src || '').trim();
    const dark = String(rawFavicon.dark || src || light || '').trim();
    return {
      light,
      dark,
    };
  }

  return {
    light: normalizedBranding?.logo?.light || normalizedBranding?.logo?.src || '',
    dark: normalizedBranding?.logo?.dark || normalizedBranding?.logo?.src || '',
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
const normalizedBranding = normalizeBranding(mergedConfig);

const docsConfig = {
  ...mergedConfig,
  branding: normalizedBranding,
  favicon: normalizeFavicon(mergedConfig, normalizedBranding),
  content: normalizeContent(mergedConfig),
};

validateDocsConfig(docsConfig);

export function getContentRoots() {
  return docsConfig.content.roots;
}

export default docsConfig;
