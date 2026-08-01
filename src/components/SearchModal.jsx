import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Fuse from 'fuse.js';
import { SHORTCUT_SEARCH } from '../utils/shortcuts';
import docsConfig from '../config/docsConfig';
import { getSearchEntries } from '../content/doclineRuntime';

const MAX_RESULTS = 15;
const searchPlaceholder = docsConfig?.ui?.search?.placeholder || 'Search documentation...';
const noResultsPrefix = docsConfig?.ui?.search?.noResultsPrefix || 'No results found for';

const SYNONYM_GROUPS = [
  ['documentation', 'docs'],
  ['quickstart', 'getting started', 'setup'],
  ['component', 'components', 'ui blocks'],
  ['version', 'release'],
  ['locale', 'language', 'translation', 'i18n'],
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandTerms(query) {
  const normalized = normalize(query);
  const directTerms = normalized.split(' ').filter(Boolean);
  const expanded = new Map();

  for (const term of directTerms) {
    expanded.set(term, true);
  }

  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group.map((item) => normalize(item));
    const matched = normalizedGroup.some((item) => directTerms.includes(item) || normalized.includes(item));
    if (!matched) continue;
    for (const item of normalizedGroup) {
      if (!expanded.has(item)) expanded.set(item, false);
    }
  }

  return Array.from(expanded.entries()).map(([term, isDirect]) => ({ term, isDirect }));
}

function scoreEntry(entry, query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const terms = expandTerms(query);
  const title = normalize(entry.title);
  const groupName = normalize(entry.groupName);
  const tabLabel = normalize(entry.tabLabel);
  const text = normalize(entry.text);

  let score = 0;
  if (title.includes(normalizedQuery)) score += 120;
  if (text.includes(normalizedQuery)) score += 40;
  if (groupName.includes(normalizedQuery)) score += 25;
  if (tabLabel.includes(normalizedQuery)) score += 20;

  for (const { term, isDirect } of terms) {
    const factor = isDirect ? 1 : 0.65;
    if (title.includes(term)) score += 35 * factor;
    if (groupName.includes(term)) score += 20 * factor;
    if (tabLabel.includes(term)) score += 15 * factor;
    if (text.includes(term)) score += 8 * factor;
  }

  return score;
}

function extractSnippet(entry, query) {
  const source = String(entry.text || '');
  if (!source) return '';

  const terms = expandTerms(query).map((item) => item.term).filter((term) => term.length > 1);
  const sourceLower = source.toLowerCase();
  let firstMatch = -1;
  let matchLength = 0;

  for (const term of terms) {
    const idx = sourceLower.indexOf(term.toLowerCase());
    if (idx !== -1 && (firstMatch === -1 || idx < firstMatch)) {
      firstMatch = idx;
      matchLength = term.length;
    }
  }

  if (firstMatch === -1) {
    return source.slice(0, 150);
  }

  const start = Math.max(0, firstMatch - 45);
  const end = Math.min(source.length, firstMatch + matchLength + 85);
  const prefix = start > 0 ? '... ' : '';
  const suffix = end < source.length ? ' ...' : '';
  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlighted(text, query) {
  const terms = expandTerms(query)
    .map((item) => item.term)
    .filter((term) => term.length > 1)
    .sort((a, b) => b.length - a.length);

  if (!text || terms.length === 0) return text;

  const regex = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'ig');
  const parts = String(text).split(regex);

  return parts.map((part, index) => {
    const isMatch = terms.some((term) => term.toLowerCase() === part.toLowerCase());
    if (!isMatch) return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    return <mark key={`${part}-${index}`}>{part}</mark>;
  });
}

