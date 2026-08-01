import docsConfig from '../config/docsConfig';

const SEMANTIC_TOKEN_KEYS = [
  '--surface-page',
  '--surface-panel',
  '--surface-code',
  '--surface-elevated',
  '--text-primary',
  '--text-muted',
  '--text-inverse',
  '--action-primary',
  '--action-accent',
  '--action-danger',
  '--action-success',
  '--data-viz-1',
  '--data-viz-2',
  '--data-viz-3',
  '--data-viz-4',
  '--data-viz-5',
  '--data-viz-6',
  '--data-viz-7',
  '--data-viz-8',
];

const THEME_PALETTES = {
  'ayu-light': {
    '--theme-bg': '#faf7ef',
    '--theme-bg-soft': '#f2ebdc',
    '--theme-panel': '#fffcf6',
    '--theme-sidebar': '#f6efde',
    '--theme-text': '#2a2620',
    '--theme-muted': '#6f6558',
    '--theme-border': '#decfb6',
    '--theme-accent': '#cd6b2e',
    '--theme-accent-soft': '#f8d7bd',
    '--theme-code-bg': '#f1e8d8',
    '--theme-code-text': '#1f2937',
    '--theme-code-inline-bg': '#e9dec9',
    '--theme-code-inline-text': '#7c2d12',
    '--theme-code-comment': '#5f6773',
    '--theme-code-keyword': '#9a3412',
    '--theme-code-string': '#0c4a6e',
    '--theme-code-attr': '#166534',
    '--theme-code-built-in': '#5b21b6',
    '--theme-code-number': '#0f766e',
    '--theme-aurora-a': 'rgba(228, 162, 98, 0.24)',
    '--theme-aurora-b': 'rgba(227, 224, 169, 0.2)',
  },
  'catppuccin-latte': {
    '--theme-bg': '#eff1f5',
    '--theme-bg-soft': '#e6e9ef',
    '--theme-panel': '#f8f9fb',
    '--theme-sidebar': '#e7eaf2',
    '--theme-text': '#4c4f69',
    '--theme-muted': '#6c6f85',
    '--theme-border': '#cdd2df',
    '--theme-accent': '#1e66f5',
    '--theme-accent-soft': '#dbe7ff',
    '--theme-code-bg': '#e6e9ef',
    '--theme-code-text': '#313244',
    '--theme-code-inline-bg': '#dde2ea',
    '--theme-code-inline-text': '#1d4ed8',
    '--theme-code-comment': '#7b8198',
    '--theme-code-keyword': '#8839ef',
    '--theme-code-string': '#0f766e',
    '--theme-code-attr': '#1d4ed8',
    '--theme-code-built-in': '#b02a6a',
    '--theme-code-number': '#0e7490',
    '--theme-aurora-a': 'rgba(114, 135, 253, 0.2)',
    '--theme-aurora-b': 'rgba(64, 160, 43, 0.14)',
  },
  'github-light': {
    '--theme-bg': '#f6f8fa',
    '--theme-bg-soft': '#eef2f6',
    '--theme-panel': '#ffffff',
    '--theme-sidebar': '#f3f6f9',
    '--theme-text': '#1f2328',
    '--theme-muted': '#59636e',
    '--theme-border': '#d0d7de',
    '--theme-accent': '#0969da',
    '--theme-accent-soft': '#d7ebff',
    '--theme-code-bg': '#f1f4f8',
    '--theme-code-text': '#0f172a',
    '--theme-code-inline-bg': '#e7edf4',
    '--theme-code-inline-text': '#0b3e91',
    '--theme-code-comment': '#6b7280',
    '--theme-code-keyword': '#7c2d12',
    '--theme-code-string': '#0c4a6e',
    '--theme-code-attr': '#1f6f4a',
    '--theme-code-built-in': '#5b21b6',
    '--theme-code-number': '#0f766e',
    '--theme-aurora-a': 'rgba(5, 80, 174, 0.13)',
    '--theme-aurora-b': 'rgba(46, 160, 67, 0.11)',
  },
  'tokyo-night-storm': {
    '--theme-bg': '#1f2335',
    '--theme-bg-soft': '#24283b',
    '--theme-panel': '#22263a',
    '--theme-sidebar': '#1d2030',
    '--theme-text': '#c0caf5',
    '--theme-muted': '#9aa5ce',
    '--theme-border': '#3b4261',
    '--theme-accent': '#7aa2f7',
    '--theme-accent-soft': '#2c365a',
    '--theme-code-bg': '#1a1f2f',
    '--theme-aurora-a': 'rgba(122, 162, 247, 0.16)',
    '--theme-aurora-b': 'rgba(187, 154, 247, 0.12)',
  },
  'catppuccin-mocha': {
    '--theme-bg': '#11111b',
    '--theme-bg-soft': '#181825',
    '--theme-panel': '#1a1b2b',
    '--theme-sidebar': '#161623',
    '--theme-text': '#cdd6f4',
    '--theme-muted': '#a6adc8',
    '--theme-border': '#313244',
    '--theme-accent': '#89b4fa',
    '--theme-accent-soft': '#243354',
    '--theme-code-bg': '#161626',
    '--theme-aurora-a': 'rgba(137, 180, 250, 0.16)',
    '--theme-aurora-b': 'rgba(245, 194, 231, 0.12)',
  },
  'gruvbox-dark': {
    '--theme-bg': '#282828',
    '--theme-bg-soft': '#32302f',
    '--theme-panel': '#2f2d2c',
    '--theme-sidebar': '#262423',
    '--theme-text': '#ebdbb2',
    '--theme-muted': '#b8a98b',
    '--theme-border': '#504945',
    '--theme-accent': '#d79921',
    '--theme-accent-soft': '#4a3f25',
    '--theme-code-bg': '#1f1d1c',
    '--theme-aurora-a': 'rgba(215, 153, 33, 0.16)',
    '--theme-aurora-b': 'rgba(152, 151, 26, 0.12)',
  },
  'nord-dark': {
    '--theme-bg': '#2e3440',
    '--theme-bg-soft': '#3b4252',
    '--theme-panel': '#353c4a',
    '--theme-sidebar': '#2c323d',
    '--theme-text': '#eceff4',
    '--theme-muted': '#c6cfdd',
    '--theme-border': '#4c566a',
    '--theme-accent': '#88c0d0',
    '--theme-accent-soft': '#364552',
    '--theme-code-bg': '#2b313d',
    '--theme-aurora-a': 'rgba(136, 192, 208, 0.18)',
    '--theme-aurora-b': 'rgba(180, 142, 173, 0.13)',
  },
  'dracula-pro': {
    '--theme-bg': '#1e1f29',
    '--theme-bg-soft': '#282a36',
    '--theme-panel': '#252733',
    '--theme-sidebar': '#1b1d27',
    '--theme-text': '#f8f8f2',
    '--theme-muted': '#c2c6d2',
    '--theme-border': '#44475a',
    '--theme-accent': '#bd93f9',
    '--theme-accent-soft': '#3b3254',
    '--theme-code-bg': '#161821',
    '--theme-aurora-a': 'rgba(189, 147, 249, 0.18)',
    '--theme-aurora-b': 'rgba(80, 250, 123, 0.12)',
  },
  'one-dark-pro': {
    '--theme-bg': '#1f232a',
    '--theme-bg-soft': '#282c34',
    '--theme-panel': '#262b33',
    '--theme-sidebar': '#1b1f26',
    '--theme-text': '#d7dae0',
    '--theme-muted': '#abb2bf',
    '--theme-border': '#3b4048',
    '--theme-accent': '#61afef',
    '--theme-accent-soft': '#2a3b52',
    '--theme-code-bg': '#171b22',
    '--theme-aurora-a': 'rgba(97, 175, 239, 0.18)',
    '--theme-aurora-b': 'rgba(198, 120, 221, 0.12)',
  },
  'night-owl': {
    '--theme-bg': '#011627',
    '--theme-bg-soft': '#0a1f33',
    '--theme-panel': '#082033',
    '--theme-sidebar': '#071a2b',
    '--theme-text': '#d6deeb',
    '--theme-muted': '#9db1c6',
    '--theme-border': '#24435c',
    '--theme-accent': '#7fdbca',
    '--theme-accent-soft': '#1b3b4e',
    '--theme-code-bg': '#061625',
    '--theme-aurora-a': 'rgba(127, 219, 202, 0.15)',
    '--theme-aurora-b': 'rgba(130, 170, 255, 0.12)',
  },
  'solarized-light': {
    '--theme-bg': '#fdf6e3',
    '--theme-bg-soft': '#f5eddb',
    '--theme-panel': '#fffaf0',
    '--theme-sidebar': '#f6efdd',
    '--theme-text': '#586e75',
    '--theme-muted': '#657b83',
    '--theme-border': '#d7c9a9',
    '--theme-accent': '#268bd2',
    '--theme-accent-soft': '#d7e8f5',
    '--theme-code-bg': '#efe7d4',
    '--theme-aurora-a': 'rgba(38, 139, 210, 0.14)',
    '--theme-aurora-b': 'rgba(181, 137, 0, 0.12)',
  },
  'solarized-dark': {
    '--theme-bg': '#002b36',
    '--theme-bg-soft': '#073642',
    '--theme-panel': '#063541',
    '--theme-sidebar': '#022f3b',
    '--theme-text': '#93a1a1',
    '--theme-muted': '#839496',
    '--theme-border': '#24515f',
    '--theme-accent': '#2aa198',
    '--theme-accent-soft': '#1d4c4a',
    '--theme-code-bg': '#012730',
    '--theme-aurora-a': 'rgba(42, 161, 152, 0.15)',
    '--theme-aurora-b': 'rgba(38, 139, 210, 0.11)',
  },
  'material-ocean': {
    '--theme-bg': '#0f111a',
    '--theme-bg-soft': '#1a1c25',
    '--theme-panel': '#1a1d28',
    '--theme-sidebar': '#141720',
    '--theme-text': '#c5cdd9',
    '--theme-muted': '#a7b1c2',
    '--theme-border': '#323a4b',
    '--theme-accent': '#82aaff',
    '--theme-accent-soft': '#2a3857',
    '--theme-code-bg': '#12141c',
    '--theme-aurora-a': 'rgba(130, 170, 255, 0.17)',
    '--theme-aurora-b': 'rgba(199, 146, 234, 0.11)',
  },
};

