import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SHORTCUT_DENSITY, SHORTCUT_READING } from '../utils/shortcuts';
import docsConfig from '../config/docsConfig';

const viewButtonLabel = docsConfig?.ui?.view?.buttonLabel || 'View';
const densityTitle = docsConfig?.ui?.view?.densityTitle || 'Density';
const comfortableLabel = docsConfig?.ui?.view?.comfortableLabel || 'Comfortable';
const compactLabel = docsConfig?.ui?.view?.compactLabel || 'Compact';
const readingTitle = docsConfig?.ui?.view?.readingTitle || 'Reading focus';
const readingOnLabel = docsConfig?.ui?.view?.readingOnLabel || 'On: minimal distractions';
const readingOffLabel = docsConfig?.ui?.view?.readingOffLabel || 'Off: full docs layout';
const codeContrastTitle = docsConfig?.ui?.view?.codeContrastTitle || 'Code contrast';
const codeContrastNormalLabel = docsConfig?.ui?.view?.codeContrastNormalLabel || 'Normal';
const codeContrastHighLabel = docsConfig?.ui?.view?.codeContrastHighLabel || 'High';
const performanceTitle = docsConfig?.ui?.view?.performanceTitle || 'Performance mode';
const performanceOnLabel = docsConfig?.ui?.view?.performanceOnLabel || 'On: reduce effects for speed';
const performanceOffLabel = docsConfig?.ui?.view?.performanceOffLabel || 'Off: full visual effects';

function getReadingDetail(label) {
  return String(label || '')
    .replace(/^\s*(on|off)\s*:\s*/i, '')
    .trim();
}

function ShortcutBadge({ label }) {
  return (
    <span className="inline-flex items-center rounded-md border border-[var(--theme-border)] bg-[var(--theme-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--theme-muted)]">
      {label}
    </span>
  );
}

