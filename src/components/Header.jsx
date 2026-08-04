import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import ViewOptionsToggle from './ViewOptionsToggle';
import LayoutTemplateToggle from './LayoutTemplateToggle';
import docsConfig from '../config/docsConfig';
import { SHORTCUT_SEARCH } from '../utils/shortcuts';

const rawBaseUrl = import.meta.env.BASE_URL || '/';
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

const docsName = docsConfig?.branding?.title || docsConfig?.name || 'Documentation';
const docsSubtitle = docsConfig?.branding?.subtitle || 'Developer Documentation';
const homePath = docsConfig?.branding?.homePath || '/introduction';
const configuredLogo = docsConfig?.branding?.logo || {};
const logoAlt = docsConfig?.branding?.logo?.alt || docsName;
const logoVariant = docsConfig?.branding?.logo?.variant || 'icon';
const showBrandText = docsConfig?.branding?.logo?.showText !== false;
const headerSearchPlaceholder = docsConfig?.ui?.header?.searchPlaceholder || 'Search docs';
const quickSearchLabel = docsConfig?.ui?.header?.quickSearchLabel || 'Quick Search';
const themeGalleryLabel = docsConfig?.ui?.header?.themeGalleryLabel || 'Theme Gallery';
const customHeaderActions = Array.isArray(docsConfig?.ui?.header?.customActions)
  ? docsConfig.ui.header.customActions
  : [];
const STANDARD_ACTION_SET = new Set(['theme', 'template', 'themeGallery', 'view']);
const DEFAULT_HEADER_ACTIONS = {
  order: ['search', 'theme', 'template', 'view', 'themeGallery', 'quickSearch'],
  hidden: [],
};

function getPreferredThemeMode() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

function getDocumentThemeMode() {
  if (typeof document === 'undefined') return getPreferredThemeMode();
  const mode = document.documentElement?.dataset?.docThemeMode;
  if (mode === 'dark' || mode === 'light') return mode;
  return getPreferredThemeMode();
}

function resolveLogoAsset(mode) {
  if (mode === 'dark') {
    return configuredLogo.dark || configuredLogo.src || configuredLogo.light || '';
  }
  return configuredLogo.light || configuredLogo.src || configuredLogo.dark || '';
}