function defaultDataVizByMode(mode) {
  if (mode === 'dark') {
    return {
      '--data-viz-1': '#7aa2f7',
      '--data-viz-2': '#9ece6a',
      '--data-viz-3': '#f7768e',
      '--data-viz-4': '#e0af68',
      '--data-viz-5': '#bb9af7',
      '--data-viz-6': '#7dcfff',
      '--data-viz-7': '#73daca',
      '--data-viz-8': '#c0caf5',
    };
  }

  return {
    '--data-viz-1': '#2563eb',
    '--data-viz-2': '#16a34a',
    '--data-viz-3': '#dc2626',
    '--data-viz-4': '#d97706',
    '--data-viz-5': '#7c3aed',
    '--data-viz-6': '#0891b2',
    '--data-viz-7': '#0f766e',
    '--data-viz-8': '#475569',
  };
}

function buildSemanticTokens(baseTokens, mode) {
  return {
    '--surface-page': baseTokens['--theme-bg'],
    '--surface-panel': baseTokens['--theme-panel'],
    '--surface-code': baseTokens['--theme-code-bg'],
    '--surface-elevated': baseTokens['--theme-sidebar'],
    '--text-primary': baseTokens['--theme-text'],
    '--text-muted': baseTokens['--theme-muted'],
    '--text-inverse': mode === 'dark' ? '#0b0f1a' : '#ffffff',
    '--action-primary': baseTokens['--theme-accent'],
    '--action-accent': baseTokens['--theme-accent'],
    '--action-danger': mode === 'dark' ? '#f87171' : '#dc2626',
    '--action-success': mode === 'dark' ? '#4ade80' : '#16a34a',
    ...defaultDataVizByMode(mode),
  };
}

