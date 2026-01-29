/**
 * Special capitalization rules for source names
 * Used when meta tags or URLs return lowercase versions
 */
export const SOURCE_NAME_FIXES: Record<string, string> = {
  'mlive': 'MLive',
  'cnn': 'CNN',
  'bbc': 'BBC',
  'npr': 'NPR',
  'pbs': 'PBS',
  'abc': 'ABC',
  'nbc': 'NBC',
  'cbs': 'CBS',
  'wdiv': 'WDIV',
  'wxyz': 'WXYZ',
  'usa': 'USA',
};

/**
 * Normalize a source name to fix common capitalization issues
 */
export function normalizeSourceName(name: string): string {
  const trimmed = name.trim();
  const lowerName = trimmed.toLowerCase();

  if (SOURCE_NAME_FIXES[lowerName]) {
    return SOURCE_NAME_FIXES[lowerName];
  }

  return trimmed;
}
