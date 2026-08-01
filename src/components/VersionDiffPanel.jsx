import React, { useMemo, useState } from 'react';
import {
  comparePageAcrossVersions,
  getAvailableVersionsForSlug,
} from '../content/doclineRuntime';

export default function VersionDiffPanel({ contextKey, pageSlug }) {
  const [expanded, setExpanded] = useState(false);
  const versions = useMemo(() => {
    const locale = String(contextKey || '').split(':')[1] || '';
    return getAvailableVersionsForSlug(locale, pageSlug || '');
  }, [contextKey, pageSlug]);

  const currentVersion = String(contextKey || '').split(':')[0] || '';
  const otherVersions = versions.filter((item) => item.version !== currentVersion);
  const targetVersion = otherVersions[0]?.version;
  const diff = targetVersion
    ? comparePageAcrossVersions(contextKey, pageSlug, targetVersion)
    : null;

  if (!diff) return null;

  return (
    <section className="mb-8 rounded-2xl border border-[var(--theme-border)] bg-[var(--surface-panel)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Version Diff</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Compare {diff.currentVersion} to {diff.targetVersion}
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl border border-[var(--theme-border)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:border-[var(--theme-accent)]"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Hide diff' : 'Show diff'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-[var(--theme-border)] bg-[var(--surface-page)] px-2 py-1 text-[var(--text-muted)]">
          +{diff.summary.added} additions
        </span>
        <span className="rounded-full border border-[var(--theme-border)] bg-[var(--surface-page)] px-2 py-1 text-[var(--text-muted)]">
          -{diff.summary.removed} removals
        </span>
      </div>

      {diff.breakingChanges.length > 0 && (
        <div className="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--surface-page)] p-3">
          <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Breaking changes</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
            {diff.breakingChanges.slice(0, 6).map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {expanded && (
        <div className="mt-4 max-h-[320px] overflow-y-auto rounded-xl border border-[var(--theme-border)] bg-[var(--surface-code)] p-3 font-mono text-xs leading-6">
          {diff.rows.map((row, index) => {
            const marker = row.type === 'added' ? '+' : row.type === 'removed' ? '-' : ' ';
            const className = row.type === 'added'
              ? 'text-[var(--action-success)]'
              : row.type === 'removed'
                ? 'text-[var(--action-danger)]'
                : 'text-[var(--text-muted)]';
            return (
              <div key={`${row.type}-${index}`} className={className}>
                <span className="mr-2 select-none opacity-80">{marker}</span>
                <span>{row.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
