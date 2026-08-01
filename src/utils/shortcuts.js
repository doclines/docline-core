export const isMac = (() => {
  if (typeof navigator === 'undefined') return false;
  if (navigator.userAgentData?.platform) {
    return /mac/i.test(navigator.userAgentData.platform);
  }
  return /mac/i.test(navigator.platform);
})();

export const SHORTCUT_SEARCH = isMac
  ? { keys: ['⌘', 'K'], label: '⌘K' }
  : { keys: ['Ctrl', 'K'], label: 'Ctrl+K' };

export const SHORTCUT_DENSITY = isMac
  ? { keys: ['⌘', '⇧', 'D'], label: '⌘⇧D' }
  : { keys: ['Ctrl', 'Shift', 'D'], label: 'Ctrl+Shift+D' };

export const SHORTCUT_READING = isMac
  ? { keys: ['⌘', '⇧', 'R'], label: '⌘⇧R' }
  : { keys: ['Ctrl', 'Shift', 'R'], label: 'Ctrl+Shift+R' };
