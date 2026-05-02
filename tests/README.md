# Denarii Test Suite

Comprehensive test suite for the Denarii Purchase Recommendation Engine focusing on the Weighted Decision Matrix (WDM) and Multi-Criteria Decision Analysis (MCDA) implementation.

## Test Structure

```
tests/
├── unit/                             # Unit tests for individual functions
│   ├── structuredDecisionModel.test.js   # WDM core logic tests
│   └── progressiveFinancialProfile.test.js # Financial calculations tests
├── integration/                      # End-to-end integration tests
│   ├── recommendation-flow.test.js   # Full recommendation flow tests
│   └── edge-cases.test.js           # Boundary and edge case tests
├── fixtures/                         # Test data and personas
│   ├── personas.js                  # Financial profile test personas
│   └── test-purchases.js            # Purchase scenario test cases
├── utils/                           # Test utilities (if needed)
└── setup.js                         # Jest configuration and global mocks
```

## Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests with verbose output
npm run test:verbose
```

## Test Personas

The test suite uses 7 distinct personas to ensure comprehensive coverage:

### Main Personas
1. **Struggling Student Sarah** - Low income ($1,500), minimal savings, risk-averse
2. **High-Earner Henry** - High income ($12,000), high debt, no emergency fund
3. **Balanced Barbara** - Medium income ($5,000), good savings, moderate approach

### Edge Case Personas
4. **Zero Income Ian** - No income, some savings
5. **High Debt Hannah** - 50% debt-to-income ratio
6. **Wealthy Wendy** - Very high income, excellent financial position
7. **Negative Cash Flow Nick** - Expenses exceed income

## Key Test Scenarios

### Unit Tests
- Weight adjustments based on risk tolerance
- Affordability scoring at different income levels
- Emergency fund impact on decisions
- Financial goal alignment scoring
- Decision threshold validation (Buy at ≥60, Don't Buy at <60)
- Confidence level calculations

### Integration Tests
- Complete recommendation flows for each persona
- Cross-persona validation for essential purchases
- Alternative product impact on recommendations
- Goal-specific purchase approvals

### Edge Cases
- Zero and negative income handling
- Extreme debt scenarios (>100% of income)
- Free items (cost = $0)
- Missing or undefined data
- Score boundary testing (exactly 60)
- Special characters and long strings

## Test Coverage Goals

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Key Files Being Tested

1. `src/lib/structuredDecisionModel.js` - Core WDM implementation
2. `src/components/ProgressiveFinancialProfile.js` - User data input and calculations
3. Financial metric calculations:
   - Monthly Net Income = Income - Expenses - Debt
   - Emergency Fund Months = Savings / (Expenses + Debt)
   - Debt-to-Income Ratio = (Debt / Income) × 100
   - Health Score calculation

## Decision Matrix Criteria

The tests validate 13 decision criteria across 4 categories:

### Financial (40% weight)
- Affordability
- Value for Money
- Opportunity Cost
- Financial Goal Alignment

### Utility (30% weight)
- Necessity
- Frequency of Use
- Longevity

### Psychological (20% weight)
- Emotional Value
- Social Factors
- Buyer's Remorse Risk

### Risk (10% weight, adjusted by risk tolerance)
- Financial Risk
- Alternative Availability

## Expected Test Results

### Example Test Case Matrix

| Persona | Item | Price | Expected | Rationale |
|---------|------|-------|----------|-----------|
| Struggling Student | Gaming Console | $500 | Don't Buy | 500% of monthly net income |
| High-Earner Henry | Home Gym | $1,500 | Buy | Daily use, affordable |
| Balanced Barbara | Stock Platform | $100/mo | Buy | Aligns with invest goal |

## Debugging Tests

If tests fail:

1. Check that all required files exist in `src/lib/`
2. Verify Firebase environment variables are set (even dummy values)
3. Ensure Node modules are installed: `npm install`
4. Check individual test output with `npm run test:verbose`
5. Review coverage gaps with `npm run test:coverage`

## Adding New Tests

When adding new test cases:

1. Add new personas to `tests/fixtures/personas.js`
2. Add purchase scenarios to `tests/fixtures/test-purchases.js`
3. Follow existing test patterns for consistency
4. Ensure test names clearly describe what is being tested
5. Update this README with new test scenarios

## CI/CD Integration

These tests are designed to be run in CI/CD pipelines:

```bash
# For CI environments
npm ci
npm run test:coverage
```

The test suite will exit with code 1 if any tests fail or coverage thresholds aren't met.