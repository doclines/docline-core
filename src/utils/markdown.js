import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { renderIconBadge, renderNamedIconBadge } from './icons.js';

// Use basic marked config with syntax highlighting
marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const info = parseFenceInfo(lang || '');
      const codeLang = String(info.language || '').toLowerCase();
      const isTerminalLang = ['bash', 'sh', 'shell', 'zsh'].includes(codeLang);
      const wrapperClass = isTerminalLang ? 'code-block-wrapper is-terminal' : 'code-block-wrapper';
      const wrapperClasses = info.fileName ? `${wrapperClass} has-filename` : wrapperClass;
      const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = highlightCode(escaped, info.language || '');
      const label = info.fileName
        ? `<span class="code-filename">${escapeHtml(info.fileName)}</span>`
        : `<span class="code-language">${escapeHtml((info.language || 'text').toUpperCase())}</span>`;
      return `<div class="${wrapperClasses}"><div class="code-block-toolbar">${label}<button class="code-copy-btn" title="Copy">Copy</button></div><pre><code class="language-${info.language || ''}">${highlighted}</code></pre></div>`;
    }
  }
});

function parseFenceInfo(rawInfo) {
  const info = String(rawInfo || '').trim();
  if (!info) {
    return { language: '', fileName: '' };
  }

  const withoutHighlight = info.replace(/\{\s*[\d,\-\s]+\s*\}/g, '').trim();
  const tokens = withoutHighlight.split(/\s+/).filter(Boolean);
  const language = tokens[0] || '';
  const fileName = tokens.slice(1).join(' ').replace(/^['"`]|['"`]$/g, '').trim();
  return { language, fileName };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function preprocessComponents(source) {
  let html = source;

  // Remove JSX-style imports
  html = html.replace(/^import\s+.*$/gm, '');

  // Remove {/* comments */}
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // Remove MDX/JS export statements, but keep shell commands like
  // `export DATABASE_URL=...` inside fenced bash blocks.
  html = html.replace(/^export\s+(default\s+|const\s+|function\s+|class\s+|\{|\*)[^\n]*$/gm, '');

  // <Tip> -> callout-tip
  html = html.replace(/<Tip>([\s\S]*?)<\/Tip>/gi, (_, content) =>
    `\n\n<div class="callout callout-tip">\n\n${content.trim()}\n\n</div>\n\n`
  );

  // <Note> / <Info> -> callout-note
  html = html.replace(/<Note>([\s\S]*?)<\/Note>/gi, (_, content) =>
    `\n\n<div class="callout callout-note">\n\n${content.trim()}\n\n</div>\n\n`
  );
  html = html.replace(/<Info>([\s\S]*?)<\/Info>/gi, (_, content) =>
    `\n\n<div class="callout callout-note">\n\n${content.trim()}\n\n</div>\n\n`
  );

  // <Check> -> callout-tip
  html = html.replace(/<Check>([\s\S]*?)<\/Check>/gi, (_, content) =>
    `\n\n<div class="callout callout-tip">\n\n${content.trim()}\n\n</div>\n\n`
  );

  // <Warning> -> callout-warning
  html = html.replace(/<Warning>([\s\S]*?)<\/Warning>/gi, (_, content) =>
    `\n\n<div class="callout callout-warning">\n\n${content.trim()}\n\n</div>\n\n`
  );

  // Generic <Callout type="tip|note|warning">
  html = html.replace(/<Callout\s+type="([^"]+)"[^>]*>([\s\S]*?)<\/Callout>/gi, (_, type, content) => {
    const t = String(type || '').toLowerCase();
    const cls = t === 'warning' ? 'callout-warning' : t === 'tip' || t === 'check' ? 'callout-tip' : 'callout-note';
    return `\n\n<div class="callout ${cls}">\n\n${content.trim()}\n\n</div>\n\n`;
  });

  // <CardGroup cols={N}> -> card-group
  html = html.replace(/<CardGroup[^>]*cols=\{(\d+)\}[^>]*>([\s\S]*?)<\/CardGroup>/gi, (_, cols, content) =>
    `\n\n<div class="card-group" style="grid-template-columns:repeat(${cols},1fr)">${processCards(content)}</div>\n\n`
  );
  html = html.replace(/<CardGroup[^>]*>([\s\S]*?)<\/CardGroup>/gi, (_, content) =>
    `\n\n<div class="card-group">${processCards(content)}</div>\n\n`
  );

  // Standalone <Card> outside of CardGroup
  html = html.replace(/<Card\s+title="([^"]*)"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/Card>/gi, (_, title, href, content) =>
    `\n\n<a href="${href}" style="text-decoration:none;color:inherit"><div class="card"><h3>${title}</h3><p>${content.trim()}</p></div></a>\n\n`
  );
  html = html.replace(/<Card\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/Card>/gi, (_, title, content) =>
    `\n\n<div class="card"><h3>${title}</h3><p>${content.trim()}</p></div>\n\n`
  );

  // <Steps> / <Step>
  html = html.replace(/<Steps>([\s\S]*?)<\/Steps>/gi, (_, content) => {
    const steps = processSteps(content);
    return `\n\n<div class="steps">${steps}</div>\n\n`;
  });

  // <Tabs> / <Tab>
  html = html.replace(/<Tabs>([\s\S]*?)<\/Tabs>/gi, (_, content) => {
    const tabs = processTabs(content);
    return `\n\n<div class="tabs-static">${tabs}</div>\n\n`;
  });

  // <CodeGroup> - process into tabbed code panels
  html = html.replace(/<CodeGroup>([\s\S]*?)<\/CodeGroup>/gi, (_, content) => {
    return `\n\n${processCodeGroup(content)}\n\n`;
  });

  // <Columns> / <Column>
  html = html.replace(/<Columns[^>]*cols=\{(\d+)\}[^>]*>([\s\S]*?)<\/Columns>/gi, (_, cols, content) => {
    return `\n\n<div class="doc-columns" style="grid-template-columns:repeat(${cols},minmax(0,1fr))">${processColumns(content)}</div>\n\n`;
  });
  html = html.replace(/<Columns[^>]*>([\s\S]*?)<\/Columns>/gi, (_, content) => {
    return `\n\n<div class="doc-columns">${processColumns(content)}</div>\n\n`;
  });

  // <BadgeGroup> / <Badge>
  html = html.replace(/<BadgeGroup[^>]*>([\s\S]*?)<\/BadgeGroup>/gi, (_, content) => {
    return `\n\n<div class="doc-badge-group">${processBadges(content)}</div>\n\n`;
  });
  html = html.replace(/<Badge\s+color="([^"]+)"[^>]*>([\s\S]*?)<\/Badge>/gi, (_, color, content) => {
    const tone = String(color || 'neutral').toLowerCase().replace(/[^a-z-]/g, '');
    return `<span class="doc-badge is-${tone}">${content.trim()}</span>`;
  });
  html = html.replace(/<Badge[^>]*>([\s\S]*?)<\/Badge>/gi, (_, content) => {
    return `<span class="doc-badge">${content.trim()}</span>`;
  });

  // <AccordionGroup> wrapper
  html = html.replace(/<AccordionGroup[^>]*>([\s\S]*?)<\/AccordionGroup>/gi, (_, content) => `\n\n${content}\n\n`);

  // <Accordion>
  html = html.replace(/<Accordion\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/Accordion>/gi, (_, title, content) =>
    `\n\n<details class="accordion"><summary>${title}</summary>\n\n${content.trim()}\n\n</details>\n\n`
  );

  // <Frame>
  html = html.replace(/<Frame[^>]*caption="([^"]*)"[^>]*>([\s\S]*?)<\/Frame>/gi, (_, caption, content) =>
    `\n\n<figure class="frame">${content.trim()}<figcaption>${caption}</figcaption></figure>\n\n`
  );
  html = html.replace(/<Frame[^>]*>([\s\S]*?)<\/Frame>/gi, (_, content) =>
    `\n\n<figure class="frame">${content.trim()}</figure>\n\n`
  );

  // <Snippet> — just remove the tag
  html = html.replace(/<Snippet\s+file="[^"]*"\s*\/>/gi, '');

  return html;
}

