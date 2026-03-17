# Code Quality Improvement - Action Plan

**Based on:** [code-quality-review-report.md](code-quality-review-report.md)  
**Status:** 🟡 Pending Implementation  
**Owner:** Development Team  
**Timeline:** 3-phase approach (2-3 weeks total)

---

## Phase 1: Quick Wins (1-2 days) 🎯

### 1.1 Replace Magic Number Timeouts

**Priority:** HIGH  
**Effort:** Low  
**Files Affected:** 7 test spec files + page objects

**Action Steps:**

```javascript
// Step 1: Extend pages/constants/timeouts.js with test-specific constants
const TIMEOUTS = {
  // ... existing constants ...
  
  // Add test-specific timeouts
  SHORT_DELAY: 500,
  FILTER_DELAY: 1000,
  GRID_STABILIZATION: 2000,
  PERMISSION_RENDER: 2500,
  MODAL_RENDER: 3000,
};

// Step 2: Replace all hardcoded timeouts in test files
// BEFORE:
await page.waitForTimeout(500);
await page.waitForTimeout(2000);

// AFTER:
const TIMEOUTS = require('../../../pages/constants/timeouts');
await page.waitForTimeout(TIMEOUTS.SHORT_DELAY);
await page.waitForTimeout(TIMEOUTS.GRID_STABILIZATION);
```

**Files to Update:**
- ✅ test/Administration/User/adminUserSiteAccessExpirationDate.spec.js (3 instances)
- ✅ test/Data Services/Dashboard/siteStatusDashboardSEM.spec.js (16 instances)
- ✅ test/Data Services/Dashboard/siteStatusDashboardLiquid.spec.js (20 instances)
- ✅ test/Data Services/Dashboard/siteStatusDashboardLandFill.spec.js (check for instances)
- ✅ pages/Administration/User/administrationUserPage.js (multiple instances)

**Test Command:**
```bash
npx playwright test --grep "AUTH-01" -x
```

---

### 1.2 Replace Hard Waits with Explicit Waits

**Priority:** HIGH  
**Effort:** Medium  
**Impact:** Faster, more reliable tests

**Pattern to Find and Replace:**

```javascript
// ❌ FIND THIS PATTERN:
await page.waitForTimeout(1000);
await someAction();

// ✅ REPLACE WITH:
await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NETWORK_IDLE_SHORT });
await someAction();

// OR

// ❌ FIND THIS:
await element.click();
await page.waitForTimeout(500);

// ✅ REPLACE WITH:
await element.click();
await expect(nextElement).toBeVisible();  // Playwright auto-waits
```

**Common Replacements:**

| Hard Wait | Explicit Wait Alternative |
|-----------|---------------------------|
| `waitForTimeout(500)` after click | Remove (Playwright auto-waits) |
| `waitForTimeout(1000)` after navigation | `waitForLoadState('networkidle')` |
| `waitForTimeout(2000)` before assertion | `expect().toBeVisible()` auto-waits |
| `waitForTimeout(1500)` for element | `waitForSelector(selector, { state: 'visible' })` |

**Test After Changes:**
```bash
npx playwright test test/Authentication/Login/login-scs.spec.js
```

---

### 1.3 Add Logging to Empty Catch Blocks

**Priority:** MEDIUM  
**Effort:** Low  
**Files Affected:** siteStatusDashboardSEM.spec.js, page objects

**Pattern to Find:**

```bash
# Find empty catch blocks
grep -n "\.catch(() => {})" test/**/*.spec.js pages/**/*.js
```

**Fix Pattern:**

```javascript
// ❌ BEFORE:
await someOperation().catch(() => {});

// ✅ AFTER:
await someOperation().catch((error) => {
  logger.debug(`Operation failed (continuing gracefully): ${error.message}`);
});

// OR for boolean returns:
// ❌ BEFORE:
const isVisible = await element.isVisible().catch(() => false);

// ✅ AFTER:
const isVisible = await element.isVisible().catch((error) => {
  logger.debug(`Element not visible: ${error.message}`);
  return false;
});
```

**Acceptance Criteria:**
- No empty `catch(() => {})` blocks remain
- All caught errors have at least `logger.debug()` statement

---

## Phase 2: Structural Improvements (3-5 days) 📐