export default function ViewOptionsToggle({
  density,
  onDensityChange,
  readingMode,
  onReadingModeChange,
  codeContrast = 'normal',
  onCodeContrastChange,
  performanceMode = false,
  onPerformanceModeChange,
  compact = false,
  panelPlacement = 'down',
}) {
  const [open, setOpen] = useState(false);
  const [resolvedPlacement, setResolvedPlacement] = useState(panelPlacement);
  const [panelStyle, setPanelStyle] = useState({});
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const readingDetail = readingMode ? getReadingDetail(readingOnLabel) : getReadingDetail(readingOffLabel);
  const performanceDetail = performanceMode ? getReadingDetail(performanceOnLabel) : getReadingDetail(performanceOffLabel);

  useEffect(() => {
    function handleOutside(event) {
      const clickedRoot = rootRef.current?.contains(event.target);
      const clickedPanel = panelRef.current?.contains(event.target);
      if (!clickedRoot && !clickedPanel) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    setResolvedPlacement(panelPlacement);
  }, [panelPlacement]);

  useEffect(() => {
    if (!open || !rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = panelRef.current?.offsetWidth || 270;
    const panelHeight = panelRef.current?.offsetHeight || 400;
    const margin = 16;

    let next = panelPlacement;
    if (next === 'up' && rect.top < panelHeight + margin) next = 'down';
    if (next === 'down' && viewportHeight - rect.bottom < panelHeight + margin) next = 'up';
    if (next === 'left' && rect.left < panelWidth + margin) next = 'right';
    if (next === 'right' && viewportWidth - rect.right < panelWidth + margin) next = 'left';

    setResolvedPlacement(next);
  }, [open, panelPlacement]);

  useEffect(() => {
    if (!open || !rootRef.current) return;

    const defaultPanelWidth = 270;
    const defaultPanelHeight = 400;
    const margin = 12;
    const offset = 10;
    const clearance = 10;

    const updatePosition = () => {
      const rect = rootRef.current.getBoundingClientRect();
      const panelWidth = panelRef.current?.offsetWidth || defaultPanelWidth;
      const panelHeight = panelRef.current?.offsetHeight || defaultPanelHeight;
      const dockRect = document.querySelector('aside[aria-label="Customization dock"]')?.getBoundingClientRect();
      const dockGap = 8;
      let left = rect.left + rect.width / 2 - panelWidth / 2;
      let top = rect.top - panelHeight - offset;

      if (resolvedPlacement === 'down') {
        top = rect.bottom + offset;
      } else if (resolvedPlacement === 'left') {
        left = rect.left - panelWidth - offset;
        top = rect.top + rect.height / 2 - panelHeight / 2;
      } else if (resolvedPlacement === 'right') {
        left = rect.right + offset;
        top = rect.top + rect.height / 2 - panelHeight / 2;
      }

      left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

      const minTop = margin;
      const maxTop = window.innerHeight - panelHeight - margin;
      if (resolvedPlacement === 'up') {
        const topCap = rect.top - panelHeight - clearance;
        top = Math.max(minTop, Math.min(top, Math.min(maxTop, topCap)));
        if (dockRect) {
          const dockCap = dockRect.top - panelHeight - dockGap;
          top = Math.min(top, dockCap);
          top = Math.max(minTop, top);
        }
      } else if (resolvedPlacement === 'down') {
        const topFloor = rect.bottom + clearance;
        top = Math.max(Math.max(minTop, topFloor), Math.min(top, maxTop));
      } else {
        top = Math.max(minTop, Math.min(top, maxTop));
      }

      setPanelStyle({ left: `${left}px`, top: `${top}px` });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, resolvedPlacement]);

  return (
    <div ref={rootRef} className="relative overflow-visible">
      <button
        type="button"
        className={compact
          ? `inline-flex h-8 w-full items-center justify-start rounded-xl px-2 text-sm text-[var(--theme-text)] transition-all duration-200 hover:bg-white/20 ${open ? 'bg-white/24 ring-1 ring-white/35 shadow-[0_6px_18px_rgba(0,0,0,0.18)]' : ''}`
          : 'inline-flex items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2 text-sm text-[var(--theme-text)] transition hover:border-[var(--theme-accent)]'}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Toggle view options"
      >
        {compact ? (
          <>
            <svg className="h-4 w-4 shrink-0 text-[var(--theme-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 7h12M4 12h16M4 17h9" strokeLinecap="round" />
              <circle cx="18" cy="7" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="13" cy="17" r="1.6" fill="currentColor" stroke="none" />
            </svg>
            <span className="ml-1.5 max-w-28 overflow-hidden whitespace-nowrap text-sm text-[var(--theme-text)]">
              {density === 'compact' ? compactLabel : comfortableLabel}
            </span>
            <svg className={`ml-auto h-3.5 w-3.5 text-[var(--theme-muted)] transition-transform duration-200 ${open ? 'rotate-180 text-[var(--theme-text)]' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        ) : (
          <>
            <span className="hidden lg:inline">{viewButtonLabel}</span>
            <span className="text-xs text-[var(--theme-muted)]">{density === 'compact' ? compactLabel : comfortableLabel}</span>
          </>
        )}
      </button>

      {open && createPortal(
        <div ref={panelRef} style={panelStyle} className="fixed z-[140] w-[270px] rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/96 p-2 text-[var(--theme-text)] shadow-[0_20px_48px_rgba(0,0,0,0.3)] ring-1 ring-white/20 backdrop-blur-2xl backdrop-saturate-200 animate-[section-rise_220ms_ease-out]">
          <div className="rounded-xl border border-[var(--theme-border)]/70 bg-[var(--theme-bg)]/60 p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--theme-muted)]">{densityTitle}</p>
              <ShortcutBadge label={SHORTCUT_DENSITY.label} />
            </div>
            <div className="mb-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-panel)]/85 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition ${density === 'comfortable' ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-text)] ring-1 ring-[var(--theme-accent)]/45' : 'text-[var(--theme-text)] hover:bg-[var(--theme-bg-soft)]'}`}
                  onClick={() => onDensityChange('comfortable')}
                >
                  <span className="inline-block h-1.5 w-3 rounded-full bg-current opacity-70" aria-hidden="true" />
                  {comfortableLabel}
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition ${density === 'compact' ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-text)] ring-1 ring-[var(--theme-accent)]/45' : 'text-[var(--theme-text)] hover:bg-[var(--theme-bg-soft)]'}`}
                  onClick={() => onDensityChange('compact')}
                >
                  <span className="inline-block h-1.5 w-3 rounded-full bg-current opacity-70" aria-hidden="true" />
                  {compactLabel}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[var(--theme-muted)]">Adjust spacing density for this page layout.</p>
          </div>

          <div className="mt-2 rounded-xl border border-[var(--theme-border)]/70 bg-[var(--theme-bg)]/60 p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--theme-muted)]">{readingTitle}</p>
              <ShortcutBadge label={SHORTCUT_READING.label} />
            </div>
            <button
              type="button"
              className={`w-full rounded-lg border px-2.5 py-2 text-[13px] transition ${readingMode ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/12 text-[var(--theme-text)] ring-1 ring-[var(--theme-accent)]/35' : 'border-[var(--theme-border)] bg-[var(--theme-panel)]/85 text-[var(--theme-text)] hover:bg-[var(--theme-bg-soft)]'}`}
              onClick={() => {
                onReadingModeChange(!readingMode);
              }}
            >
              <span className="flex items-center justify-between">
                <span>{readingDetail}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${readingMode ? 'bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-bg-soft)] text-[var(--theme-muted)]'}`}>
                  {readingMode ? 'ON' : 'OFF'}
                </span>
              </span>
            </button>
            <p className="mt-1.5 text-[10px] text-[var(--theme-muted)]">Hide visual noise and focus content when enabled.</p>
          </div>

          <div className="mt-2 rounded-xl border border-[var(--theme-border)]/70 bg-[var(--theme-bg)]/60 p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--theme-muted)]">{codeContrastTitle}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${codeContrast === 'high' ? 'bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-bg-soft)] text-[var(--theme-muted)]'}`}>
                {codeContrast === 'high' ? 'HIGH' : 'NORMAL'}
              </span>
            </div>
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-panel)]/85 p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition ${codeContrast === 'normal' ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-text)] ring-1 ring-[var(--theme-accent)]/45' : 'text-[var(--theme-text)] hover:bg-[var(--theme-bg-soft)]'}`}
                  onClick={() => onCodeContrastChange?.('normal')}
                >
                  {codeContrastNormalLabel}
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition ${codeContrast === 'high' ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-text)] ring-1 ring-[var(--theme-accent)]/45' : 'text-[var(--theme-text)] hover:bg-[var(--theme-bg-soft)]'}`}
                  onClick={() => onCodeContrastChange?.('high')}
                >
                  {codeContrastHighLabel}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--theme-muted)]">Boost syntax and base code contrast for low-visibility themes.</p>
          </div>

          <div className="mt-2 rounded-xl border border-[var(--theme-border)]/70 bg-[var(--theme-bg)]/60 p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--theme-muted)]">{performanceTitle}</p>
            </div>
            <button
              type="button"
              className={`w-full rounded-lg border px-2.5 py-2 text-[13px] transition ${performanceMode ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/12 text-[var(--theme-text)] ring-1 ring-[var(--theme-accent)]/35' : 'border-[var(--theme-border)] bg-[var(--theme-panel)]/85 text-[var(--theme-text)] hover:bg-[var(--theme-bg-soft)]'}`}
              onClick={() => onPerformanceModeChange?.(!performanceMode)}
            >
              <span className="flex items-center justify-between">
                <span>{performanceDetail}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${performanceMode ? 'bg-[var(--theme-accent)] text-white' : 'bg-[var(--theme-bg-soft)] text-[var(--theme-muted)]'}`}>
                  {performanceMode ? 'ON' : 'OFF'}
                </span>
              </span>
            </button>
            <p className="mt-1.5 text-[10px] text-[var(--theme-muted)]">Disables blur and most transitions for faster interactions.</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