function processCodeGroup(content) {
  // Extract code fences with optional titles: ```lang Title\n...\n```
  const fenceRegex = /```(\w*)\s*(.*?)\n([\s\S]*?)```/g;
  let match;
  const panels = [];
  while ((match = fenceRegex.exec(content)) !== null) {
    const lang = match[1] || '';
    const title = match[2].trim() || lang || 'Code';
    const code = match[3].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const highlighted = highlightCode(code, lang);
    panels.push({ lang, title, code: highlighted });
  }
  if (panels.length === 0) {
    return `<div class="code-group">${content}</div>`;
  }
  const id = 'cg-' + Math.random().toString(36).slice(2, 8);
  let html = `<div class="code-group" data-id="${id}">`;
  html += '<div class="code-group-tabs">';
  panels.forEach((p, i) => {
    html += `<button class="code-group-tab${i === 0 ? ' active' : ''}" data-index="${i}">${p.title}</button>`;
  });
  html += '<button class="code-group-copy" title="Copy">Copy</button>';
  html += '</div>';
  panels.forEach((panel, i) => {
    html += `<div class="code-group-panel" style="display:${i === 0 ? 'block' : 'none'}">`;
    html += `<pre><code class="language-${panel.lang}">${panel.code}</code></pre>`;
    html += `</div>`;
  });
  html += '</div>';
  return html;
}