### 2.1 Refactor administrationUserPage.js (4,649 lines)

**Priority:** HIGH  
**Effort:** High  
**Impact:** Maintainability, collaboration, readability

**Proposed Structure:**

```
pages/Administration/User/
├── administrationUserPage.js (main facade - ~300 lines)
├── modules/
│   ├── userGridOperations.js (~700 lines)
│   ├── userFilterOperations.js (~600 lines)
│   ├── siteAccessOperations.js (~800 lines)
│   ├── dateOperations.js (~500 lines)
│   ├── notificationOperations.js (~400 lines)
│   ├── searchOperations.js (~300 lines)
│   └── toolbarOperations.js (~400 lines)
└── README.md (module documentation)
```

**Implementation Steps:**

**Step 1: Create module base structure**

```javascript
// pages/Administration/User/modules/userGridOperations.js
const BasePage = require('../../../basePage');
const LOCATORS = require('../../../constants/administrationUserPage.constants');

class UserGridOperations extends BasePage {
  constructor(page) {
    super(page);
  }

  async waitForUserGridToLoad() { /* Move method here */ }
  async filterByFirstName(firstName) { /* Move method here */ }
  async clickEditButton() { /* Move method here */ }
  // ... other grid-related methods
}

module.exports = UserGridOperations;
```

**Step 2: Update main page object**

```javascript
// pages/Administration/User/administrationUserPage.js
const BasePage = require('../../basePage');
const UserGridOperations = require('./modules/userGridOperations');
const SiteAccessOperations = require('./modules/siteAccessOperations');
const DateOperations = require('./modules/dateOperations');

class AdministrationUserPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Composition over inheritance
    this.gridOps = new UserGridOperations(page);
    this.siteAccessOps = new SiteAccessOperations(page);
    this.dateOps = new DateOperations(page);
  }

  // Navigation (kept in main class)
  async navigateToAdministrationTab() { /* ... */ }
  async navigateToUsersList() { /* ... */ }

  // Delegate to modules (facade pattern)
  async filterByFirstName(name) {
    return this.gridOps.filterByFirstName(name);
  }

  async waitForUserGridToLoad() {
    return this.gridOps.waitForUserGridToLoad();
  }
}

module.exports = AdministrationUserPage;
```

**Step 3: Update test files (minimal changes)**

```javascript
// Tests continue to work without changes!
await administrationUserPage.filterByFirstName('John');
await administrationUserPage.waitForUserGridToLoad();

// OR use modules directly for new tests:
await administrationUserPage.gridOps.filterByFirstName('John');
```

**Testing Strategy:**
1. ✅ Run all ADMIN-USR-ACC-EXP tests after each module extraction
2. ✅ Verify no test failures
3. ✅ Check code coverage remains same

**Rollout Plan:**
- Day 1: Create module structure, extract UserGridOperations
- Day 2: Extract SiteAccessOperations
- Day 3: Extract DateOperations, NotificationOperations
- Day 4: Extract remaining modules, update documentation
- Day 5: Code review, test execution

---

### 2.2 Create Test Fixtures

**Priority:** MEDIUM  
**Effort:** Medium  
**Files Affected:** All 7 test spec files

**Step 1: Create fixtures/testFixtures.js**

```javascript
// fixtures/testFixtures.js
const { test as base, expect } = require('@playwright/test');
const TestSetup = require('../utils/testSetup');
const logger = require('../utils/logger');

// Extend test with custom fixtures
const test = base.extend({
  /**
   * Authenticated page fixture with logged-in user
   */
  authenticatedPage: async ({ page }, use) => {
    logger.divider();
    logger.info('Setting up authenticated page fixture');
    
    const testSetup = new TestSetup();
    await testSetup.initialize(page);
    await testSetup.loginAsValidUser();
    
    await use({
      page,
      testSetup,
      loginPage: testSetup.getLoginPage(),
      dashboardPage: testSetup.getSiteStatusDashboardPage(),
      adminPage: testSetup.getAdministrationUserPage(),
    });
    
    logger.info('Tearing down authenticated page fixture');
    logger.divider();
  },

  /**
   * Authenticated page with Health & Safety acknowledged
   */
  dashboardPage: async ({ authenticatedPage }, use) => {
    const { testSetup, dashboardPage } = authenticatedPage;
    
    logger.info('Acknowledging Health & Safety modal');
    await testSetup.acknowledgeHealthAndSafety();
    
    await use(authenticatedPage);
  },

  /**
   * Authenticated administration page
   */
  adminUserPage: async ({ dashboardPage }, use) => {
    const { adminPage } = dashboardPage;
    
    logger.info('Navigating to Administration → Users');
    await adminPage.navigateToAdministrationTab();
    await adminPage.verifySiteListVisible();
    await adminPage.navigateToUsersList();
    await adminPage.waitForUserGridToLoad();
    
    await use(dashboardPage);
  },
});

module.exports = { test, expect };
```

