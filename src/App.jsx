import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DocPage from './components/DocPage';
import SearchModal from './components/SearchModal';
import ThemeGallery from './components/ThemeGallery';
import ControlDock from './components/ControlDock';
import BrandBadge from './components/BrandBadge';
import { applyTheme, BUILTIN_THEMES, getInitialThemeId } from './utils/themes';
import { SHORTCUT_DENSITY, SHORTCUT_READING } from './utils/shortcuts';
import docsConfig from './config/docsConfig';
import {
  resolveContextFromSearch,
  getContextSearch,
  getNavigationForContext,
  getVersionOptions,
  getLocaleOptions,
  resolveContextByVersionLocale,
} from './content/doclineRuntime';
import {
  applyLayoutTemplate,
  getDefaultLayoutTemplateId,
  getEffectiveLayoutTemplateSettings,
  getInitialLayoutTemplateId,
  parseLayoutTemplateQuery,
} from './utils/layoutTemplates';
import { getPage } from './content/doclineRuntime';

const homePath = docsConfig?.branding?.homePath || '/introduction';

function getInitialDensity() {
  const stored = localStorage.getItem('docs-density');
  return stored === 'compact' ? 'compact' : 'comfortable';
}

function getInitialReadingFocus() {
  return localStorage.getItem('docs-reading-focus') === 'on';
}

function getInitialCodeContrast() {
  return localStorage.getItem('docs-code-contrast') === 'high' ? 'high' : 'normal';
}

function getInitialPerformanceMode() {
  return localStorage.getItem('docs-performance-mode') === 'on';
}

function parseBooleanQuery(value) {
  const normalized = String(value || '').toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes';
}

function toOnOff(value) {
  return value ? 'on' : 'off';
}

