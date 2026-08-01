import React, { useState, useEffect, useRef } from 'react';

export default function TableOfContents({ html }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const listRef = useRef(null);
  const activeIdRef = useRef('');

  // Extract headings from rendered HTML
  useEffect(() => {
    if (!html) return;
    const regex = /<h([23])\s+id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
    const found = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      found.push({
        level: parseInt(match[1]),
        id: match[2],
        text: match[3].replace(/<[^>]*>/g, ''), // strip inner HTML tags
      });
    }
    setHeadings(found);
  }, [html]);

  // Scroll spy aligned to the docs content scroll container
  useEffect(() => {
    if (headings.length === 0) return;

    const contentRoot = document.querySelector('.content');
    if (!contentRoot) return;

    const headingEls = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean);
    if (headingEls.length === 0) return;

    let headingPositions = [];

    const recalculatePositions = () => {
      const rootTop = contentRoot.getBoundingClientRect().top;
      const baseScrollTop = contentRoot.scrollTop;
      headingPositions = headingEls.map((el) => ({
        id: el.id,
        top: baseScrollTop + (el.getBoundingClientRect().top - rootTop),
      }));
    };

    const updateActiveHeading = () => {
      const threshold = contentRoot.scrollTop + 120;

      let candidateId = headingPositions[0]?.id || '';
      for (const heading of headingPositions) {
        if (heading.top <= threshold) {
          candidateId = heading.id;
        } else {
          break;
        }
      }

      if (candidateId && candidateId !== activeIdRef.current) {
        activeIdRef.current = candidateId;
        setActiveId(candidateId);
      }
    };

    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        updateActiveHeading();
        rafId = null;
      });
    };

    const onResize = () => {
      recalculatePositions();
      onScroll();
    };

    recalculatePositions();
    contentRoot.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    updateActiveHeading();

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      contentRoot.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [headings]);

  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const activeEl = listRef.current.querySelector(`a[href="#${activeId}"]`);
    if (!activeEl) return;

    const container = listRef.current;
    const activeTop = activeEl.offsetTop;
    const activeBottom = activeTop + activeEl.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    if (activeTop < viewTop) {
      container.scrollTop = Math.max(0, activeTop - 8);
    } else if (activeBottom > viewBottom) {
      container.scrollTop = activeBottom - container.clientHeight + 8;
    }
  }, [activeId]);

  if (headings.length < 2) return null;

  const scrollToHeading = (id) => {
    const contentRoot = document.querySelector('.content');
    const target = document.getElementById(id);
    if (!contentRoot || !target) return;

    const rootTop = contentRoot.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    const offset = 20;
    const top = contentRoot.scrollTop + (targetTop - rootTop) - offset;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    contentRoot.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
    setActiveId(id);
  };

  return (
    <aside className="app-toc sticky top-24 hidden h-[calc(100vh-7rem)] w-[280px] overflow-hidden rounded-3xl border border-[var(--theme-border)] bg-[var(--theme-sidebar)]/70 p-4 backdrop-blur md:block">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--theme-muted)]">On this page</div>
      <nav ref={listRef} className="hide-scrollbar h-full overflow-y-auto pr-1">
        {headings.map((h, idx) => (
          <a
            key={`${h.id}-${idx}`}
            href={`#${h.id}`}
            className={`mb-1 block rounded-lg px-2 py-1.5 text-sm transition-colors ${
              h.level === 3 ? 'ml-3 text-xs' : ''
            } ${
              activeId === h.id
                ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent)]'
                : 'text-[var(--theme-muted)] hover:bg-[var(--theme-bg)] hover:text-[var(--theme-text)]'
            }`}
            onClick={(e) => {
              e.preventDefault();
              scrollToHeading(h.id);
            }}
          >
            <span>{h.text}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