**Step 2: Update test files**

```javascript
// BEFORE: test/Data Services/Dashboard/siteStatusDashboardLiquid.spec.js
const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');

test.describe('Site Status Dashboard - Liquid Tests', () => {
  let testSetup;
  let siteStatusDashboardPage;

  test.beforeEach(async ({ page }) => {
    testSetup = new TestSetup();
    await testSetup.initialize(page);
    await testSetup.loginAsValidUser();
    await testSetup.acknowledgeHealthAndSafety();
    siteStatusDashboardPage = testSetup.getSiteStatusDashboardPage();
  });

  test('DS-SITE-STATUS-LIQUID-01', async ({ page }) => {
    // Test logic...
  });
});

// AFTER: Using fixtures
const { test, expect } = require('../../../fixtures/testFixtures');

test.describe('Site Status Dashboard - Liquid Tests', () => {
  test('DS-SITE-STATUS-LIQUID-01', async ({ dashboardPage }) => {
    const { page, dashboardPage: siteStatusDashboardPage } = dashboardPage;
    
    // Test logic only - no boilerplate!
    await siteStatusDashboardPage.clickLiquidDashboardTab();
    // ...
  });
});
```

**Benefits:**
- ✅ 15-20 lines of boilerplate removed per test
- ✅ Consistent setup across all tests
- ✅ Easy to add new fixture variants
- ✅ Better test isolation

**Rollout:**
1. Create fixtures/testFixtures.js
2. Update 1 test file as proof of concept
3. Verify tests pass
4. Update remaining test files
5. Update documentation

---

### 2.3 Standardize Test ID Naming

**Priority:** LOW  
**Effort:** Low  
**Files Affected:** All test files

**Current State:**
- `AUTH-01`, `AUTH-08`, `AUTH-09`
- `DS-SITE-STATUS-01`, `DS-SITE-STATUS-LANDFILL-01`
- `ADMIN-USR-ACC-EXP-01`, `ADMIN-USR-ACC-EXP-03`

**Proposed Standard:**
```
<SUITE>-<FEATURE>-<NUMBER>

Examples:
- AUTH-LOGIN-01
- AUTH-CHANGE-PWD-01
- DS-DASHBOARD-01
- DS-DASHBOARD-LIQUID-01
- ADMIN-USER-01
```

**Mapping Document:**
Create `docs/test-id-mapping.md` with before/after mapping for traceability.

---

## Phase 3: Advanced Enhancements (1-2 weeks) 🚀

### 3.1 TypeScript Migration (Optional)

**Priority:** LOW (Future consideration)  
**Effort:** Very High  
**Prerequisites:** Team TypeScript training

**Phased Approach:**

**Phase 1: Enable Type Checking (Week 1)**
```json
// jsconfig.json
{
  "compilerOptions": {
    "checkJs": true,
    "strict": false,
    "noImplicitAny": false
  }
}
```

**Phase 2: Add JSDoc Types (Week 2)**
```javascript
/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<void>}
 */
async login(username, password) { }
```

**Phase 3: Migrate to .ts (Weeks 3-4)**
- Start with utils/ folder
- Then pages/
- Finally tests/

---

### 3.2 Environment Variable Validation

**Priority:** MEDIUM  
**Effort:** Low  
**File:** utils/credentials.js

**Implementation:**

