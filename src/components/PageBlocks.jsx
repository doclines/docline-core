import React from 'react';

function HeroBlock({ block }) {
  return (
    <section className="page-block page-block-hero mb-8 rounded-2xl border border-[var(--theme-border)] bg-[var(--surface-panel)] px-5 py-6 sm:px-8">
      {block.kicker && <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{block.kicker}</p>}
      {block.title && <h2 className="mb-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">{block.title}</h2>}
      {block.description && <p className="max-w-3xl text-[var(--text-muted)]">{block.description}</p>}
    </section>
  );
}

function CalloutGridBlock({ block }) {
  const items = Array.isArray(block.items) ? block.items : [];
  if (!items.length) return null;

  return (
    <section className="page-block page-block-callout-grid mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={`${item.title || 'item'}-${index}`}
          className="rounded-2xl border border-[var(--theme-border)] bg-[var(--surface-panel)] p-4"
        >
          {item.title && <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">{item.title}</h3>}
          {item.body && <p className="text-sm leading-6 text-[var(--text-muted)]">{item.body}</p>}
        </article>
      ))}
    </section>
  );
}

function ChangelogBlock({ block }) {
  const items = Array.isArray(block.items) ? block.items : [];
  if (!items.length) return null;

  return (
    <section className="page-block page-block-changelog mb-8 rounded-2xl border border-[var(--theme-border)] bg-[var(--surface-panel)] p-4 sm:p-5">
      <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">{block.title || 'Changelog'}</h3>
      <ul className="space-y-2 text-sm text-[var(--text-muted)]">
        {items.map((item, index) => (
          <li key={`${item.version || 'v'}-${index}`} className="rounded-xl border border-[var(--theme-border)] bg-[var(--surface-page)] px-3 py-2">
            <span className="mr-2 inline-flex rounded-full border border-[var(--theme-border)] px-2 py-0.5 text-xs font-semibold text-[var(--text-primary)]">
              {item.version || 'update'}
            </span>
            <span>{item.note || item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ApiBaseUrlBlock({ block }) {
  if (!block.url) return null;

  return (
    <section className="page-block page-block-api-base mb-8 rounded-2xl border border-[var(--theme-border)] bg-[var(--surface-panel)] p-4">
      <h3 className="mb-2 text-base font-semibold text-[var(--text-primary)]">{block.title || 'API Base URL'}</h3>
      <code className="block overflow-x-auto rounded-lg border border-[var(--theme-border)] bg-[var(--surface-code)] px-3 py-2 text-sm text-[var(--text-primary)]">
        {block.url}
      </code>
    </section>
  );
}

function CtaCardBlock({ block }) {
  return (
    <section className="page-block page-block-cta mb-8 rounded-2xl border border-[var(--theme-border)] bg-[var(--surface-panel)] p-5 sm:p-6">
      {block.title && <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">{block.title}</h3>}
      {block.description && <p className="mb-4 text-[var(--text-muted)]">{block.description}</p>}
      {block.href && (
        <a
          href={block.href}
          target={block.target || '_self'}
          rel={block.target === '_blank' ? 'noopener noreferrer' : undefined}
          className="inline-flex rounded-xl border border-[var(--theme-border)] bg-[var(--theme-accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--action-primary)] transition hover:brightness-95"
        >
          {block.label || 'Learn more'}
        </a>
      )}
    </section>
  );
}

function renderBlock(block, index) {
  const type = String(block?.type || '').toLowerCase();
  if (type === 'hero') return <HeroBlock key={`hero-${index}`} block={block} />;
  if (type === 'callout-grid') return <CalloutGridBlock key={`callout-grid-${index}`} block={block} />;
  if (type === 'changelog') return <ChangelogBlock key={`changelog-${index}`} block={block} />;
  if (type === 'api-base-url') return <ApiBaseUrlBlock key={`api-base-${index}`} block={block} />;
  if (type === 'cta-card') return <CtaCardBlock key={`cta-${index}`} block={block} />;
  return null;
}

export default function PageBlocks({ blocks = [] }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return <>{blocks.map((block, index) => renderBlock(block, index)).filter(Boolean)}</>;
}