export default function SearchModal({ isOpen, onClose, onNavigate, contextKey }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const entries = useMemo(() => getSearchEntries(contextKey), [contextKey]);
  const quickSuggestions = useMemo(() => {
    const bucket = new Map();
    for (const item of entries) {
      const key = `${item.tabLabel}::${item.groupName}`;
      if (bucket.has(key)) continue;
      bucket.set(key, item);
      if (bucket.size >= 6) break;
    }
    return Array.from(bucket.values());
  }, [entries]);
  const fuse = useMemo(() => new Fuse(entries, {
    includeScore: true,
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'title', weight: 0.45 },
      { name: 'groupName', weight: 0.2 },
      { name: 'tabLabel', weight: 0.15 },
      { name: 'description', weight: 0.1 },
      { name: 'text', weight: 0.1 },
    ],
  }), [entries]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const weighted = entries
      .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const fuzzy = fuse.search(query).map((hit) => ({
      entry: hit.item,
      score: Math.max(0, 110 - Math.round((hit.score || 1) * 100)),
    }));

    const merged = new Map();
    for (const item of [...weighted, ...fuzzy]) {
      const key = item.entry.slug;
      const current = merged.get(key);
      if (!current || item.score > current.score) {
        merged.set(key, item);
      }
    }

    const ranked = [...merged.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((item) => ({ ...item.entry, _snippet: extractSnippet(item.entry, query) }));

    setResults(ranked);
    setSelectedIndex(0);
  }, [entries, query]);

  function handleSelect(item) {
    if (!item) return;
    onNavigate(item.tabId);
    navigate({ pathname: `/${item.slug}`, search: location.search });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 px-4 pt-16" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-panel)] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[var(--theme-border)] px-4 py-3">
          <svg className="h-4 w-4 text-[var(--theme-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                handleSelect(results[selectedIndex]);
              } else if (event.key === 'Escape') {
                onClose();
              }
            }}
            placeholder={`${searchPlaceholder} (${SHORTCUT_SEARCH.label})`}
            className="w-full bg-transparent text-sm text-[var(--theme-text)] outline-none"
          />

          {query && (
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-2 py-1 text-[10px] text-[var(--theme-muted)] transition hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)]"
              onClick={() => {
                setQuery('');
                setResults([]);
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-b border-[var(--theme-border)]/60 px-4 py-2 text-[11px] text-[var(--theme-muted)]">
          <span>Press ↑ ↓ to navigate, Enter to open, Esc to close</span>
          <span className="rounded-md border border-[var(--theme-border)] px-1.5 py-0.5 font-mono">{SHORTCUT_SEARCH.label}</span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query.trim() && quickSuggestions.length > 0 && (
            <div className="px-3 py-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--theme-muted)]">Quick jump</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {quickSuggestions.map((item) => (
                  <button
                    key={`suggest-${item.slug}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-soft)]/45 px-3 py-2 text-left transition hover:border-[var(--theme-accent)] hover:bg-[var(--theme-accent-soft)]/35"
                  >
                    <p className="text-sm font-semibold text-[var(--theme-text)]">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--theme-muted)]">{item.tabLabel} • {item.groupName}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-3 py-5 text-sm text-[var(--theme-muted)]">
              <p>{noResultsPrefix} <strong>{query}</strong></p>
              <p className="mt-1 text-xs text-[var(--theme-muted)]/90">Try shorter terms, synonyms, or page names like quickstart, components, or code-ux-demo.</p>
            </div>
          )}

          {results.map((item, index) => (
            <button
              key={`${item.slug}-${index}`}
              type="button"
              onClick={() => handleSelect(item)}
              className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                selectedIndex === index
                  ? 'bg-[var(--theme-accent-soft)]'
                  : 'hover:bg-[var(--theme-bg-soft)]'
              }`}
            >
              <p className="text-sm font-semibold text-[var(--theme-text)]">{renderHighlighted(item.title, query)}</p>
              <p className="mt-1 text-xs text-[var(--theme-muted)]">{item.tabLabel} • {item.groupName}</p>
              {item._snippet && (
                <p className="mt-2 text-xs text-[var(--theme-muted)]">{renderHighlighted(item._snippet, query)}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