function processCards(content) {
  let result = '';
  const cardRegex = /<Card\s+title="([^"]*)"([^>]*)>([\s\S]*?)<\/Card>/gi;
  let match;
  while ((match = cardRegex.exec(content)) !== null) {
    const title = match[1];
    const attrs = match[2];
    const body = match[3].trim();
    const hrefMatch = attrs.match(/href="([^"]*)"/);
    const iconMatch = attrs.match(/icon="([^"]*)"/);
    const badge = iconMatch
      ? renderNamedIconBadge(iconMatch[1], title, hrefMatch?.[1] || '')
      : renderIconBadge(title, hrefMatch?.[1] || '');

    const inner = `${badge}<h3>${title}</h3>${body ? `<p>${body}</p>` : ''}`;
    if (hrefMatch) {
      result += `<a href="${hrefMatch[1]}" class="card">${inner}</a>`;
    } else {
      result += `<div class="card">${inner}</div>`;
    }
  }
  return result || content;
}

function processSteps(content) {
  let result = '';
  const stepRegex = /<Step\s*(?:title="([^"]*)")?[^>]*>([\s\S]*?)<\/Step>/gi;
  let match;
  while ((match = stepRegex.exec(content)) !== null) {
    const title = match[1] || '';
    let body = match[2].trim();
    // Process nested Tabs within Steps
    body = body.replace(/<Tabs>([\s\S]*?)<\/Tabs>/gi, (_, tabContent) => {
      return `<div class="tabs-static">${processTabs(tabContent)}</div>`;
    });
    // Process nested CodeGroup within Steps
    body = body.replace(/<CodeGroup>([\s\S]*?)<\/CodeGroup>/gi, (_, cgContent) => {
      return processCodeGroup(cgContent);
    });
    // Process nested Note/Tip/Warning within Steps
    body = body.replace(/<Note>([\s\S]*?)<\/Note>/gi, (_, c) => `<div class="callout callout-note">${c.trim()}</div>`);
    body = body.replace(/<Tip>([\s\S]*?)<\/Tip>/gi, (_, c) => `<div class="callout callout-tip">${c.trim()}</div>`);
    body = body.replace(/<Warning>([\s\S]*?)<\/Warning>/gi, (_, c) => `<div class="callout callout-warning">${c.trim()}</div>`);
    // Process code fences that are directly in the step body (not inside tabs)
    body = body.replace(/```(\w*)\s*(.*?)\n([\s\S]*?)```/g, (_, lang, t, code) => {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = highlightCode(escaped, lang);
      return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
    });
    // Process inline markdown in remaining text
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    body = body.replace(/`([^`]+)`/g, '<code>$1</code>');
    body = body.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Wrap plain text paragraphs (lines not starting with HTML)
    body = body.split('\n\n').map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      return `<p>${trimmed}</p>`;
    }).join('\n');
    result += `<div class="step">${title ? `<h4>${title}</h4>` : ''}${body}</div>`;
  }
  return result || content;
}

function processColumns(content) {
  let result = '';
  const colRegex = /<Column\s*[^>]*>([\s\S]*?)<\/Column>/gi;
  let match;
  while ((match = colRegex.exec(content)) !== null) {
    let body = match[1].trim();
    body = body.replace(/```(\w*)\s*(.*?)\n([\s\S]*?)```/g, (_, lang, t, code) => {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = highlightCode(escaped, lang);
      return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
    });
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    body = body.replace(/`([^`]+)`/g, '<code>$1</code>');
    body = body.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    body = body.split('\n\n').map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      return `<p>${trimmed}</p>`;
    }).join('\n');
    result += `<div class="doc-column">${body}</div>`;
  }
  return result || content;
}