export default function Header({
  tabs,
  activeTab,
  activeContext,
  versionOptions = [],
  localeOptions = [],
  onContextChange,
  onTabChange,
  onToggleSidebar,
  onSearchOpen,
  onOpenThemeGallery,
  themeId,
  onThemeChange,
  density,
  onDensityChange,
  readingMode,
  onReadingModeChange,
  codeContrast,
  onCodeContrastChange,
  performanceMode,
  onPerformanceModeChange,
  layoutTemplateId,
  onLayoutTemplateChange,
  showTopNav = true,
  dockEnabled = false,
  headerActions = DEFAULT_HEADER_ACTIONS,
}) {
  const location = useLocation();
  const [themeMode, setThemeMode] = React.useState(getDocumentThemeMode);
  const logoSrc = resolveAssetPath(resolveLogoAsset(themeMode));
  const actions = Array.isArray(headerActions.order) ? headerActions.order : DEFAULT_HEADER_ACTIONS.order;
  const hiddenActions = new Set(Array.isArray(headerActions.hidden) ? headerActions.hidden : []);
  const visibleActions = actions.filter((action) => !hiddenActions.has(action));
  const standardActions = dockEnabled ? [] : visibleActions.filter((action) => STANDARD_ACTION_SET.has(action));
  const regularActions = visibleActions.filter((action) => !STANDARD_ACTION_SET.has(action));
  const standardPrimaryActions = standardActions.filter((action) => action !== 'themeGallery');
  const hasThemeGalleryAction = standardActions.includes('themeGallery');
  const showVersionSelect = Array.isArray(versionOptions) && versionOptions.length > 1;
  const showLocaleSelect = Array.isArray(localeOptions) && localeOptions.length > 1;
  const showContextSwitchers = showVersionSelect || showLocaleSelect;

  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const root = document.documentElement;
    const syncThemeMode = () => setThemeMode(getDocumentThemeMode());
    const observer = new MutationObserver(syncThemeMode);
    observer.observe(root, { attributes: true, attributeFilter: ['data-doc-theme-mode'] });

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', syncThemeMode);
      return () => {
        observer.disconnect();
        mediaQuery.removeEventListener('change', syncThemeMode);
      };
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  function renderHeaderAction(action, { grouped = false } = {}) {
    if (hiddenActions.has(action)) return null;

    if (action === 'search') {
      return (
        <button
          key="search"
          type="button"
          onClick={onSearchOpen}
          className="hidden min-w-[280px] items-center justify-between rounded-xl border border-[var(--theme-border)]/80 bg-[var(--theme-bg)]/70 px-3 py-2 text-xs text-[var(--theme-muted)] shadow-sm transition hover:border-[var(--theme-accent)] hover:bg-[var(--theme-panel)] sm:flex"
        >
          <span className="inline-flex items-center gap-2">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span>{headerSearchPlaceholder}</span>
          </span>
          <span className="rounded-md border border-[var(--theme-border)] bg-[var(--theme-panel)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--theme-muted)]">{SHORTCUT_SEARCH.label}</span>
        </button>
      );
    }

    if (action === 'theme') {
      return <ThemeToggle key="theme" themeId={themeId} onThemeChange={onThemeChange} compact={grouped} />;
    }

    if (action === 'template') {
      return (
        <LayoutTemplateToggle
          key="template"
          layoutTemplateId={layoutTemplateId}
          onLayoutTemplateChange={onLayoutTemplateChange}
          compact={grouped}
        />
      );
    }

    if (action === 'view') {
      return (
        <ViewOptionsToggle
          key="view"
          density={density}
          onDensityChange={onDensityChange}
          readingMode={readingMode}
          onReadingModeChange={onReadingModeChange}
          codeContrast={codeContrast}
          onCodeContrastChange={onCodeContrastChange}
          performanceMode={performanceMode}
          onPerformanceModeChange={onPerformanceModeChange}
          compact={grouped}
        />
      );
    }

    if (action === 'themeGallery') {
      return (
        <button
          key="themeGallery"
          type="button"
          className={`${grouped ? 'inline-flex h-9 items-center rounded-lg px-2.5 text-sm' : 'hidden xl:inline-flex rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm'} text-[var(--theme-text)] transition-colors hover:border-[var(--theme-accent)] hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-accent)]`}
          onClick={onOpenThemeGallery}
        >
          {grouped && (
            <svg className="mr-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3l1.9 4.6L19 9.5l-4 3.3 1.2 5L12 15.4 7.8 17.8 9 12.8 5 9.5l5.1-1.9L12 3z" strokeLinejoin="round" />
            </svg>
          )}
          {themeGalleryLabel}
        </button>
      );
    }

    if (action === 'platform') return null;

    if (action === 'quickSearch') {
      return (
        <button
          key="quickSearch"
          type="button"
          className="rounded-xl bg-[var(--theme-text)] px-3 py-2 text-sm font-semibold text-[var(--theme-panel)] shadow-sm transition hover:brightness-105"
          onClick={onSearchOpen}
        >
          {quickSearchLabel}
        </button>
      );
    }

    if (action === 'customActions') {
      return customHeaderActions.map((item) => renderCustomHeaderAction(item));
    }

    if (action.startsWith('custom:')) {
      const customId = action.slice('custom:'.length);
      const customAction = customHeaderActions.find((item) => item?.id === customId);
      return customAction ? renderCustomHeaderAction(customAction) : null;
    }

    return null;
  }

  function renderCustomHeaderAction(action) {
    if (!action || typeof action !== 'object' || !action.id || !action.label) return null;
    const variant = action.variant === 'solid' ? 'solid' : 'outline';
    const showLabel = action.showLabel !== false;
    const hasLogo = Boolean(action.logoSrc);
    const className = variant === 'solid'
      ? 'hidden rounded-xl bg-[var(--theme-text)] px-3 py-2 text-sm font-semibold text-[var(--theme-panel)] shadow-sm transition hover:brightness-105 md:inline-flex'
      : 'hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-text)] transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] md:inline-flex';
    const logoOnlyClassName = 'hidden items-center justify-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] p-2 transition-colors hover:border-[var(--theme-accent)] hover:bg-[var(--theme-bg-soft)] md:inline-flex';
    const resolvedClassName = hasLogo && !showLabel ? logoOnlyClassName : className;
    const content = (
      <>
        {hasLogo && <img src={resolveAssetPath(action.logoSrc)} alt={action.logoAlt || action.label} className={`h-5 w-auto ${showLabel ? 'mr-2' : ''}`} />}
        {showLabel && action.label}
      </>
    );

    if (action.type === 'button') {
      return (
        <button
          key={`custom-${action.id}`}
          type="button"
          className={resolvedClassName}
          onClick={onSearchOpen}
          aria-label={action.label}
        >
          {content}
        </button>
      );
    }

    return (
      <a
        key={`custom-${action.id}`}
        href={action.href || '#'}
        target={action.target || '_self'}
        rel={action.rel || (action.target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={resolvedClassName}
        aria-label={action.label}
      >
        {content}
      </a>
    );
  }

  return (
    <header className="app-header fixed inset-x-0 top-0 z-50 border-b border-[var(--theme-border)]/50 bg-[var(--theme-panel)]/92 backdrop-blur-0 md:bg-[var(--theme-panel)]/84 md:backdrop-blur-xl">
      <div className="app-header-inner mx-auto flex h-15 w-full max-w-[1680px] items-center gap-2 px-3 sm:px-6">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)] lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        <Link
          to={{ pathname: homePath, search: location.search }}
          className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1 transition-colors hover:border-[var(--theme-border)]/80 hover:bg-[var(--theme-bg-soft)]/75"
          onClick={() => onTabChange(tabs[0]?.id || activeTab)}
        >
          {logoSrc && (
            <img
              src={logoSrc}
              alt={logoAlt}
              className={logoVariant === 'wordmark'
                ? 'h-9 w-auto max-w-[210px]'
                : 'h-8 w-8 rounded-lg ring-1 ring-[var(--theme-border)]'}
            />
          )}
          {showBrandText && (
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight">{docsName}</p>
              <p className="text-[11px] text-[var(--theme-muted)]">{docsSubtitle}</p>
            </div>
          )}
        </Link>

        {showTopNav && (
          <nav className="app-header-nav hidden items-center gap-1 rounded-xl border border-[var(--theme-border)]/80 bg-[var(--theme-bg)]/65 p-1 lg:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-text)]'
                    : 'text-[var(--theme-muted)] hover:bg-[var(--theme-bg-soft)] hover:text-[var(--theme-text)]'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {activeContext && showContextSwitchers && (
            <div className="hidden items-center gap-1.5 rounded-xl border border-[var(--theme-border)]/80 bg-[var(--theme-bg)]/70 px-1.5 py-1 md:flex">
              {showVersionSelect && (
                <>
                  <label className="sr-only" htmlFor="docline-version-select">Version</label>
                  <select
                    id="docline-version-select"
                    value={activeContext.version}
                    onChange={(event) => onContextChange?.(event.target.value, activeContext.locale)}
                    className="appearance-none rounded-lg border border-[var(--theme-border)]/90 bg-[var(--theme-panel)] px-2 py-1 text-xs font-medium text-[var(--theme-text)] shadow-sm outline-none transition-colors focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[color:var(--theme-accent-soft)]"
                  >
                    {versionOptions.map((version) => (
                      <option key={version.id} value={version.id}>{version.label}</option>
                    ))}
                  </select>
                </>
              )}

              {showLocaleSelect && (
                <>
                  <label className="sr-only" htmlFor="docline-locale-select">Language</label>
                  <select
                    id="docline-locale-select"
                    value={activeContext.locale}
                    onChange={(event) => onContextChange?.(activeContext.version, event.target.value)}
                    className="appearance-none rounded-lg border border-[var(--theme-border)]/90 bg-[var(--theme-panel)] px-2 py-1 text-xs font-medium text-[var(--theme-text)] shadow-sm outline-none transition-colors focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[color:var(--theme-accent-soft)]"
                  >
                    {localeOptions.map((locale) => (
                      <option key={locale.id} value={locale.id}>{locale.label}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}

          {regularActions.map((action) => renderHeaderAction(action))}
          {standardActions.length > 0 && (
            <div className="hidden items-center gap-1.5 rounded-xl border border-[var(--theme-border)]/80 bg-[var(--theme-panel)]/86 px-1.5 py-1 shadow-sm md:flex">
              <div className="flex items-center gap-1 rounded-lg border border-[var(--theme-border)]/75 bg-[var(--theme-bg)]/70 p-1">
                {standardPrimaryActions.map((action) => renderHeaderAction(action, { grouped: true }))}
              </div>
              {hasThemeGalleryAction && (
                <>
                  <span className="h-4 w-px bg-[var(--theme-border)]" aria-hidden="true" />
                  {renderHeaderAction('themeGallery', { grouped: true })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
