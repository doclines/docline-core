import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import TableOfContents from './TableOfContents';
import PageBlocks from './PageBlocks';
import VersionDiffPanel from './VersionDiffPanel';
import {
  getPage,
  getOrderedPages,
  getPageBlocks,
  normalizeSlug,
  resolveRedirect,
} from '../content/doclineRuntime';

export default function DocPage({ onTabChange, readingMode = false, showToc = true, contextKey }) {
  const location = useLocation();
  const navigate = useNavigate();
  const articleRef = useRef(null);

  const currentSlug = normalizeSlug(location.pathname);
  const page = getPage(contextKey, location.pathname);
  const pageBlocks = page ? getPageBlocks(contextKey, page.slug) : [];
  const redirect = !page ? resolveRedirect(contextKey, location.pathname) : null;
  const orderedPages = useMemo(() => getOrderedPages(contextKey), [contextKey]);

  const currentIndex = orderedPages.findIndex((item) => item.path === (page?.slug || currentSlug));
  const previousPage = currentIndex > 0 ? orderedPages[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < orderedPages.length - 1
    ? orderedPages[currentIndex + 1]
    : null;

  useEffect(() => {
    if (page?.tabId) {
      onTabChange(page.tabId);
    }
  }, [onTabChange, page?.tabId]);

  useEffect(() => {
    if (redirect?.to) {
      navigate({ pathname: redirect.to, search: location.search }, { replace: true });
    }
  }, [redirect?.to, location.search, navigate]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const cleanupFns = [];

    const copyText = async (text) => {
      const value = String(text || '');
      if (!value.trim()) return false;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
          return true;
        }
      } catch {
        // Fallback below.
      }

      try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    };

    const flashCopyState = (button, success) => {
      if (!button) return;
      const original = button.dataset.copyLabel || button.textContent || 'Copy';
      button.dataset.copyLabel = original;
      button.textContent = success ? 'Copied' : 'Copy failed';
      button.classList.remove('border-[var(--theme-border)]', 'text-[var(--theme-muted)]', 'border-emerald-400', 'text-emerald-700', 'border-amber-500', 'text-amber-700');
      if (success) {
        button.classList.add('border-emerald-400', 'text-emerald-700');
      } else {
        button.classList.add('border-amber-500', 'text-amber-700');
      }
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove('border-emerald-400', 'text-emerald-700', 'border-amber-500', 'text-amber-700');
        button.classList.add('border-[var(--theme-border)]', 'text-[var(--theme-muted)]');
      }, 1200);
    };

    root.querySelectorAll('.prose h2[id], .prose h3[id], .prose h4[id]').forEach((heading) => {
      if (heading.querySelector('.doc-anchor-btn')) return;

      heading.classList.add('group');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'doc-anchor-btn ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-xs text-[var(--theme-muted)] opacity-0 transition group-hover:opacity-100 hover:border-[var(--theme-border)] hover:text-[var(--theme-text)]';
      button.title = 'Copy section link';
      button.setAttribute('aria-label', 'Copy section link');
      button.textContent = '#';

      const onCopyAnchor = async () => {
        const headingId = heading.getAttribute('id');
        if (!headingId) return;
        const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${headingId}`;
        const success = await copyText(url);
        flashCopyState(button, success);
      };

      button.addEventListener('click', onCopyAnchor);
      cleanupFns.push(() => button.removeEventListener('click', onCopyAnchor));
      heading.appendChild(button);
    });

    root.querySelectorAll('.tabs-container').forEach((container) => {
      const tabs = Array.from(container.querySelectorAll('.tabs-nav-btn'));
      const panels = Array.from(container.querySelectorAll('.tabs-panel'));
      if (!tabs.length || !panels.length) return;

      const activate = (nextIndex) => {
        tabs.forEach((tab, idx) => {
          const active = idx === nextIndex;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.setAttribute('tabindex', active ? '0' : '-1');
        });

        panels.forEach((panel, idx) => {
          const active = idx === nextIndex;
          panel.style.display = active ? 'block' : 'none';
          panel.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
      };

      const onTabClick = (event) => {
        const index = Number(event.currentTarget.dataset.index || 0);
        activate(index);
      };

      const onTabKeyDown = (event) => {
        const current = Number(event.currentTarget.dataset.index || 0);
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
          return;
        }

        event.preventDefault();
        let next = current;
        if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;

        activate(next);
        tabs[next]?.focus();
      };

      tabs.forEach((tab, idx) => {
        tab.setAttribute('role', 'tab');
        tab.dataset.index = String(idx);
        tab.addEventListener('click', onTabClick);
        tab.addEventListener('keydown', onTabKeyDown);
        cleanupFns.push(() => {
          tab.removeEventListener('click', onTabClick);
          tab.removeEventListener('keydown', onTabKeyDown);
        });
      });

      const tabNav = container.querySelector('.tabs-nav');
      if (tabNav) tabNav.setAttribute('role', 'tablist');
      activate(tabs.findIndex((tab) => tab.classList.contains('active')) >= 0
        ? tabs.findIndex((tab) => tab.classList.contains('active'))
        : 0);

      const copyBtn = container.querySelector('.tabs-copy-btn');
      if (copyBtn) {
        const onCopy = async () => {
          const visible = panels.find((panel) => panel.style.display !== 'none') || panels[0];
          const code = visible?.querySelector('code')?.textContent || '';
          const success = await copyText(code);
          flashCopyState(copyBtn, success);
        };
        copyBtn.addEventListener('click', onCopy);
        cleanupFns.push(() => copyBtn.removeEventListener('click', onCopy));
      }
    });

    root.querySelectorAll('.code-group').forEach((container) => {
      const tabs = Array.from(container.querySelectorAll('.code-group-tab'));
      const panels = Array.from(container.querySelectorAll('.code-group-panel'));
      if (!tabs.length || !panels.length) return;

      const activate = (nextIndex) => {
        tabs.forEach((tab, idx) => {
          const active = idx === nextIndex;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', active ? 'true' : 'false');
          tab.setAttribute('tabindex', active ? '0' : '-1');
        });

        panels.forEach((panel, idx) => {
          const active = idx === nextIndex;
          panel.style.display = active ? 'block' : 'none';
          panel.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
      };

      const onTabClick = (event) => {
        const index = Number(event.currentTarget.dataset.index || 0);
        activate(index);
      };

      const onTabKeyDown = (event) => {
        const current = Number(event.currentTarget.dataset.index || 0);
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
          return;
        }

        event.preventDefault();
        let next = current;
        if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;

        activate(next);
        tabs[next]?.focus();
      };

      tabs.forEach((tab, idx) => {
        tab.setAttribute('role', 'tab');
        tab.dataset.index = String(idx);
        tab.addEventListener('click', onTabClick);
        tab.addEventListener('keydown', onTabKeyDown);
        cleanupFns.push(() => {
          tab.removeEventListener('click', onTabClick);
          tab.removeEventListener('keydown', onTabKeyDown);
        });
      });

      const groupTabs = container.querySelector('.code-group-tabs');
      if (groupTabs) groupTabs.setAttribute('role', 'tablist');

      activate(tabs.findIndex((tab) => tab.classList.contains('active')) >= 0
        ? tabs.findIndex((tab) => tab.classList.contains('active'))
        : 0);

      const copyBtn = container.querySelector('.code-group-copy');
      if (copyBtn) {
        const onCopy = async () => {
          const visible = panels.find((panel) => panel.style.display !== 'none') || panels[0];
          const code = visible?.querySelector('code')?.textContent || '';
          const success = await copyText(code);
          flashCopyState(copyBtn, success);
        };
        copyBtn.addEventListener('click', onCopy);
        cleanupFns.push(() => copyBtn.removeEventListener('click', onCopy));
      }
    });

    root.querySelectorAll('.code-block-wrapper .code-copy-btn').forEach((button) => {
      const onCopy = async () => {
        const code = button.closest('.code-block-wrapper')?.querySelector('code')?.textContent || '';
        const success = await copyText(code);
        flashCopyState(button, success);
      };
      button.addEventListener('click', onCopy);
      cleanupFns.push(() => button.removeEventListener('click', onCopy));
    });

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [page?.slug]);

  if (!page) {
    return (
      <div className="p-10">
        <h1>Page Not Found</h1>
        <p className="mt-3 text-sm text-[var(--theme-muted)]">
          The page <code>{currentSlug || 'index'}</code> was not found for this version and language.
        </p>
      </div>
    );
  }

  const breadcrumbParts = page.slug.split('/').slice(0, -1);

  return (
    <div className="doc-page-wrapper flex gap-8">
      <article
        ref={articleRef}
        className="doc-entrance min-w-0 flex-1 motion-safe:animate-fade-up"
        onClick={(event) => {
          const anchor = event.target.closest('a[href]');
          if (!anchor) return;
          const href = anchor.getAttribute('href');
          if (!href) return;

          if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) {
            return;
          }

          event.preventDefault();
          navigate({ pathname: href, search: location.search });
        }}
      >
        {breadcrumbParts.length > 0 && (
          <div className="breadcrumbs mb-6 flex items-center gap-2 text-xs text-[var(--theme-muted)]">
            <Link to={{ pathname: '/introduction', search: location.search }}>Home</Link>
            {breadcrumbParts.map((part, index) => (
              <React.Fragment key={index}>
                <span>/</span>
                <span>{part}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {page.title && <h1 className="mb-3 text-4xl font-bold tracking-tight">{page.title}</h1>}
        {page.description && (
          <p className="page-description mb-8 max-w-3xl text-lg text-[var(--theme-muted)]">{page.description}</p>
        )}

        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[var(--theme-muted)]">
          <span className="inline-flex items-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-soft)] px-2.5 py-1">
            {page.readingMinutes || 1} min read
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-soft)] px-2.5 py-1">
            {(page.wordCount || 0).toLocaleString()} words
          </span>
          {page.sourceUpdatedAt && (
            <span className="inline-flex items-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-soft)] px-2.5 py-1">
              Updated {new Date(page.sourceUpdatedAt).toLocaleDateString()}
            </span>
          )}
          {page.contentHash && (
            <span className="inline-flex items-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-soft)] px-2.5 py-1">
              Rev {String(page.contentHash).slice(0, 8)}
            </span>
          )}
        </div>

        <PageBlocks blocks={pageBlocks.filter((block) => (block.position || 'beforeContent') === 'beforeContent')} />

        <VersionDiffPanel contextKey={contextKey} pageSlug={page.slug} />

        <div
          className="prose prose-lg max-w-none prose-headings:text-[var(--theme-text)] prose-a:text-[var(--theme-accent)] prose-p:text-[var(--theme-text)] prose-strong:text-[var(--theme-text)]"
          dangerouslySetInnerHTML={{ __html: page.html }}
        />

        <PageBlocks blocks={pageBlocks.filter((block) => block.position === 'afterContent')} />

        {(previousPage || nextPage) && (
          <nav className="doc-pager mt-12 grid gap-3 sm:grid-cols-2" aria-label="Document pagination">
            {previousPage ? (
              <Link
                to={{ pathname: `/${previousPage.path}`, search: location.search }}
                className="doc-pager-link prev rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-soft)]/50 p-4 transition hover:border-[var(--theme-accent)]"
                onClick={() => onTabChange(previousPage.tabId)}
              >
                <span className="doc-pager-label-row">
                  <span className="doc-pager-arrow" aria-hidden="true">←</span>
                  <span className="doc-pager-label">Previous</span>
                </span>
                <span className="doc-pager-title">{previousPage.title}</span>
                <span className="doc-pager-meta">{previousPage.groupName}</span>
              </Link>
            ) : (
              <div className="doc-pager-spacer" />
            )}

            {nextPage ? (
              <Link
                to={{ pathname: `/${nextPage.path}`, search: location.search }}
                className="doc-pager-link next rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-soft)]/50 p-4 text-right transition hover:border-[var(--theme-accent)]"
                onClick={() => onTabChange(nextPage.tabId)}
              >
                <span className="doc-pager-label-row">
                  <span className="doc-pager-label">Next</span>
                  <span className="doc-pager-arrow" aria-hidden="true">→</span>
                </span>
                <span className="doc-pager-title">{nextPage.title}</span>
                <span className="doc-pager-meta">{nextPage.groupName}</span>
              </Link>
            ) : (
              <div className="doc-pager-spacer" />
            )}
          </nav>
        )}
      </article>

      {!readingMode && showToc && <TableOfContents html={page.html} />}
    </div>
  );
}