const FALLBACK_THEMES = [
  { id: 'ayu-light', label: 'Ayu Light', mode: 'light' },
  { id: 'catppuccin-latte', label: 'Catppuccin Latte', mode: 'light' },
  { id: 'github-light', label: 'GitHub Light', mode: 'light' },
  { id: 'solarized-light', label: 'Solarized Light', mode: 'light' },
  { id: 'tokyo-night-storm', label: 'Tokyo Night Storm', mode: 'dark' },
  { id: 'dracula-pro', label: 'Dracula', mode: 'dark' },
  { id: 'one-dark-pro', label: 'One Dark Pro', mode: 'dark' },
  { id: 'night-owl', label: 'Night Owl', mode: 'dark' },
  { id: 'solarized-dark', label: 'Solarized Dark', mode: 'dark' },
  { id: 'material-ocean', label: 'Material Ocean', mode: 'dark' },
  { id: 'catppuccin-mocha', label: 'Catppuccin Mocha', mode: 'dark' },
  { id: 'gruvbox-dark', label: 'Gruvbox Dark', mode: 'dark' },
  { id: 'nord-dark', label: 'Nord Dark', mode: 'dark' },
];

const configuredThemes = Array.isArray(docsConfig?.themes) && docsConfig.themes.length > 0
  ? docsConfig.themes
  : FALLBACK_THEMES;

const ALL_THEME_TOKENS = Array.from(
  new Set(Object.values(THEME_PALETTES).flatMap((palette) => Object.keys(palette)))
);

