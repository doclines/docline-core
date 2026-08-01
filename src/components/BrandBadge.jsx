import React from 'react';
import docsConfig from '../config/docsConfig';

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

const IMMUTABLE_BADGE = {
  label: 'Powered by docline',
  href: 'https://github.com/doclines/docline-core',
  target: '_blank',
  rel: 'noopener noreferrer',
  position: 'bottom-left',
};

function getPositionClasses(position) {
  if (position === 'bottom-left') return 'left-3 sm:left-4 right-auto';
  if (position === 'bottom-center') return 'left-1/2 -translate-x-1/2 right-auto';
  return 'right-3 sm:right-4 left-auto';
}

function BrandMark({ compact = false }) {
  const sizeClass = compact ? 'h-4 w-4' : 'h-4.5 w-4.5';
  return (
    <span
      className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center text-emerald-500 dark:text-emerald-400`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" aria-hidden="true">
        <path
          d="M6.4 14.8c3.5-3.7 6.6-4.8 10.8-5.1-.3 3.9-1.7 6.9-5.1 10.1-3.3-.3-5.4-2.4-5.7-5z"
          fill="currentColor"
        />
        <path
          d="M9.3 15.4c1.9-2.5 3.9-3.8 7-4.2"
          stroke="rgba(6,95,70,0.35)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function BrandBadge({ dockEnabled = false, dockPosition = 'right', mode = 'fixed' }) {
  const badge = IMMUTABLE_BADGE;
  const attributionMode = String(docsConfig?.branding?.attribution || 'keep').toLowerCase() === 'remove'
    ? 'remove'
    : 'keep';
  const logoSrc = resolveAssetPath('/opensourcedocs-logo.svg');
  const logoAlt = badge.label;
  const badgeStyle = String(docsConfig?.branding?.badgeStyle || 'minimal').toLowerCase() === 'full'
    ? 'full'
    : 'minimal';
  const isBottomDock = dockEnabled && dockPosition === 'bottom';
  const bottomOffsetClass = isBottomDock ? 'bottom-16 sm:bottom-20' : 'bottom-1.5 sm:bottom-2';
  const positionClass = getPositionClasses(badge.position);
  const isInline = mode === 'inline';
  const isSidebar = mode === 'sidebar';
  const showInlineLogo = false;

  if (attributionMode === 'remove') {
    return null;
  }

  if (isInline) {
    return (
      <div className="mt-10 border-t border-[var(--theme-border)]/70 pt-4 text-right">
        {badge.href ? (
          <a
            href={badge.href}
            target={badge.target}
            rel={badge.rel}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--theme-muted)] transition-colors hover:text-[var(--theme-accent)]"
            aria-label={badge.label}
          >
            {showInlineLogo && <img src={logoSrc} alt={logoAlt} className="h-3.5 w-auto" />}
            <span>{badge.label}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--theme-muted)]">
            {showInlineLogo && <img src={logoSrc} alt={logoAlt} className="h-3.5 w-auto" />}
            <span>{badge.label}</span>
          </span>
        )}
      </div>
    );
  }

  if (isSidebar) {
    return (
      <div className="mt-3 border-t border-[var(--theme-border)]/60 pt-2.5">
        <a
          href={badge.href}
          target={badge.target}
          rel={badge.rel}
          className="group inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-[10px] font-medium tracking-[0.01em] text-[var(--theme-muted)]/82 transition-colors hover:text-[var(--theme-text)]"
          aria-label={badge.label}
        >
          <BrandMark compact />
          <span className="lowercase">
            powered by <span className="font-semibold text-emerald-600 dark:text-emerald-300">docline</span>
          </span>
          <span aria-hidden="true" className="translate-y-[-0.5px] text-[9px] opacity-60 transition-opacity group-hover:opacity-100">↗</span>
        </a>
      </div>
    );
  }

  const badgeContent = badgeStyle === 'full' ? (
    <div className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-panel)]/90 px-2.5 py-1.5 text-[11px] font-medium text-[var(--theme-muted)] shadow-lg backdrop-blur-md transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-text)]">
      <BrandMark />
      <span className="lowercase">powered by docline</span>
      <span aria-hidden="true" className="text-[10px]">↗</span>
    </div>
  ) : (
    <div className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] font-medium tracking-[0.01em] text-[var(--theme-muted)]/82 opacity-80 transition-all hover:bg-[var(--theme-panel)]/55 hover:text-[var(--theme-text)] hover:opacity-100">
      <BrandMark compact />
      <span className="lowercase">powered by docline</span>
      <span aria-hidden="true" className="text-[9px]">↗</span>
    </div>
  );

  return (
    <div className={`pointer-events-none fixed z-30 ${bottomOffsetClass} ${positionClass}`}>
      {badge.href ? (
        <a
          href={badge.href}
          target={badge.target}
          rel={badge.rel}
          className="pointer-events-auto"
          aria-label={badge.label}
        >
          {badgeContent}
        </a>
      ) : (
        <div className="pointer-events-auto">{badgeContent}</div>
      )}
    </div>
  );
}