```javascript
// utils/credentials.js (add at top)

/**
 * Validate required environment variables are present
 * @throws {Error} if required variables are missing
 */
function validateEnvironment() {
  const required = [
    'VALID_USER_USERNAME',
    'VALID_USER_PASSWORD',
    'NON_APPLICABLE_USER_USERNAME',
    'NON_APPLICABLE_USER_PASSWORD',
    'NO_ACCESS_USER_USERNAME',
    'NO_ACCESS_USER_PASSWORD',
    'BASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
      missing.map(key => `  - ${key}`).join('\n') +
      `\n\nPlease ensure your .env file contains all required variables.`
    );
  }

  logger.info('✓ All required environment variables are present');
}

// Call on module load
validateEnvironment();
```

**Test:**
```bash
# Remove a variable from .env
npx playwright test --grep "AUTH-01"
# Should fail with clear error message
```

---

### 3.3 Functional Programming Refactoring

**Priority:** LOW  
**Effort:** Medium  
**Files:** Page objects with many loops

**Examples:**

```javascript
// BEFORE: siteStatusDashboardPage.js line 1155
async getSurfaceEmissionsColumnValues(colIndex) {
  const rows = this.page.locator('#surface-emissions-grid .e-row');
  const count = await rows.count();
  const values = [];
  for (let i = 0; i < count; i++) {
    const cell = rows.nth(i).locator('td').nth(colIndex);
    const text = await cell.innerText();
    values.push(text.trim());
  }
  return values;
}

// AFTER: Functional approach
async getSurfaceEmissionsColumnValues(colIndex) {
  const rows = this.page.locator('#surface-emissions-grid .e-row');
  const count = await rows.count();
  
  return Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const cell = rows.nth(i).locator('td').nth(colIndex);
      return (await cell.innerText()).trim();
    })
  );
}
```

**Note:** Only apply where it improves readability. Keep imperative loops for complex sequential logic.

---

## Success Metrics

### Phase 1 Completion Criteria
- [ ] All magic number timeouts replaced with constants
- [ ] Hard wait count reduced by 80% (from 40+ to <8)
- [ ] Zero empty catch blocks without logging
- [ ] All tests pass after changes

### Phase 2 Completion Criteria
- [ ] administrationUserPage.js split into 6-7 modules (<800 lines each)
- [ ] Test fixtures implemented for all test files
- [ ] Test ID naming standardized
- [ ] Documentation updated

### Phase 3 Completion Criteria
- [ ] Environment validation in place
- [ ] TypeScript evaluation completed (decision made)
- [ ] Functional refactoring applied where beneficial

---

## Testing Strategy

### Regression Testing After Each Phase

```bash
# Run full test suite
npx playwright test

# Run specific suites
npx playwright test test/Authentication/
npx playwright test test/Data\ Services/
npx playwright test test/Administration/

# Run with UI to debug
npx playwright test --ui

# Generate report
npx playwright show-report
```

### Code Review Checklist

**Phase 1 Review:**
- [ ] No magic numbers in wait statements
- [ ] All timeouts use constants from timeouts.js
- [ ] All catch blocks have logging
- [ ] No new console.log added
- [ ] All tests pass

**Phase 2 Review:**
- [ ] Module boundaries are clear and logical
- [ ] No circular dependencies
- [ ] Test files use fixtures consistently
- [ ] Documentation updated

---

## Resources

### Documentation
- [Code Quality Review Report](code-quality-review-report.md)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)

### Tools
- ESLint config (TODO: create .eslintrc.js)
- Prettier config (TODO: create .prettierrc)
- Pre-commit hooks (TODO: setup husky)

---

## Timeline Summary

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| Phase 1: Quick Wins | 1-2 days | Low-Medium | HIGH |
| Phase 2: Structural | 3-5 days | High | HIGH |
| Phase 3: Advanced | 1-2 weeks | Very High | LOW |

**Total Estimated Time:** 2-3 weeks (can be parallelized across team members)

---

## Next Steps

1. ✅ Review this action plan with team
2. ⏳ Assign owners for each phase
3. ⏳ Create feature branches for each phase
4. ⏳ Set up project tracking (Jira/GitHub Issues)
5. ⏳ Schedule code review sessions

**Ready to Start?** Begin with Phase 1.1 (Magic Number Replacement) - lowest risk, highest impact!

---

**Document Owner:** Development Team  
**Last Updated:** 2025-01-16  
**Related Docs:** [code-quality-review-report.md](code-quality-review-report.md)