const HIGH_CONTRAST_CODE_TOKENS_LIGHT = {
  '--theme-code-bg': '#e9e2d2',
  '--theme-code-text': '#0f172a',
  '--theme-code-inline-bg': '#ddd2bb',
  '--theme-code-inline-text': '#7c2d12',
  '--theme-code-comment': '#475569',
  '--theme-code-keyword': '#9a3412',
  '--theme-code-string': '#0c4a6e',
  '--theme-code-attr': '#14532d',
  '--theme-code-built-in': '#4c1d95',
  '--theme-code-number': '#0f766e',
};

const HIGH_CONTRAST_CODE_TOKENS_DARK = {
  '--theme-code-bg': '#020617',
  '--theme-code-text': '#f8fafc',
  '--theme-code-inline-bg': '#111827',
  '--theme-code-inline-text': '#f1f5f9',
  '--theme-code-comment': '#cbd5e1',
  '--theme-code-keyword': '#fbbf24',
  '--theme-code-string': '#67e8f9',
  '--theme-code-attr': '#86efac',
  '--theme-code-built-in': '#d8b4fe',
  '--theme-code-number': '#5eead4',
};

const DEFAULT_CODE_TOKENS_LIGHT = {
  '--theme-code-text': '#1f2937',
  '--theme-code-inline-bg': '#e9dec9',
  '--theme-code-inline-text': '#7c2d12',
  '--theme-code-comment': '#5f6773',
  '--theme-code-keyword': '#9a3412',
  '--theme-code-string': '#0c4a6e',
  '--theme-code-attr': '#166534',
  '--theme-code-built-in': '#5b21b6',
  '--theme-code-number': '#0f766e',
};

const DEFAULT_CODE_TOKENS_DARK = {
  '--theme-code-text': '#e5e7eb',
  '--theme-code-inline-bg': '#1e293b',
  '--theme-code-inline-text': '#e2e8f0',
  '--theme-code-comment': '#94a3b8',
  '--theme-code-keyword': '#f59e0b',
  '--theme-code-string': '#38bdf8',
  '--theme-code-attr': '#34d399',
  '--theme-code-built-in': '#c084fc',
  '--theme-code-number': '#22d3ee',
};

export const BUILTIN_THEMES = configuredThemes
  .filter((theme) => THEME_PALETTES[theme.id])
  .map((theme) => {
    const mode = theme.mode === 'dark' ? 'dark' : 'light';
    const basePalette = THEME_PALETTES[theme.id];
    const modeCodeDefaults = mode === 'dark' ? DEFAULT_CODE_TOKENS_DARK : DEFAULT_CODE_TOKENS_LIGHT;
    const mergedBase = {
      ...modeCodeDefaults,
      ...basePalette,
    };

    return {
      id: theme.id,
      label: theme.label || theme.id,
      mode,
      colors: {
        ...mergedBase,
        ...buildSemanticTokens(mergedBase, mode),
        ...(theme.tokens && typeof theme.tokens === 'object' ? theme.tokens : {}),
      },
    };
  });

export function getThemeById(themeId) {
  return BUILTIN_THEMES.find((theme) => theme.id === themeId) || BUILTIN_THEMES[0];
}

export function getInitialThemeId() {
  const fallbackId = BUILTIN_THEMES[0]?.id || 'ayu-light';
  const stored = localStorage.getItem('docs-theme');
  if (stored && BUILTIN_THEMES.some((theme) => theme.id === stored)) {
    return stored;
  }
  return fallbackId;
}

export function applyTheme(themeId, codeContrast = 'normal') {
  const selectedTheme = getThemeById(themeId);
  const root = document.documentElement;
  root.dataset.docTheme = selectedTheme.id;
  root.dataset.docThemeMode = selectedTheme.mode;
  root.dataset.codeContrast = codeContrast;
  root.style.colorScheme = selectedTheme.mode;

  // Remove previously inlined theme variables so switching themes never keeps stale values.
  ALL_THEME_TOKENS.forEach((token) => {
    root.style.removeProperty(token);
  });

  Object.entries(selectedTheme.colors).forEach(([token, value]) => {
    root.style.setProperty(token, value);
  });

  // Ensure semantic tokens always exist even if a custom theme omits some.
  for (const token of SEMANTIC_TOKEN_KEYS) {
    if (!root.style.getPropertyValue(token)) {
      const fallback = buildSemanticTokens(selectedTheme.colors, selectedTheme.mode)[token];
      if (fallback) {
        root.style.setProperty(token, fallback);
      }
    }
  }

  if (codeContrast === 'high') {
    const contrastTokens = selectedTheme.mode === 'dark'
      ? HIGH_CONTRAST_CODE_TOKENS_DARK
      : HIGH_CONTRAST_CODE_TOKENS_LIGHT;
    Object.entries(contrastTokens).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });
  }

  localStorage.setItem('docs-theme', selectedTheme.id);
  return selectedTheme;
}
