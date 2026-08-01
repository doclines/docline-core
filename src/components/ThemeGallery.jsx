import React from 'react';
import docsConfig from '../config/docsConfig';

const galleryTitle = docsConfig?.ui?.header?.themeGalleryLabel || 'Theme Gallery';
const galleryDescription = docsConfig?.ui?.theme?.panelDescription || 'Live preview cards for each palette.';

function ThemePreviewCard({ theme, isActive, onApply }) {
  const c = theme.colors;
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition ${
        isActive
          ? 'border-[var(--theme-accent)] shadow-lg'
          : 'border-[var(--theme-border)] hover:border-[var(--theme-accent)]/70'
      }`}
      style={{ backgroundColor: c['--theme-panel'] }}
    >
      <div
        className="border-b px-4 py-3"
        style={{
          borderColor: c['--theme-border'],
          background: `linear-gradient(120deg, ${c['--theme-aurora-a']}, ${c['--theme-aurora-b']})`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: c['--theme-text'] }}>{theme.label}</h3>
            <p className="text-xs uppercase tracking-wide" style={{ color: c['--theme-muted'] }}>{theme.mode}</p>
          </div>
          <button
            type="button"
            onClick={() => onApply(theme.id)}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: c['--theme-accent'] }}
          >
            {isActive ? 'Active' : 'Apply'}
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4" style={{ backgroundColor: c['--theme-bg'] }}>
        <div className="rounded-lg border p-2" style={{ borderColor: c['--theme-border'], backgroundColor: c['--theme-sidebar'] }}>
          <div className="mb-2 h-2.5 w-24 rounded" style={{ backgroundColor: c['--theme-text'], opacity: 0.7 }} />
          <div className="h-2 w-36 rounded" style={{ backgroundColor: c['--theme-muted'], opacity: 0.5 }} />
        </div>

        <div className="rounded-lg border p-3" style={{ borderColor: c['--theme-border'], backgroundColor: c['--theme-panel'] }}>
          <div className="mb-2 h-3 w-40 rounded" style={{ backgroundColor: c['--theme-text'], opacity: 0.85 }} />
          <div className="mb-1 h-2 w-full rounded" style={{ backgroundColor: c['--theme-muted'], opacity: 0.35 }} />
          <div className="h-2 w-4/5 rounded" style={{ backgroundColor: c['--theme-muted'], opacity: 0.25 }} />
          <div className="mt-3 inline-flex rounded px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: c['--theme-accent-soft'], color: c['--theme-accent'] }}>
            code sample
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemeGallery({ themes, activeThemeId, onApplyTheme }) {
  return (
    <section className="mx-auto w-full max-w-6xl animate-fade-up">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{galleryTitle}</h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--theme-muted)]">
          {galleryDescription}. Pick a theme and it is applied instantly across the whole docs shell.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => (
          <ThemePreviewCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeThemeId}
            onApply={onApplyTheme}
          />
        ))}
      </div>
    </section>
  );
}
