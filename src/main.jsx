import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import docsConfig from './config/docsConfig';
import { applyTheme, getInitialThemeId } from './utils/themes';
import { applyLayoutTemplate, getInitialLayoutTemplateId } from './utils/layoutTemplates';
import './styles/global.css';

const rawBaseUrl = import.meta.env.BASE_URL || '/';
const routerBasename = rawBaseUrl === '/'
  ? '/'
  : `/${rawBaseUrl.replace(/^\/+|\/+$/g, '')}`;

function withBase(pathname) {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (rawBaseUrl === '/') return normalizedPath;
  return `${rawBaseUrl.replace(/\/$/, '')}${normalizedPath}`;
}

function resolveAssetPath(assetPath) {
  if (!assetPath) return '';
  if (/^(https?:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
    return assetPath;
  }
  return withBase(assetPath);
}

function getPreferredThemeMode() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function getDocumentThemeMode() {
  const mode = document.documentElement?.dataset?.docThemeMode;
  if (mode === 'dark' || mode === 'light') return mode;
  return getPreferredThemeMode();
}

function resolveThemeAsset(configuredAsset, mode) {
  if (typeof configuredAsset === 'string') {
    return configuredAsset;
  }

  if (configuredAsset && typeof configuredAsset === 'object' && !Array.isArray(configuredAsset)) {
    const src = configuredAsset.src || '';
    if (mode === 'dark') {
      return configuredAsset.dark || src || configuredAsset.light || '';
    }
    return configuredAsset.light || src || configuredAsset.dark || '';
  }

  return '';
}

function applyDocumentBranding() {
  const title = docsConfig?.branding?.title || docsConfig?.name || 'Documentation';

  document.title = title;

  let faviconEl = document.querySelector('link[rel="icon"]');
  if (!faviconEl) {
    faviconEl = document.createElement('link');
    faviconEl.setAttribute('rel', 'icon');
    document.head.appendChild(faviconEl);
  }

  const setFavicon = () => {
    const configuredFavicon = resolveThemeAsset(docsConfig?.favicon, getDocumentThemeMode());
    const faviconHref = resolveAssetPath(configuredFavicon);
    if (!faviconHref) return;

    const ext = (configuredFavicon.split('.').pop() || '').toLowerCase();
    const mimeType = ext === 'png'
      ? 'image/png'
      : ext === 'ico'
        ? 'image/x-icon'
        : ext === 'svg'
          ? 'image/svg+xml'
          : undefined;

    if (mimeType) {
      faviconEl.setAttribute('type', mimeType);
    }
    faviconEl.setAttribute('href', faviconHref);
  };

  setFavicon();

  const root = document.documentElement;
  const observer = new MutationObserver(() => setFavicon());
  observer.observe(root, { attributes: true, attributeFilter: ['data-doc-theme-mode'] });

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', setFavicon);
  }
}

function applyInitialVisualPreferences() {
  const initialThemeId = getInitialThemeId();
  const initialCodeContrast = localStorage.getItem('docs-code-contrast') === 'high' ? 'high' : 'normal';
  const initialLayoutTemplateId = getInitialLayoutTemplateId();
  const initialDensity = localStorage.getItem('docs-density') === 'compact' ? 'compact' : 'comfortable';
  const initialReadingFocus = localStorage.getItem('docs-reading-focus') === 'on';
  const initialPerformanceMode = localStorage.getItem('docs-performance-mode') === 'on';

  const root = document.documentElement;

  // Apply persisted theme before React mounts to avoid reload flash/reset.
  applyTheme(initialThemeId, initialCodeContrast);
  applyLayoutTemplate(initialLayoutTemplateId);

  root.dataset.density = initialDensity;
  root.dataset.readingFocus = initialReadingFocus ? 'on' : 'off';
  root.dataset.performanceMode = initialPerformanceMode ? 'on' : 'off';
}

applyInitialVisualPreferences();
applyDocumentBranding();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      basename={routerBasename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
