import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ThemeToggle from './ThemeToggle';
import LayoutTemplateToggle from './LayoutTemplateToggle';
import ViewOptionsToggle from './ViewOptionsToggle';
import docsConfig from '../config/docsConfig';
import { BUILTIN_THEMES } from '../utils/themes';

const themeGalleryLabel = docsConfig?.ui?.header?.themeGalleryLabel || 'Theme Gallery';

function normalizeDockPosition(position) {
  const allowed = new Set(['left', 'right', 'top', 'bottom']);
  return allowed.has(position) ? position : 'right';
}

export default function ControlDock({
  position = 'right',
  themeId,
  onThemeChange,
  layoutTemplateId,
  onLayoutTemplateChange,
  density,
  onDensityChange,
  readingMode,
  onReadingModeChange,
  codeContrast,
  onCodeContrastChange,
  performanceMode,
  onPerformanceModeChange,
  onResetPreferences,
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryPlacement, setGalleryPlacement] = useState('up');
  const [galleryStyle, setGalleryStyle] = useState({});
  const galleryRef = useRef(null);
  const galleryPanelRef = useRef(null);
  const resolvedPosition = normalizeDockPosition(position);
  const isHorizontal = resolvedPosition === 'top' || resolvedPosition === 'bottom';
  const panelPlacement = {
    bottom: 'up',
    top: 'down',
    left: 'right',
    right: 'left',
  }[resolvedPosition] || 'up';

  useEffect(() => {
    setGalleryPlacement(panelPlacement);
  }, [panelPlacement]);

  const positionClass = {
    left: 'left-4 top-1/2 -translate-y-1/2',
    right: 'right-4 top-1/2 -translate-y-1/2',
    top: 'left-1/2 top-20 -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
  }[resolvedPosition];

  const panelPositionClass = {
    down: 'left-1/2 top-full mt-3 -translate-x-1/2',
    up: 'left-1/2 bottom-full mb-3 -translate-x-1/2',
    left: 'right-full top-1/2 mr-3 -translate-y-1/2',
    right: 'left-full top-1/2 ml-3 -translate-y-1/2',
  }[panelPlacement] || 'left-1/2 bottom-full mb-3 -translate-x-1/2';

  const activeTheme = useMemo(
    () => BUILTIN_THEMES.find((theme) => theme.id === themeId) || BUILTIN_THEMES[0],
    [themeId]
  );

  useEffect(() => {
    function onDocPointerDown(event) {
      const clickedTrigger = galleryRef.current?.contains(event.target);
      const clickedPanel = galleryPanelRef.current?.contains(event.target);
      if (!clickedTrigger && !clickedPanel) {
        setGalleryOpen(false);
      }
    }

    document.addEventListener('mousedown', onDocPointerDown);
    return () => document.removeEventListener('mousedown', onDocPointerDown);
  }, []);

  useEffect(() => {
    if (!galleryOpen || !galleryRef.current) return;

    const rect = galleryRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = galleryPanelRef.current?.offsetWidth || 252;
    const panelHeight = galleryPanelRef.current?.offsetHeight || 266;
    const margin = 16;

    let next = panelPlacement;
    if (next === 'up' && rect.top < panelHeight + margin) next = 'down';
    if (next === 'down' && viewportHeight - rect.bottom < panelHeight + margin) next = 'up';
    if (next === 'left' && rect.left < panelWidth + margin) next = 'right';
    if (next === 'right' && viewportWidth - rect.right < panelWidth + margin) next = 'left';

    setGalleryPlacement(next);
  }, [galleryOpen, panelPlacement]);

  useEffect(() => {
    if (!galleryOpen || !galleryRef.current) return;

    const defaultPanelWidth = 252;
    const defaultPanelHeight = 266;
    const margin = 12;
    const offset = 12;
    const clearance = 12;

    const updatePosition = () => {
      const rect = galleryRef.current.getBoundingClientRect();
      const panelWidth = galleryPanelRef.current?.offsetWidth || defaultPanelWidth;
      const panelHeight = galleryPanelRef.current?.offsetHeight || defaultPanelHeight;
      const dockRect = document.querySelector('aside[aria-label="Customization dock"]')?.getBoundingClientRect();
      const dockGap = 8;
      let left = rect.left + rect.width / 2 - panelWidth / 2;
      let top = rect.top - panelHeight - offset;

      if (galleryPlacement === 'down') {
        top = rect.bottom + offset;
      } else if (galleryPlacement === 'left') {
        left = rect.left - panelWidth - offset;
        top = rect.top + rect.height / 2 - panelHeight / 2;
      } else if (galleryPlacement === 'right') {
        left = rect.right + offset;
        top = rect.top + rect.height / 2 - panelHeight / 2;
      }

      left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

      const minTop = margin;
      const maxTop = window.innerHeight - panelHeight - margin;
      if (galleryPlacement === 'up') {
        const topCap = rect.top - panelHeight - clearance;
        top = Math.max(minTop, Math.min(top, Math.min(maxTop, topCap)));
        if (dockRect) {
          const dockCap = dockRect.top - panelHeight - dockGap;
          top = Math.min(top, dockCap);
          top = Math.max(minTop, top);
        }
      } else if (galleryPlacement === 'down') {
        const topFloor = rect.bottom + clearance;
        top = Math.max(Math.max(minTop, topFloor), Math.min(top, maxTop));
      } else {
        top = Math.max(minTop, Math.min(top, maxTop));
      }

      setGalleryStyle({ left: `${left}px`, top: `${top}px` });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [galleryOpen, galleryPlacement]);

  return (
    <aside
      className={`fixed z-[70] ${positionClass} max-md:bottom-3 max-md:left-1/2 max-md:right-auto max-md:top-auto max-md:-translate-x-1/2 max-md:translate-y-0`}
      aria-label="Customization dock"
    >
      <div className={`flex items-stretch gap-1 overflow-visible rounded-[22px] border border-white/25 bg-[linear-gradient(160deg,rgba(255,255,255,0.24),rgba(255,255,255,0.08))] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] ring-1 ring-white/25 backdrop-blur-2xl backdrop-saturate-200 ${isHorizontal ? 'flex-row' : 'flex-col'} max-md:w-[min(96vw,680px)] max-md:flex-row`}>
        <div className={`group relative z-0 overflow-visible rounded-xl bg-white/10 transition-all duration-220 ease-[cubic-bezier(0.22,0.72,0.2,1)] hover:z-20 hover:scale-[1.04] hover:bg-white/20 active:scale-[0.99] ${isHorizontal ? 'min-w-[170px] flex-1' : 'w-[210px]'} max-md:w-full max-md:flex-1`}>
          <ThemeToggle themeId={themeId} onThemeChange={onThemeChange} compact panelPlacement={panelPlacement} />
        </div>

        <div className={`group relative z-0 overflow-visible rounded-xl bg-white/10 transition-all duration-220 ease-[cubic-bezier(0.22,0.72,0.2,1)] hover:z-20 hover:scale-[1.04] hover:bg-white/20 active:scale-[0.99] ${isHorizontal ? 'min-w-[150px] flex-1' : 'w-[210px]'} max-md:w-full max-md:flex-1`}>
          <LayoutTemplateToggle
            layoutTemplateId={layoutTemplateId}
            onLayoutTemplateChange={onLayoutTemplateChange}
            compact
            panelPlacement={panelPlacement}
          />
        </div>

        <div className={`group relative z-0 overflow-visible rounded-xl bg-white/10 transition-all duration-220 ease-[cubic-bezier(0.22,0.72,0.2,1)] hover:z-20 hover:scale-[1.04] hover:bg-white/20 active:scale-[0.99] ${isHorizontal ? 'min-w-[150px] flex-1' : 'w-[210px]'} max-md:w-full max-md:flex-1`}>
          <ViewOptionsToggle
            density={density}
            onDensityChange={onDensityChange}
            readingMode={readingMode}
            onReadingModeChange={onReadingModeChange}
            codeContrast={codeContrast}
            onCodeContrastChange={onCodeContrastChange}
            performanceMode={performanceMode}
            onPerformanceModeChange={onPerformanceModeChange}
            compact
            panelPlacement={panelPlacement}
          />
        </div>

        <div ref={galleryRef} className={`group relative z-0 overflow-visible rounded-xl bg-white/10 transition-all duration-220 ease-[cubic-bezier(0.22,0.72,0.2,1)] hover:z-20 hover:scale-[1.04] hover:bg-white/20 active:scale-[0.99] ${isHorizontal ? 'min-w-[160px] flex-1' : 'w-[210px]'} max-md:w-full max-md:flex-1`}>
          <button
            type="button"
            className="inline-flex h-8 w-full items-center justify-start rounded-xl px-2 text-sm text-[var(--theme-text)] transition-all duration-200 hover:bg-white/20 hover:text-[var(--theme-accent)]"
            onClick={() => setGalleryOpen((open) => !open)}
            aria-expanded={galleryOpen}
            aria-label="Open theme gallery"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3l1.9 4.6L19 9.5l-4 3.3 1.2 5L12 15.4 7.8 17.8 9 12.8 5 9.5l5.1-1.9L12 3z" strokeLinejoin="round" />
            </svg>
            <span className="ml-1.5 max-w-28 overflow-hidden whitespace-nowrap max-md:max-w-none">
              {themeGalleryLabel}
            </span>
          </button>

          {galleryOpen && createPortal(
            <div ref={galleryPanelRef} style={galleryStyle} className="fixed z-[140] w-[252px] rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/96 p-2 text-[var(--theme-text)] shadow-[0_20px_48px_rgba(0,0,0,0.3)] ring-1 ring-white/20 backdrop-blur-2xl backdrop-saturate-200 animate-[section-rise_220ms_ease-out]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--theme-muted)]">{themeGalleryLabel}</p>
                <p className="text-[10px] text-[var(--theme-muted)]">{activeTheme.label}</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {BUILTIN_THEMES.map((theme) => {
                  const c = theme.colors;
                  const isActive = theme.id === activeTheme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      className={`rounded-xl border p-1.5 text-left transition-all ${
                        isActive
                          ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]/60'
                              : 'border-[var(--theme-border)] bg-[var(--theme-panel)] hover:border-[var(--theme-accent)]/50 hover:bg-[var(--theme-bg-soft)] hover:ring-1 hover:ring-[var(--theme-border)]'
                      }`}
                      onClick={() => {
                        onThemeChange(theme.id);
                        setGalleryOpen(false);
                      }}
                    >
                      <div className="mb-1.5 flex gap-1">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c['--theme-accent'] }} />
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c['--theme-text'] }} />
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c['--theme-border'] }} />
                      </div>
                      <p className="truncate text-[10px] font-medium text-[var(--theme-text)]">{theme.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}
        </div>

        <div className={`group relative z-0 overflow-visible rounded-xl bg-white/10 transition-all duration-220 ease-[cubic-bezier(0.22,0.72,0.2,1)] hover:z-20 hover:scale-[1.04] hover:bg-white/20 active:scale-[0.99] ${isHorizontal ? 'min-w-[130px] flex-1' : 'w-[210px]'} max-md:w-full max-md:flex-1`}>
          <button
            type="button"
            className="inline-flex h-8 w-full items-center justify-start rounded-xl px-2 text-sm text-[var(--theme-text)] transition-all duration-200 hover:bg-white/20 hover:text-[var(--theme-accent)]"
            onClick={() => onResetPreferences?.()}
            aria-label="Reset preferences"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.34-5.66" strokeLinecap="round" />
              <path d="M20 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="ml-1.5 max-w-28 overflow-hidden whitespace-nowrap max-md:max-w-none">
              Reset
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
