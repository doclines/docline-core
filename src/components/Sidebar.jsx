import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SHORTCUT_SEARCH } from '../utils/shortcuts';
import docsConfig from '../config/docsConfig';
import BrandBadge from './BrandBadge';
const repoUrl = docsConfig?.footer?.socials?.github || 'https://github.com/doclines/docline-core';

const sidebarSearchLabel = docsConfig?.ui?.sidebar?.searchLabel || 'Search docs';
const sidebarStatusLabel = docsConfig?.ui?.sidebar?.statusLabel || 'Docs synced and indexed';
const sidebarRepoLabel = docsConfig?.ui?.sidebar?.repoLabel || 'Product Features';
const sidebarThemeGalleryLabel = docsConfig?.ui?.sidebar?.themeGalleryLabel || 'Theme Gallery';
const DEFAULT_SIDEBAR_ACTIONS = {
  order: ['search', 'status', 'repo', 'themeGallery'],
  hidden: ['status', 'repo', 'themeGallery'],
  hiddenDesktop: [],
  hiddenMobile: ['repo'],
};

export default function Sidebar({
  groups,
  onClose,
  onSearchOpen,
  onOpenThemeGallery,
  sidebarActions = DEFAULT_SIDEBAR_ACTIONS,
  showBranding = true,
  isMobile = false,
}) {
  const location = useLocation();
  const currentPath = location.pathname.slice(1); // remove leading /
  const actions = Array.isArray(sidebarActions.order) ? sidebarActions.order : DEFAULT_SIDEBAR_ACTIONS.order;
  const hiddenActions = new Set(Array.isArray(sidebarActions.hidden) ? sidebarActions.hidden : []);
  const hiddenDesktop = new Set(Array.isArray(sidebarActions.hiddenDesktop) ? sidebarActions.hiddenDesktop : []);
  const hiddenMobile = new Set(Array.isArray(sidebarActions.hiddenMobile) ? sidebarActions.hiddenMobile : []);
  const deviceHidden = isMobile ? hiddenMobile : hiddenDesktop;

  const defaultOpenGroups = useMemo(() => {
    const activeGroup = groups.find((group) => group.pages.some((page) => page.path === currentPath))?.group;
    const firstGroup = groups[0]?.group;
    return [activeGroup, firstGroup].filter(Boolean);
  }, [groups, currentPath]);

  const [openGroups, setOpenGroups] = useState(() => new Set(defaultOpenGroups));

  function toggleGroup(groupName) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }

  function renderSidebarAction(action) {
    if (hiddenActions.has(action)) return null;
    if (deviceHidden.has(action)) return null;

    if (action === 'search') {
      return (
        <button
          key="search"
          type="button"
          className="group mb-3 inline-flex w-full items-center gap-2 rounded-xl border border-[var(--theme-border)]/80 bg-[var(--theme-bg)]/75 px-3 py-2 text-sm text-[var(--theme-muted)] transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-text)]"
          onClick={onSearchOpen}
          aria-label={`Search (${SHORTCUT_SEARCH.label})`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span className="flex-1 text-left">{sidebarSearchLabel}</span>
          <div className="flex items-center gap-1">
            {SHORTCUT_SEARCH.keys.map((k) => (
              <kbd key={k} className="rounded border border-[var(--theme-border)]/90 bg-[var(--theme-panel)]/80 px-1.5 py-0.5 font-mono text-[10px] text-[var(--theme-muted)]">
                {k}
              </kbd>
            ))}
          </div>
        </button>
      );
    }

    if (action === 'status') {
      return (
        <div key="status" className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--theme-border)]/80 bg-[var(--theme-bg)]/75 px-3 py-2 text-xs text-[var(--theme-muted)]">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          {sidebarStatusLabel}
        </div>
      );
    }

    if (action === 'repo') {
      return (
        <a
          key="repo"
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 block rounded-xl border border-[var(--theme-border)]/80 bg-[var(--theme-bg)]/55 px-3 py-2 text-sm text-[var(--theme-muted)] transition hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)]"
        >
          {sidebarRepoLabel}
        </a>
      );
    }

    if (action === 'platform') return null;

    if (action === 'themeGallery') {
      return (
        <button
          key="themeGallery"
          type="button"
          className="mb-3 block w-full rounded-xl border border-[var(--theme-border)]/80 bg-[var(--theme-bg)]/55 px-3 py-2 text-left text-sm text-[var(--theme-muted)] transition hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)]"
          onClick={onOpenThemeGallery}
        >
          {sidebarThemeGalleryLabel}
        </button>
      );
    }

    return null;
  }

  return (
    <aside className={`app-sidebar flex h-full flex-col ${isMobile ? '' : 'sticky top-20'} overflow-hidden rounded-2xl border border-[var(--theme-border)]/75 bg-[var(--theme-sidebar)]/88 p-3.5 backdrop-blur-0 md:backdrop-blur-md`}>
      <div className="sidebar-actions border-b border-[var(--theme-border)]/60 pb-2.5">{actions.map((action) => renderSidebarAction(action))}</div>

      <div className="hide-scrollbar mt-2.5 flex-1 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.group} className="mb-5">
            <button
              type="button"
              className="mb-1.5 inline-flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--theme-muted)] transition-colors hover:bg-[var(--theme-bg)]/70"
              onClick={() => toggleGroup(group.group)}
            >
              <span>{group.group}</span>
              <span aria-hidden="true">{openGroups.has(group.group) ? '−' : '+'}</span>
            </button>
          {openGroups.has(group.group) && group.pages.map((page) => {
            const isActive = currentPath === page.path;
            return (
              <Link
                key={page.path}
                to={{ pathname: `/${page.path}`, search: location.search }}
                className={`mb-0.5 block rounded-lg px-3 py-1.5 text-[13px] leading-5 transition-colors ${
                  isActive
                    ? 'bg-[var(--theme-accent-soft)] font-medium text-[var(--theme-text)]'
                    : 'text-[var(--theme-muted)] hover:bg-[var(--theme-bg)]/75 hover:text-[var(--theme-text)]'
                }`}
                onClick={onClose}
              >
                {page.title}
              </Link>
            );
          })}
          </div>
        ))}
      </div>

      {showBranding && <BrandBadge mode="sidebar" />}
    </aside>
  );
}
