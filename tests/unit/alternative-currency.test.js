/**
 * TDD red gate for the cheaper-alternative currency-misleading bug.
 *
 * Symptom: alternative shown as "$5923" — user reads it as USD, but the original
 * item price is AED 8099, so $5923 is interpreted as cheaper. If Gemini returned
 * an AED value, the $ label is wrong; if Gemini returned a USD value, $5923 ≈
 * AED 21,752 which is MORE expensive, not cheaper. Either way the comparison
 * is misleading because the currency is ambiguous through the pipeline.
 *
 * Two-part fix:
 *   (1) display — ResultBubble.js renders price with AED prefix, not literal $
 *   (2) prompt — findCheaperAlternative explicitly requires AED in the response
 *       schema so Gemini doesn't return USD numbers
 */
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

describe('cheaper-alternative currency display + prompt enforcement', () => {
  it('ResultBubble.js does not render alternative price with $ prefix', () => {
    const src = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'components', 'ResultBubble.js'),
      'utf8',
    );
    const altBlockMatch = src.match(/className="alternative-product"[\s\S]{0,500}/);
    expect(altBlockMatch).toBeTruthy();
    const altBlock = altBlockMatch[0];
    // Bug: literal $ before {msg.alternative.price} in template (template-literal
    // interpolation as `$${expr}` in JSX produces a leading $ in the rendered text).
    expect(altBlock).not.toMatch(/—\s*\$\{msg\.alternative\.price\}/);
  });

  it('ResultBubble.js renders alternative price with AED prefix', () => {
    const src = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'components', 'ResultBubble.js'),
      'utf8',
    );
    const altBlockMatch = src.match(/className="alternative-product"[\s\S]{0,500}/);
    const altBlock = altBlockMatch[0];
    // Either explicit "AED " prefix in JSX or a formatAED-style helper call.
    const hasAEDPrefix = /AED[^A-Z]*\{[^}]*alternative\.price[^}]*\}/i.test(altBlock);
    const hasAEDFormatter = /formatAED\(\s*[^)]*alternative\.price[^)]*\)/.test(altBlock);
    if (!hasAEDPrefix && !hasAEDFormatter) {
      throw new Error(
        `alternative-product block does not surface AED currency.\n${altBlock.slice(0, 300)}...`,
      );
    }
  });

  it('findCheaperAlternative prompt requires AED currency in response schema', () => {
    const src = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'lib', 'aiAdvisorAPI.js'),
      'utf8',
    );
    const promptStart = src.indexOf('Find a cheaper alternative');
    expect(promptStart).toBeGreaterThan(-1);
    const promptEnd = src.indexOf('Focus on legitimate', promptStart);
    expect(promptEnd).toBeGreaterThan(promptStart);
    const promptText = src.slice(promptStart, promptEnd);
    // Must explicitly require AED currency in the response (not just mention AED
    // for the input price). Without this, Gemini may return USD or other currency
    // numbers that get rendered as if AED.
    const enforces =
      /all\s+prices?[^.]*\bAED\b/i.test(promptText) ||
      /respond[^.]*\bAED\b/i.test(promptText) ||
      /price.*\bin\s+AED\b/i.test(promptText) ||
      /values[^.]*\bin\s+AED\b/i.test(promptText) ||
      /return[^.]*\bAED\b/i.test(promptText);
    if (!enforces) {
      throw new Error(
        `findCheaperAlternative prompt does not enforce AED currency in the response.\nPrompt excerpt:\n${promptText.slice(0, 600)}`,
      );
    }
  });
});
