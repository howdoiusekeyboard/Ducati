/**
 * Phase 10 cleanup gate: per-file hex literal budget. Most retained hexes are
 * verdict-pill family (#059669 buy fg / #b45309 wait fg / #b91c1c skip fg),
 * amber gradient stops (#f59e0b / #d97706 / #92400e / #fef3c7 / #fde68a /
 * #fbbf24), danger lights (#fee2e2 / #fef2f2 / #991b1b), true black for shadow
 * opacity stops, and brand-specific accent variants. Budgets capture current
 * intended-keep state — tightening them is a future per-route design pass.
 */
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const PER_FILE_BUDGET = {
  'src/styles/App.css': 30,
  'src/styles/Dashboard.css': 16,
  'src/styles/FinancialProfile.css': 2,
  'src/styles/UserGuide.css': 10,
  'src/styles/auth.css': 14,
  'src/styles/ClearDataButton.css': 10,
  'src/styles/ConnectionStatus.css': 6,
  'src/styles/DecisionMatrix.css': 2,
  'src/styles/EnvironmentChecker.css': 0,
  'src/styles/FinanceFeed.css': 5,
  'src/styles/FirestoreErrorBoundary.css': 5,
  'src/styles/OfflineIndicator.css': 2,
  'src/styles/ProgressiveFinancialProfile.css': 0,
  'src/styles/ProMode.css': 28,
  'src/styles/SavingsTracker.css': 6,
};

const HEX_RE = /#[0-9a-fA-F]{6}\b/g;

describe('hex literal budget per CSS file', () => {
  for (const [relPath, budget] of Object.entries(PER_FILE_BUDGET)) {
    it(`${relPath} ≤ ${budget} hex literals`, () => {
      const fullPath = path.join(REPO_ROOT, relPath);
      if (!fs.existsSync(fullPath)) return;
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(HEX_RE) || [];
      if (matches.length > budget) {
        const sample = [...new Set(matches)].slice(0, 8).join(', ');
        throw new Error(
          `${relPath}: ${matches.length} hex literals (budget ${budget}). Sample: ${sample}`,
        );
      }
    });
  }
});
