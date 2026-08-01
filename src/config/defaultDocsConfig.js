const defaultDocsConfig = {
  template: 'docline',
  templateVersion: '2.0.0',
  contentMode: 'versioned',
  name: 'Product Docs',
  description: 'Custom Tailwind-powered documentation template',
  favicon: '/favicon.png',
  branding: {
    title: 'Product Docs',
    subtitle: 'Developer Documentation',
    attribution: 'keep',
    badgeStyle: 'minimal',
    homePath: '/introduction',
    logo: {
      src: '/opensourcedocs-logo.svg',
      alt: 'Product Docs',
      variant: 'icon',
      showText: true,
    },
    badge: {
      enabled: true,
      label: 'Powered by docline',
      href: 'https://github.com/doclines/docline-core',
      target: '_blank',
      position: 'bottom-right',
    },
  },
  ui: {
    header: {
      searchPlaceholder: 'Search docs, API and guides',
      quickSearchLabel: 'Quick Search',
      themeGalleryLabel: 'Theme Gallery',
      customActions: [],
      actions: {
        order: ['search', 'theme', 'template', 'view', 'themeGallery', 'platform', 'quickSearch'],
        hidden: ['platform', 'quickSearch'],
      },
    },
    sidebar: {
      searchLabel: 'Search docs',
      statusLabel: 'Docs synced and indexed',
      repoLabel: 'Product Features',
      themeGalleryLabel: 'Theme Gallery',
      actions: {
        order: ['search', 'status', 'repo', 'platform', 'themeGallery'],
        hidden: ['status', 'repo', 'platform', 'themeGallery'],
        hiddenDesktop: [],
        hiddenMobile: ['repo', 'platform'],
      },
    },
    search: {
      placeholder: 'Search documentation...',
      noResultsPrefix: 'No results found for',
    },
    theme: {
      buttonLabel: 'Theme',
      panelTitle: 'Themes',
      panelDescription: 'Click to apply across the page',
    },
    view: {
      buttonLabel: 'View',
      densityTitle: 'Density',
      comfortableLabel: 'Comfortable',
      compactLabel: 'Compact',
      readingTitle: 'Reading focus',
      readingOnLabel: 'On: minimal distractions',
      readingOffLabel: 'Off: full docs layout',
      performanceTitle: 'Performance',
      performanceOnLabel: 'Reduce effects for speed',
      performanceOffLabel: 'Full visual effects',
    },
    layout: {
      buttonLabel: 'Template',
      panelTitle: 'Layout Templates',
      panelDescription: 'Switch full shell composition',
    },
    dock: {
      enabled: true,
      position: 'bottom',
    },
  },
  content: {
    roots: ['docs', '.'],
  },
  contentMatrix: {
    defaultVersion: 'v1',
    defaultLocale: 'en',
    versions: [{ id: 'v1', label: 'v1' }],
    locales: [{ id: 'en', label: 'English' }],
    entries: [],
  },
  navigation: {
    tabs: [],
  },
  themes: [
    { id: 'ayu-light', label: 'Ayu Light', mode: 'light' },
    { id: 'catppuccin-latte', label: 'Catppuccin Latte', mode: 'light' },
    { id: 'github-light', label: 'GitHub Light', mode: 'light' },
    { id: 'tokyo-night-storm', label: 'Tokyo Night Storm', mode: 'dark' },
    { id: 'catppuccin-mocha', label: 'Catppuccin Mocha', mode: 'dark' },
    { id: 'gruvbox-dark', label: 'Gruvbox Dark', mode: 'dark' },
    { id: 'nord-dark', label: 'Nord Dark', mode: 'dark' },
  ],
  layoutTemplates: [],
  sectionLayoutOverrides: [],
  snippets: {
    authBearerHint: 'Use your personal access token in the Authorization header.',
  },
  pageBlocks: {
    global: {},
  },
  releases: {
    breakingChanges: [],
  },
  navbar: {
    primary: {
      label: 'Platform',
      href: '#',
    },
  },
  footer: {
    socials: {
      github: 'https://github.com/doclines/docline-core',
    },
  },
};

export default defaultDocsConfig;