function processBadges(content) {
  let out = content;
  out = out.replace(/<Badge\s+color="([^"]+)"[^>]*>([\s\S]*?)<\/Badge>/gi, (_, color, c) => {
    const tone = String(color || 'neutral').toLowerCase().replace(/[^a-z-]/g, '');
    return `<span class="doc-badge is-${tone}">${c.trim()}</span>`;
  });
  out = out.replace(/<Badge[^>]*>([\s\S]*?)<\/Badge>/gi, (_, c) => `<span class="doc-badge">${c.trim()}</span>`);
  return out;
}

function processTabs(content) {
  const tabs = [];
  const tabRegex = /<Tab\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/Tab>/gi;
  let match;
  while ((match = tabRegex.exec(content)) !== null) {
    const title = match[1];
    let body = match[2].trim();
    // Process code fences within tab body
    body = body.replace(/```(\w*)\s*(.*?)\n([\s\S]*?)```/g, (_, lang, title2, code) => {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const highlighted = highlightCode(escaped, lang);
      return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
    });
    // Process inline code
    body = body.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Process basic markdown in remaining body (bold, links, paragraphs)
    body = body.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    body = body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Wrap non-HTML lines in <p> tags
    body = body.split('\n\n').map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return trimmed;
      return `<p>${trimmed}</p>`;
    }).join('\n');
    tabs.push({ title, body });
  }
  if (tabs.length === 0) return content;

  const id = 'tab-' + Math.random().toString(36).slice(2, 8);
  let html = `<div class="tabs-container" data-id="${id}">`;
  html += '<div class="tabs-nav">';
  tabs.forEach((t, i) => {
    html += `<button class="tabs-nav-btn${i === 0 ? ' active' : ''}" data-index="${i}">${t.title}</button>`;
  });
  html += '</div>';
  tabs.forEach((t, i) => {
    html += `<div class="tabs-panel" style="display:${i === 0 ? 'block' : 'none'}">${t.body}</div>`;
  });
  html += '</div>';
  return html;
}

// Icon helpers are in icons.js 