function buildSearchWithParams(currentSearch, nextParams) {
  const params = new URLSearchParams(currentSearch || '');
  Object.entries(nextParams).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

function isEditableElement(target) {
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeContext = resolveContextFromSearch(location.search);
  const contextKey = activeContext?.key || 'v1:en';
  const navigation = getNavigationForContext(contextKey);
  const versionOptions = getVersionOptions();
  const localeOptions = getLocaleOptions(activeContext?.version);

  const [activeTab, setActiveTab] = useState(navigation.tabs[0]?.id || 'docs');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeId, setThemeId] = useState(getInitialThemeId);
  const [layoutTemplateId, setLayoutTemplateId] = useState(getInitialLayoutTemplateId);
  const [density, setDensity] = useState(getInitialDensity);
  const [readingMode, setReadingMode] = useState(getInitialReadingFocus);
  const [codeContrast, setCodeContrast] = useState(getInitialCodeContrast);
  const [performanceMode, setPerformanceMode] = useState(getInitialPerformanceMode);
  const [readingModeSwitching, setReadingModeSwitching] = useState(false);
  const hasMountedReadingMode = useRef(false);

  const currentTab = navigation.tabs.find((t) => t.id === activeTab);
  const activePage = getPage(contextKey, location.pathname);
  const layoutSettings = getEffectiveLayoutTemplateSettings(layoutTemplateId, activePage || {}, contextKey);
  const dockConfig = docsConfig?.ui?.dock || {};
  const dockEnabled = dockConfig.enabled === true;
  const dockPosition = dockConfig.position || 'right';
  const showSidebar = !readingMode && layoutSettings.showSidebar;
  const showToc = !readingMode && layoutSettings.showToc;
  const defaultThemeId = BUILTIN_THEMES[0]?.id || 'ayu-light';
  const defaultLayoutTemplateId = getDefaultLayoutTemplateId();

  useEffect(() => {
    if (!activeContext) return;
    const targetSearch = getContextSearch(location.search, activeContext);
    if (targetSearch !== location.search) {
      navigate(`${location.pathname}${targetSearch}`, { replace: true });
    }
  }, [activeContext, location.pathname, location.search, navigate]);

  useEffect(() => {
    const firstTabId = navigation.tabs[0]?.id;
    if (!firstTabId) return;
    if (!navigation.tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(firstTabId);
    }
  }, [activeTab, navigation.tabs]);

  useEffect(() => {
    applyTheme(themeId, codeContrast);
  }, [themeId, codeContrast]);

  useEffect(() => {
    applyLayoutTemplate(layoutTemplateId);
  }, [layoutTemplateId]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.headerStyle = layoutSettings.headerStyle;
    root.dataset.sidebarStyle = layoutSettings.sidebarStyle;
    root.dataset.tocStyle = layoutSettings.tocStyle;
    root.dataset.contentStyle = layoutSettings.contentStyle;
    root.dataset.headerDensity = layoutSettings.recipe?.headerDensity || 'normal';
    root.dataset.sidebarVisual = layoutSettings.recipe?.sidebarVisual || 'default';
    root.dataset.cardRadius = layoutSettings.recipe?.cardRadius || 'md';
    root.dataset.shadowLevel = layoutSettings.recipe?.shadowLevel || 'normal';
    root.dataset.spacingScale = layoutSettings.recipe?.spacingScale || 'normal';
    root.dataset.contentWidthMode = layoutSettings.recipe?.contentWidth || 'normal';
  }, [layoutSettings]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem('docs-density', density);
  }, [density]);

  useEffect(() => {
    document.documentElement.dataset.readingFocus = readingMode ? 'on' : 'off';
    localStorage.setItem('docs-reading-focus', readingMode ? 'on' : 'off');
  }, [readingMode]);

  useEffect(() => {
    if (!hasMountedReadingMode.current) {
      hasMountedReadingMode.current = true;
      return;
    }

    setReadingModeSwitching(true);
    const timerId = window.setTimeout(() => {
      setReadingModeSwitching(false);
    }, 180);

    return () => window.clearTimeout(timerId);
  }, [readingMode]);

  useEffect(() => {
    document.documentElement.dataset.codeContrast = codeContrast;
    localStorage.setItem('docs-code-contrast', codeContrast);
  }, [codeContrast]);

  useEffect(() => {
    document.documentElement.dataset.performanceMode = performanceMode ? 'on' : 'off';
    localStorage.setItem('docs-performance-mode', performanceMode ? 'on' : 'off');
  }, [performanceMode]);

  // Allow direct-link overrides like ?reading=1&density=compact.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const readingParam = params.get('reading');
    const densityParam = params.get('density');
    const layoutParam = params.get('layout');
    const themeParam = params.get('theme');
    const contrastParam = params.get('contrast');
    const performanceParam = params.get('performance');

    if (readingParam !== null) {
      const readingFromQuery = parseBooleanQuery(readingParam);
      setReadingMode((current) => (current === readingFromQuery ? current : readingFromQuery));
    }

    if (densityParam === 'compact' || densityParam === 'comfortable') {
      setDensity((current) => (current === densityParam ? current : densityParam));
    }

    const layoutFromQuery = parseLayoutTemplateQuery(layoutParam);
    if (layoutFromQuery) {
      setLayoutTemplateId((current) => (current === layoutFromQuery ? current : layoutFromQuery));
    }

    if (themeParam) {
      setThemeId((current) => (current === themeParam ? current : themeParam));
    }

    if (contrastParam === 'high' || contrastParam === 'normal') {
      setCodeContrast((current) => (current === contrastParam ? current : contrastParam));
    }

    if (performanceParam !== null) {
      const perfFromQuery = parseBooleanQuery(performanceParam);
      setPerformanceMode((current) => (current === perfFromQuery ? current : perfFromQuery));
    }
  }, [location.search]);

  useEffect(() => {
    const nextSearch = buildSearchWithParams(location.search, {
      theme: themeId === defaultThemeId ? null : themeId,
      layout: layoutTemplateId === defaultLayoutTemplateId ? null : layoutTemplateId,
      density: density === 'comfortable' ? null : density,
      reading: readingMode ? 'on' : null,
      contrast: codeContrast === 'normal' ? null : codeContrast,
      performance: performanceMode ? 'on' : null,
    });
    if (nextSearch !== location.search) {
      navigate({ pathname: location.pathname, search: nextSearch }, { replace: true });
    }
  }, [
    themeId,
    layoutTemplateId,
    density,
    readingMode,
    codeContrast,
    performanceMode,
    defaultThemeId,
    defaultLayoutTemplateId,
    location.pathname,
    location.search,
    navigate,
  ]);

  function handleResetPreferences() {
    localStorage.removeItem('docs-theme');
    localStorage.removeItem('docs-layout-template');
    localStorage.removeItem('docs-density');
    localStorage.removeItem('docs-reading-focus');
    localStorage.removeItem('docs-code-contrast');
    localStorage.removeItem('docs-performance-mode');

    setThemeId(defaultThemeId);
    setLayoutTemplateId(defaultLayoutTemplateId);
    setDensity('comfortable');
    setReadingMode(false);
    setCodeContrast('normal');
    setPerformanceMode(false);

  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isEditableElement(event.target)) return;

      const densityUsesMeta = SHORTCUT_DENSITY.keys[0] === '⌘';
      const readingUsesMeta = SHORTCUT_READING.keys[0] === '⌘';

      const densityPrimaryHeld = densityUsesMeta ? event.metaKey : event.ctrlKey;
      const readingPrimaryHeld = readingUsesMeta ? event.metaKey : event.ctrlKey;

      if (densityPrimaryHeld && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setDensity((current) => (current === 'compact' ? 'comfortable' : 'compact'));
      }

      if (readingPrimaryHeld && event.shiftKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setReadingMode((current) => !current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative min-h-screen overflow-hidden bg-[var(--theme-bg)] text-[var(--theme-text)] transition-colors duration-200 ${readingModeSwitching ? 'reading-switching' : ''}`}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_10%,var(--theme-aurora-a),transparent_36%),radial-gradient(circle_at_92%_0%,var(--theme-aurora-b),transparent_42%),linear-gradient(180deg,var(--theme-bg),var(--theme-bg-soft))]" />
      <Header
        tabs={navigation.tabs}
        activeTab={activeTab}
        activeContext={activeContext}
        versionOptions={versionOptions}
        localeOptions={localeOptions}
        onContextChange={(nextVersion, nextLocale) => {
          const resolved = resolveContextByVersionLocale(nextVersion, nextLocale);
          if (!resolved) return;
          const nextSearch = getContextSearch(location.search, resolved);
          navigate(`${location.pathname}${nextSearch}`, { replace: true });
        }}
        onTabChange={(id) => {
          setActiveTab(id);
          setSidebarOpen(false);
          const tab = navigation.tabs.find((t) => t.id === id);
          const firstPage = tab?.groups?.[0]?.pages?.[0]?.path;
            if (firstPage) navigate({ pathname: `/${firstPage}`, search: location.search });
        }}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSearchOpen={() => setSearchOpen(true)}
        onOpenThemeGallery={() => navigate('/theme-gallery')}
        themeId={themeId}
        onThemeChange={setThemeId}
        density={density}
        onDensityChange={setDensity}
        readingMode={readingMode}
        onReadingModeChange={setReadingMode}
        codeContrast={codeContrast}
        onCodeContrastChange={setCodeContrast}
        performanceMode={performanceMode}
        onPerformanceModeChange={setPerformanceMode}
        layoutTemplateId={layoutTemplateId}
        onLayoutTemplateChange={setLayoutTemplateId}
        showTopNav={layoutSettings.showTopNav}
        dockEnabled={dockEnabled}
        headerActions={layoutSettings.headerActions}
      />
      <main className={`app-main-layout relative mx-auto flex h-screen w-full max-w-[1680px] gap-5 px-3 pb-4 pt-[4.6rem] sm:px-6 ${readingMode ? 'justify-center' : ''}`} aria-label="Documentation content">
        {showSidebar && <div className="hidden lg:block" style={{ width: `${layoutSettings.sidebarWidth}px` }}>
          <Sidebar
            groups={currentTab?.groups || []}
            onSearchOpen={() => setSearchOpen(true)}
            onOpenThemeGallery={() => navigate('/theme-gallery')}
            sidebarActions={layoutSettings.sidebarActions}
            showBranding
          />
        </div>}

        <div
          className={`app-content content min-w-0 flex-1 overflow-y-auto rounded-3xl border border-[var(--theme-border)]/60 bg-[var(--theme-panel)]/90 shadow-panel ${readingMode ? 'max-w-4xl p-6 sm:p-10 backdrop-blur-0' : 'p-4 sm:p-8 backdrop-blur-0 md:backdrop-blur-md'}`}
          style={layoutSettings.contentMaxWidth > 0 && !readingMode ? { maxWidth: `${layoutSettings.contentMaxWidth}px`, marginLeft: 'auto', marginRight: 'auto' } : undefined}
        >
          <Routes>
            <Route path="/" element={<Navigate to={{ pathname: homePath, search: location.search }} replace />} />
            <Route
              path="/theme-gallery"
              element={<ThemeGallery themes={BUILTIN_THEMES} activeThemeId={themeId} onApplyTheme={setThemeId} />}
            />
            <Route path="*" element={<DocPage key={`${location.pathname}-${contextKey}`} onTabChange={setActiveTab} readingMode={readingMode} showToc={showToc} contextKey={contextKey} />} />
          </Routes>
        </div>

        {sidebarOpen && showSidebar && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-30 bg-black/45 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {showSidebar && (
          <div
            className={`fixed inset-y-0 left-0 z-40 transform border-r border-[var(--theme-border)] bg-[var(--theme-sidebar)] p-4 shadow-2xl transition-transform duration-300 lg:hidden ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ width: `${Math.min(layoutSettings.sidebarWidth + 20, 380)}px` }}
          >
            <Sidebar
              groups={currentTab?.groups || []}
              isMobile
              onClose={() => setSidebarOpen(false)}
              onSearchOpen={() => setSearchOpen(true)}
              onOpenThemeGallery={() => navigate('/theme-gallery')}
              sidebarActions={layoutSettings.sidebarActions}
              showBranding={false}
            />
          </div>
        )}
      </main>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen((open) => !open)}
        onNavigate={(tabId) => setActiveTab(tabId)}
        contextKey={contextKey}
      />

      {dockEnabled && (
        <aside aria-label="Quick controls">
          <ControlDock
            position={dockPosition}
            themeId={themeId}
            onThemeChange={setThemeId}
            layoutTemplateId={layoutTemplateId}
            onLayoutTemplateChange={setLayoutTemplateId}
            density={density}
            onDensityChange={setDensity}
            readingMode={readingMode}
            onReadingModeChange={setReadingMode}
            codeContrast={codeContrast}
            onCodeContrastChange={setCodeContrast}
            performanceMode={performanceMode}
            onPerformanceModeChange={setPerformanceMode}
            onResetPreferences={handleResetPreferences}
            onOpenThemeGallery={() => navigate('/theme-gallery')}
          />
        </aside>
      )}

      {!showSidebar && <BrandBadge dockEnabled={dockEnabled} dockPosition={dockPosition} mode="fixed" />}
    </div>
  );
}
