/**
 * Phase 10 cleanup gate: legacy :root alias references must be 0 in component CSS.
 * The alias surface in globals.css#:root remains as a defensive bridge for any
 * external/inline consumer; this test only enforces zero usage at the per-route CSS
 * level so all components consume D2 canonical tokens directly.
 */
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const COMPONENT_CSS_FILES = [
  'src/styles/App.css',
  'src/styles/Dashboard.css',
  'src/styles/FinancialProfile.css',
  'src/styles/UserGuide.css',
  'src/styles/auth.css',
  'src/styles/ClearDataButton.css',
  'src/styles/ConnectionStatus.css',
  'src/styles/DecisionMatrix.css',
  'src/styles/EnvironmentChecker.css',
  'src/styles/FinanceFeed.css',
  'src/styles/FirestoreErrorBoundary.css',
  'src/styles/OfflineIndicator.css',
  'src/styles/ProgressiveFinancialProfile.css',
  'src/styles/ProMode.css',
  'src/styles/SavingsTracker.css',
];

const RETIRED_ALIASES = [
  '--primary-color',
  '--primary-dark',
  '--primary-light',
  '--primary-hover',
  '--accent-color',
  '--accent-dark',
  '--accent-light',
  '--accent-hover',
  '--success-color',
  '--error-color',
  '--danger-color',
  '--info-color',
  '--white',
  '--gray-50',
  '--gray-100',
  '--gray-200',
  '--gray-300',
  '--gray-400',
  '--gray-500',
  '--gray-600',
  '--gray-700',
  '--gray-800',
  '--gray-900',
  '--bg-primary',
  '--bg-secondary',
  '--bg-tertiary',
  '--background-card',
  '--background-light',
  '--text-primary',
  '--text-secondary',
  '--text-tertiary',
  '--text-inverse',
  '--text-dark',
  '--text-medium',
  '--text-light',
  '--border-light',
  '--border-medium',
  '--border-dark',
  '--border-color',
  '--purple-primary',
  '--purple-secondary',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--shadow-xl',
  '--shadow-message',
  '--font-family-sans',
];

describe('legacy CSS alias retirement (component CSS)', () => {
  describe.each(COMPONENT_CSS_FILES)('%s', (relPath) => {
    const fullPath = path.join(REPO_ROOT, relPath);
    if (!fs.existsSync(fullPath)) {
      it.skip(`${relPath} (file not present)`, () => {});
      return;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    it.each(RETIRED_ALIASES)('does not reference var(%s)', (alias) => {
      const escaped = alias.replace(/-/g, '\\-');
      const re = new RegExp(`var\\(\\s*${escaped}\\b`);
      const m = content.match(re);
      if (m) {
        const idx = content.indexOf(m[0]);
        const before = Math.max(0, idx - 40);
        const after = Math.min(content.length, idx + m[0].length + 40);
        const ctx = content.slice(before, after).replace(/\s+/g, ' ').trim();
        throw new Error(`${relPath} still references ${alias}: ...${ctx}...`);
      }
    });
  });
});