function highlightCode(code, lang) {
  let highlighted = code;
  const replaceOutsideTags = (input, pattern, replacement) => {
    return input
      .split(/(<[^>]+>)/g)
      .map((segment) => {
        if (segment.startsWith('<') && segment.endsWith('>')) {
          return segment;
        }
        return segment.replace(pattern, replacement);
      })
      .join('');
  };

  const apply = (pattern, replacement) => {
    highlighted = replaceOutsideTags(highlighted, pattern, replacement);
  };

  if (['bash', 'sh', 'shell', 'zsh'].includes(lang)) {
    // Comments
    apply(/(#[^\n]*)/g, '<span class="hljs-comment">$1</span>');
    // Strings (double and single quotes)
    apply(/(&quot;[^&]*?&quot;|"[^"]*?")/g, '<span class="hljs-string">$1</span>');
    apply(/(&#x27;[^&]*?&#x27;|'[^']*?')/g, '<span class="hljs-string">$1</span>');
    // Commands at start of line (common commands)
    apply(/^(\s*)(git|cd|pip|npm|npx|make|docker|export|poetry|code|curl|wget|mkdir|cp|mv|rm|echo|cat|ls|chmod|chown|source|brew|apt|yum|sudo)\b/gm, '$1<span class="hljs-keyword">$2</span>');
    // Flags
    apply(/(\s)(--?[a-zA-Z][\w-]*)/g, '$1<span class="hljs-attr">$2</span>');
    // URLs
    apply(/(https?:\/\/[^\s&<]+)/g, '<span class="hljs-string">$1</span>');
  } else if (['python', 'py'].includes(lang)) {
    // Comments
    apply(/(#[^\n]*)/g, '<span class="hljs-comment">$1</span>');
    // Strings
    apply(/(&quot;[^&]*?&quot;|"[^"]*?")/g, '<span class="hljs-string">$1</span>');
    apply(/(&#x27;[^&]*?&#x27;|'[^']*?')/g, '<span class="hljs-string">$1</span>');
    // Keywords
    apply(/\b(import|from|def|class|return|if|elif|else|for|while|try|except|finally|with|as|yield|raise|pass|break|continue|and|or|not|in|is|None|True|False|self|async|await)\b/g, '<span class="hljs-keyword">$1</span>');
    // Built-in functions
    apply(/\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|open|super)\b/g, '<span class="hljs-built_in">$1</span>');
  } else if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(lang)) {
    // Comments
    apply(/(\/\/[^\n]*)/g, '<span class="hljs-comment">$1</span>');
    // Strings
    apply(/(&quot;[^&]*?&quot;|"[^"]*?")/g, '<span class="hljs-string">$1</span>');
    apply(/(&#x27;[^&]*?&#x27;|'[^']*?')/g, '<span class="hljs-string">$1</span>');
    apply(/(`[^`]*?`)/g, '<span class="hljs-string">$1</span>');
    // Keywords
    apply(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|new|this|typeof|instanceof|async|await|try|catch|finally|throw|switch|case|break|continue)\b/g, '<span class="hljs-keyword">$1</span>');
  } else if (['yaml', 'yml'].includes(lang)) {
    // Comments
    apply(/(#[^\n]*)/g, '<span class="hljs-comment">$1</span>');
    // Keys
    apply(/^(\s*)([\w-]+)(\s*:)/gm, '$1<span class="hljs-attr">$2</span>$3');
    // Strings
    apply(/(&quot;[^&]*?&quot;|"[^"]*?")/g, '<span class="hljs-string">$1</span>');
    // Booleans/null
    apply(/\b(true|false|null|yes|no)\b/g, '<span class="hljs-keyword">$1</span>');
  }
  return highlighted;
}

function normalizeIndentedCodeFences(source) {
  const lines = source.split('\n');
  const result = [];
  let inFence = false;
  let fenceIndent = '';
  let fenceMarker = '';

  function stripFenceIndent(line, indent) {
    let out = line;
    for (const ch of indent) {
      if (ch === ' ') {
        if (out.startsWith(' ')) out = out.slice(1);
        else break;
      } else if (ch === '\t') {
        if (out.startsWith('\t')) out = out.slice(1);
        // Allow tab-equivalent indentation represented as 4 spaces.
        else if (out.startsWith('    ')) out = out.slice(4);
        else break;
      }
    }
    return out;
  }

  for (const line of lines) {
    if (!inFence) {
      const m = line.match(/^([ \t]{1,8})(```+|~~~+)(.*)/);
      if (m) {
        inFence = true;
        fenceIndent = m[1];
        fenceMarker = m[2];
        result.push(m[2] + m[3]); // strip leading indent from opening fence
      } else {
        result.push(line);
      }
    } else {
      // Check if this line is the closing fence
      const closeMatch = line.match(/^([ \t]{0,8})(```+|~~~+)\s*$/);
      if (closeMatch && closeMatch[2][0] === fenceMarker[0] && closeMatch[2].length >= fenceMarker.length) {
        inFence = false;
        result.push(closeMatch[2]); // closing fence without indent
      } else {
        // Strip the same indentation pattern from content lines.
        result.push(stripFenceIndent(line, fenceIndent));
      }
    }
  }

  return result.join('\n');
}

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'foreignObject'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data:image\/(?:png|gif|jpeg|webp|svg\+xml);base64)|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: [
      'class',
      'id',
      'style',
      'title',
      'data-id',
      'data-index',
      'aria-label',
      'aria-hidden',
      'role',
      'viewBox',
      'fill',
      'stroke',
      'stroke-width',
      'stroke-linecap',
      'stroke-linejoin',
      'cx',
      'cy',
      'r',
      'x1',
      'y1',
      'x2',
      'y2',
      'points',
      'd',
      'rx',
      'ry',
      'width',
      'height',
    ],
  });
}

function convertPureLinkListsToCards(html) {
  return html.replace(/<ul>\s*([\s\S]*?)\s*<\/ul>/gi, (match, items) => {
    const liPattern = /<li>([\s\S]*?)<\/li>/gi;
    const parsed = [];
    let li;

    while ((li = liPattern.exec(items)) !== null) {
      const liHtml = li[1].trim();
      const anchorMatch = liHtml.match(/^\s*<a href="([^"]+)">([\s\S]*?)<\/a>([\s\S]*)$/i);
      if (!anchorMatch) {
        return match;
      }

      const href = anchorMatch[1].trim();
      const label = anchorMatch[2].replace(/<[^>]+>/g, '').trim();
      let extra = (anchorMatch[3] || '').trim();
      extra = extra.replace(/^\s*[\-–—:]\s*/, '').trim();

      parsed.push({ href, label, extra });
    }

    if (!parsed.length) return match;

    const cards = parsed.map(({ href, label, extra }) => {
      const badge = renderIconBadge(label, href);
      const body = extra ? `<p>${extra}</p>` : '';
      return `<a href="${href}" class="card">${badge}<h3>${label}</h3>${body}</a>`;
    }).join('');

    return `<div class="card-group">${cards}</div>`;
  });
}

export function renderMarkdown(source, options = {}) {
  const { enableAutoLinkCards = false } = options;
  // 0. Normalize indented fenced code blocks before any other processing
  source = normalizeIndentedCodeFences(source);

  // 1. Pre-process: convert Mintlify components to HTML before marked runs
  let processed = preprocessComponents(source);

  // Clean up "Title >> Subtitle" heading separators → use an em-dash
  processed = processed.replace(/^(#{1,6}\s.*?)\s*>>\s*(.*)$/gm, '$1 — $2');

  // Remove self-closing JSX tags we can't handle (e.g. <Snippet file="..." />)
  processed = processed.replace(/<[A-Z][a-zA-Z]*\s+[^>]*\/>/g, '');

  // Remove remaining unknown block-level JSX tags (capitalized)
  processed = processed.replace(/<\/?[A-Z][a-zA-Z]*[^>]*>/g, '');

  // Remove JSX expressions like {variable} that aren't in code blocks
  processed = processed.replace(/(?<!`)\{[a-zA-Z_][a-zA-Z0-9_.]*\}(?!`)/g, '');

  // 2. Convert markdown to HTML
  let html = marked.parse(processed);

  // 3. Clean up any wrapped <p> around block-level divs
  html = html.replace(/<p>\s*(<div[^>]*>)/g, '$1');
  html = html.replace(/(<\/div>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<a[^>]*><div[^>]*>)/g, '$1');
  html = html.replace(/(<\/div><\/a>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<details[^>]*>)/g, '$1');
  html = html.replace(/(<\/details>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<figure[^>]*>)/g, '$1');
  html = html.replace(/(<\/figure>)\s*<\/p>/g, '$1');

  if (enableAutoLinkCards) {
    html = convertPureLinkListsToCards(html);
  }

  // Fix heading IDs for TOC scroll spy and ensure they are unique per page.
  const headingIdCounts = new Map();
  html = html.replace(/<h([23456])>(.*?)<\/h[23456]>/gi, (match, level, text) => {
    const plainText = text.replace(/<[^>]*>/g, '');
    const baseId = plainText
      .toLowerCase()
      .replace(/[^\w\s-]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/(^-|-$)/g, '') || 'section';
    const seen = (headingIdCounts.get(baseId) || 0) + 1;
    headingIdCounts.set(baseId, seen);
    const id = seen === 1 ? baseId : `${baseId}-${seen}`;
    return `<h${level} id="${id}">${text}</h${level}>`;
  });

  return html;
}
