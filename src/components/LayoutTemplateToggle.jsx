import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import docsConfig from '../config/docsConfig';
import { LAYOUT_TEMPLATES } from '../utils/layoutTemplates';

const templateButtonLabel = docsConfig?.ui?.layout?.buttonLabel || 'Template';
const templatePanelTitle = docsConfig?.ui?.layout?.panelTitle || 'Layout Templates';
const templatePanelDescription = docsConfig?.ui?.layout?.panelDescription || 'Switch full shell composition';

export default function LayoutTemplateToggle({ layoutTemplateId, onLayoutTemplateChange, compact = false, panelPlacement = 'down' }) {
  const [open, setOpen] = useState(false);
  const [resolvedPlacement, setResolvedPlacement] = useState(panelPlacement);
  const [panelStyle, setPanelStyle] = useState({});
  const rootRef = useRef(null);
  const panelRef = useRef(null);

  const activeTemplate = useMemo(
    () => LAYOUT_TEMPLATES.find((template) => template.id === layoutTemplateId) || LAYOUT_TEMPLATES[0],
    [layoutTemplateId]
  );

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
    const panelWidth = panelRef.current?.offsetWidth || 268;
    const panelHeight = panelRef.current?.offsetHeight || 322;
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

    const defaultPanelWidth = 268;
    const defaultPanelHeight = 322;
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
        aria-label="Choose layout template"
      >
        {compact ? (
          <>
            <svg className="h-4 w-4 shrink-0 text-[var(--theme-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3.5" y="4" width="17" height="16" rx="2" />
              <path d="M3.5 9.5h17M10.5 9.5V20" />
            </svg>
            <span className="ml-1.5 max-w-28 overflow-hidden whitespace-nowrap text-sm text-[var(--theme-text)]">
              {activeTemplate.label}
            </span>
            <svg className={`ml-auto h-3.5 w-3.5 text-[var(--theme-muted)] transition-transform duration-200 ${open ? 'rotate-180 text-[var(--theme-text)]' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        ) : (
          <>
            <span className="hidden xl:inline text-xs text-[var(--theme-muted)]">{templateButtonLabel}</span>
            <span className="max-w-32 truncate text-left">{activeTemplate.label}</span>
          </>
        )}
      </button>

      {open && createPortal(
        <div ref={panelRef} style={panelStyle} className="fixed z-[140] w-[268px] rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)]/96 p-2 text-[var(--theme-text)] shadow-[0_20px_48px_rgba(0,0,0,0.3)] ring-1 ring-white/20 backdrop-blur-2xl backdrop-saturate-200 animate-[section-rise_220ms_ease-out]">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--theme-muted)]">{templatePanelTitle}</p>
          <p className="mb-1.5 text-[10px] text-[var(--theme-muted)]">{templatePanelDescription}</p>
          <div className="max-h-72 space-y-0.5 overflow-y-auto pr-0.5">
            {LAYOUT_TEMPLATES.map((template) => (
              <button
                type="button"
                key={template.id}
                className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                  activeTemplate.id === template.id
                    ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-text)] ring-1 ring-[var(--theme-accent)]/45'
                    : 'text-[var(--theme-text)] hover:bg-[var(--theme-bg-soft)] hover:ring-1 hover:ring-[var(--theme-border)]'
                }`}
                onClick={() => {
                  onLayoutTemplateChange(template.id);
                  setOpen(false);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium">{template.label}</div>
                    <div className="truncate text-[10px] text-[var(--theme-muted)]">{template.description || ''}</div>
                  </div>
                  {activeTemplate.id === template.id && (
                    <svg className="h-3.5 w-3.5 shrink-0 text-[var(--theme-accent)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
