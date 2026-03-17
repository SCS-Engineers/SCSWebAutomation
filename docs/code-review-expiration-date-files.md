# Code Review: Expiration Date Files
**Files Reviewed:**
- `pages/Administration/User/administrationUserPage.js` (2,246 lines)
- `test/Administration/User/adminUserSiteAccessExpirationDate.spec.js` (1,661 lines)

**Overall Grade: B+ (85/100)**

---

## 🔴 Critical Issues (Must Fix)

### 1. 30 Bare-Literal `waitForTimeout` Calls in Facade (`administrationUserPage.js`)

The facade contains **39 total `waitForTimeout` calls** — 30 use raw numeric literals instead of `TIMEOUTS` constants. This violates the hard-wait avoidance rule and makes timing changes require hunting across the file.

**Affected methods and lines:**

| Line | Value | Method |
|------|-------|--------|
| 272, 277 | 1000 | `enableShowSitesWithNoAccess` |
| 296, 321 | 500 | `enableShowSitesWithNoAccess` |
| 310 | 1000 | `enableShowSitesWithNoAccess` (retry loop) |
| 431 | 1000 | `verifySitesHaveExpirationDates` |
| 510 | 3000 | `verifyShowSitesWithAccessSelected` |
| 539, 548 | 2000, 1000 | `verifyShowPermissionColumnsChecked` |
| 571, 582 | 2000, 500 | `disableShowPermissionColumns` |
| 602, 610 | 1000, 1000 | `disableShowPermissionColumns` |
| 628 | 3000 | `disableShowPermissionColumns` |
| 649 | 3000 | `disableShowPermissionColumnsWithRetry` |
| 660, 669 | 1000, 3000 | `disableShowPermissionColumnsWithRetry` |
| 690, 709, 717, 735 | 3000, 2000, 1000, 3000 | `enableShowPermissionColumns` |
| 756 | 2000 | `verifyPermissionColumnsCollapsed` |
| 818 | 500 | `getAccessStatus` |
| 1066, 1069, 1076 | 2000, 1000, 2000 | `ensureShowSitesWithAccessGrantedIsSelected` |
| 1396, 1477 | 1000, 1000 | `verifyFilteredSites`, `verifySitesVisibleInDropdown` |
| 1516, 1532 | 500, 1000 | `verifySitesVisibleInDropdown` |
| 1567, 1617, 1629, 1636 | 500, 1000, 500, 500 | `verifyOnlySiteVisibleInDropdown`, `filterByEventType` |

**❌ Current:**
```javascript
async verifyShowSitesWithAccessSelected() {
  this.logger.action('Verifying "Show sites with access granted" radio button is selected');
  await this.page.waitForTimeout(3000); // no TIMEOUTS constant
```

**✅ Fix — consolidate to `TIMEOUTS` and replace inline literals:**
```javascript
// In pages/constants/timeouts.js — add these missing entries:
const TIMEOUTS = {
  // ... existing ...
  GRID_STABILIZATION:    3000,  // Wait for grid re-render after state change
  CHECKBOX_READY:        2000,  // Wait for checkbox state to settle
  PERMISSION_RENDER:     2500,  // Wait for permission columns to fully render
  FILTER_DELAY:          1000,  // Wait after filter applied
  SHORT_POLL_INTERVAL:    500,  // Polling interval in retry loops
};
```
```javascript
// In administrationUserPage.js:
const { TIMEOUTS } = require('../../constants/timeouts');
// ...
await this.page.waitForTimeout(TIMEOUTS.GRID_STABILIZATION);
await this.page.waitForTimeout(TIMEOUTS.CHECKBOX_READY);
```

---

### 2. `getAccessStatus` Polling Loop — Worst-Case 12-Second Hard Wait

The method uses a fixed startup wait followed by a polling loop with hard sleeps,
creating a potential total wait of **2000 + (20 × 500) = 12,000 ms** even on a fast machine.

**❌ Current:**
```javascript
async getAccessStatus(siteName) {
  await this.page.waitForTimeout(2000); // always waits 2s minimum
  const maxWait = 20;
  for (let i = 0; i < maxWait; i++) {
    const status = await this.readCellAccessStatus(siteName);
    if (status !== null && status !== '') return status;
    await this.page.waitForTimeout(500); // hard wait per poll
  }
```

**✅ Fix — use `page.waitForFunction` with a DOM condition:**
```javascript
async getAccessStatus(siteName) {
  this.logger.action(`Getting access status for site: ${siteName}`);

  // Wait for the cell to contain non-empty text instead of hard-polling
  const row = this.page.locator(`.e-row:has-text("${siteName}")`).first();
  const statusCell = row.locator('td').nth(/* access-status-col-index */);

  await expect(statusCell).not.toHaveText('', { timeout: TIMEOUTS.ELEMENT_VISIBLE });
  return (await statusCell.textContent()).trim();
}
```

---

### 3. `todayDate` Captured But Never Used in 4 Tests (`adminUserSiteAccessExpirationDate.spec.js`)

Lines **202, 303, 362, 429** all execute `getTodayDateFromCalendar()` — an async UI call that opens a calendar and reads a date — and store the value in `todayDate`, but the variable is only passed to `logger.info()` and never used in any assertion. This is dead code that adds unnecessary test execution time.

**❌ Current (tests 06, 07, 08 — same pattern):**
```javascript
// Test opens calendar, reads today's date, stores it...
const todayDate = await administrationUserPage.getTodayDateFromCalendar();
logger.info(`Today's date from calendar: ${todayDate}`);
// todayDate is never referenced again in this test
await administrationUserPage.clickTodayInCalendar();
```

**✅ Fix option A — remove the capture entirely (if date isn't needed for assertion):**
```javascript
logger.step('Get today date from calendar and confirm button exists');
await administrationUserPage.getTodayDateFromCalendar(); // side-effect only; no return needed
await administrationUserPage.clickTodayInCalendar();
```

**✅ Fix option B — use it in an assertion (if the intent was to verify correctness):**
```javascript
const todayDate = await administrationUserPage.getTodayDateFromCalendar();
logger.info(`Today's date from calendar: ${todayDate}`);
await administrationUserPage.clickTodayInCalendar();
// After clicking, verify the cell was set to todayDate
await administrationUserPage.verifyAccessExpirationDateExists(siteName, todayDate);
```

---

### 4. Orphaned JSDoc Block in Facade (`administrationUserPage.js`, ~line 1780)

There is a JSDoc comment block for `waitForExcelFilterDialogToBeReady` with no method body following it — the method implementation was either removed or never written, leaving a dangling documentation block. The next JSDoc block immediately follows.

**❌ Current:**
```javascript
  /**
   * Wait for Excel filter dialog to be ready
   * @param {Object} excelFilter - Excel filter dialog locator
   * @param {number} timeout - Timeout in milliseconds (default: 15000)
   * @returns {Promise<void>}
   */
  /**
   * Verify site name in dropdown
   * ...
   */
  async verifySiteInDropdown(siteName, dropdownId = null) {
```

**✅ Fix — remove the orphaned JSDoc block:**
```javascript
  /**
   * Verify site name in dropdown
   * @param {string} siteName - Expected site name
   * @param {string} dropdownId - Dropdown element ID (optional)
   * @returns {Promise<void>}
   */
  async verifySiteInDropdown(siteName, dropdownId = null) {
```

---

## 🟡 Improvements (Best Practices)

### 5. `WAIT_TIMES` Duplicates Values Already in `TIMEOUTS` (`adminUserSiteAccessExpirationDate.spec.js`)

The spec file defines a local `WAIT_TIMES` object with values like `FILTER_DELAY: 1000` and `SHORT_DELAY: 500`. These duplicate constants that should live in the shared `TIMEOUTS` file. Tests should import from the single source of truth.

Additionally, `WAIT_TIMES.SHORT_DELAY` (500) is defined but only used once (test 13, line ~887), and `WAIT_TIMES.PERMISSION_RENDER * 2` (test 33, line 1565) uses arithmetic on a constant to derive 5000ms — this is not self-documenting.

**❌ Current (`adminUserSiteAccessExpirationDate.spec.js`):**
```javascript
const WAIT_TIMES = {
  GRID_STABILIZATION: 3000,
  PERMISSION_RENDER: 2500,
  FILTER_DELAY: 1000,
  SHORT_DELAY: 500,
};
```

**✅ Fix — add missing values to `pages/constants/timeouts.js` and import in spec:**
```javascript
// pages/constants/timeouts.js — add:
GRID_STABILIZATION:  3000,  // Wait for grid re-render after state change
PERMISSION_RENDER:   2500,  // Wait for permission columns layout to complete
FILTER_DELAY:        1000,  // Wait after applying a column filter
DASHBOARD_LOAD:      5000,  // Wait for dashboard full load (includes render time)
```
```javascript
// adminUserSiteAccessExpirationDate.spec.js — replace local WAIT_TIMES:
const TIMEOUTS = require('../../../pages/constants/timeouts');
// ...
await administrationUserPage.wait(TIMEOUTS.GRID_STABILIZATION);
await page.waitForTimeout(TIMEOUTS.DASHBOARD_LOAD); // replaces PERMISSION_RENDER * 2
```

---

### 6. Magic String `'PW Automation S1'` in `grantSiteAccessAndSave` Helper

A hardcoded site name is compared inside a general-purpose helper, creating a hidden special case that breaks when the test data changes.

**❌ Current:**
```javascript
const grantSiteAccessAndSave = async (siteName) => {
  // ...
  if (siteName === 'PW Automation S1') {
    // special cleanup before granting access
  }
```

**✅ Fix — source from `testData` or pass a flag:**
```javascript
// Option A: resolve from testData at the helper call site
const { s1 } = testData.testData.administrationUserTest12.siteNames;
const REQUIRES_PRE_CLEANUP = new Set([s1]);

const grantSiteAccessAndSave = async (siteName) => {
  if (REQUIRES_PRE_CLEANUP.has(siteName)) {
    // special cleanup
  }
```

---

### 7. Double Space in Test ID String (`adminUserSiteAccessExpirationDate.spec.js`)

Test `ADMIN-USR-ACC-EXP-03` has two spaces before the dash separator in both the `test()` name and the `logger.testStart/testEnd` calls. This creates an inconsistency that affects report readability.

**❌ Current:**
```javascript
test('ADMIN-USR-ACC-EXP-03  - Verify expiration date calendar ...', async () => {
  logger.testStart('ADMIN-USR-ACC-EXP-03  - Verify expiration date calendar ...');
  // ...
  logger.testEnd('ADMIN-USR-ACC-EXP-03  - Verify expiration date calendar ...', 'PASSED');
```

**✅ Fix — single space before and after dash:**
```javascript
test('ADMIN-USR-ACC-EXP-03 - Verify expiration date calendar ...', async () => {
  logger.testStart('ADMIN-USR-ACC-EXP-03 - Verify expiration date calendar ...');
```

---

### 8. Inline Date Construction Duplicated in Tests 13 and 14 (`adminUserSiteAccessExpirationDate.spec.js`)

Tests 13 and 14 each build `expectedDate` with identical inline logic. This is a DRY violation; if the date format needs to change, it must be updated in two places.

**❌ Current (tests 13 and 14, identical block):**
```javascript
const today = new Date();
const expectedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
```

**✅ Fix — extract to `helper.js` or to a shared helper at the top of the describe block:**
```javascript
// In utils/helper.js (already has date utilities):
/**
 * Get today's date formatted as MM/DD/YYYY
 * @returns {string} Formatted date string
 */
getTodayFormatted() {
  const today = new Date();
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  return `${mm}/${dd}/${today.getFullYear()}`;
}
```
```javascript
// In spec file:
const helper = require('../../../utils/helper');
// ...
const expectedDate = helper.getTodayFormatted();
```

---

### 9. `for...of` Loops for Set-Membership Checks in Facade (`administrationUserPage.js`)

`verifyPermissionColumnsExpanded` and `verifyPermissionColumnsCollapsed` use imperative `for...of` loops to build lists of missing/unexpected columns. This can be replaced with functional `.filter()` for clarity and consistency with the rest of the codebase.

**❌ Current:**
```javascript
const missingColumns = [];
for (const expectedCol of expectedColumns) {
  const found = headers.some((header) => header.includes(expectedCol));
  if (!found) missingColumns.push(expectedCol);
}
```

**✅ Fix:**
```javascript
const missingColumns = expectedColumns.filter(
  (col) => !headers.some((h) => h.includes(col))
);
```

---

### 10. Inconsistent Wait API in Tests 32–33 (`adminUserSiteAccessExpirationDate.spec.js`)

Tests 32 and 33 call `page.waitForTimeout()` directly (using the raw Playwright `page` fixture) while all other tests in the same spec file route through `administrationUserPage.wait()`. This bypasses logger instrumentation and breaks the abstraction layer.

**❌ Current (tests 32, 33):**
```javascript
test('ADMIN-USR-ACC-EXP-32 ...', async ({ page }) => {
  // ...
  await page.waitForTimeout(WAIT_TIMES.GRID_STABILIZATION);
```

**✅ Fix — use the page object wrapper:**
```javascript
test('ADMIN-USR-ACC-EXP-32 ...', async () => {  // remove { page } fixture
  // ...
  await administrationUserPage.wait(TIMEOUTS.GRID_STABILIZATION);
```

---

### 11. Cleanup Only in `try` Block — Tests 15, 16, 17 Leave Dirty State on Failure (`adminUserSiteAccessExpirationDate.spec.js`)

Tests 15, 16, and 17 perform cleanup as the final steps of the `try` block. If any earlier test step throws, the cleanup is skipped and the test data is left in a modified state that can cascade into later test runs.

**❌ Current:**
```javascript
try {
  // ... test steps ...
  // Cleanup at end:
  await administrationUserPage.removeAccessForSite(siteName);
  await administrationUserPage.clickSaveButton();
  await administrationUserPage.waitForSuccessMessage();
} catch (error) {
  // cleanup never runs if error thrown above
  throw error;
}
```

**✅ Fix — move cleanup into `finally`:**
```javascript
let accessGranted = false;
try {
  // ... test steps ...
  accessGranted = true;
} catch (error) {
  logger.testEnd('...', 'FAILED');
  throw error;
} finally {
  if (accessGranted) {
    await cleanupSiteAccess(siteName, userName).catch((e) =>
      logger.warn(`Cleanup failed: ${e.message}`)
    );
  }
}
```

---

### 12. Ghost Step Log Without Action — Test 17, Step 11b (`adminUserSiteAccessExpirationDate.spec.js`)

Step 11b logs that it will wait for grid rows, but the `await` call was removed. The step exists as logging only, which is misleading.

**❌ Current:**
```javascript
logger.step('Step 11b: Wait for site grid rows to be populated');
logger.info('✓ Site grid rows populated');  // no actual wait before this
```

**✅ Fix — either add the wait back or remove the step:**
```javascript
// Option A: restore the wait
logger.step('Step 11b: Wait for site grid rows to be populated');
await administrationUserPage.waitForGridRows();
logger.info('✓ Site grid rows populated');

// Option B: remove the step entirely if it's genuinely not needed
```

---

### 13. Sequential DOM Scan in `_findColumnPositions` / `_findDateValuesAfterIndex` Is Fragile and Slow (`administrationUserPage.js`)

Both `_findColumnPositions` and `_findDateValuesAfterIndex` scan **all divs on the page** sequentially by index, reading each `textContent()`. On a large report page this can be hundreds of calls. Using Playwright's text-based locators is both faster and more maintainable.

**❌ Current:**
```javascript
async _findColumnPositions() {
  const allDivs = this.page.locator('div').filter({ hasText: /.+/ });
  const divCount = await allDivs.count();  // could be 500+
  // ...
  for (let i = 0; i < divCount; i++) {
    const divText = await allDivs.nth(i).textContent(); // sequential round-trips
```

**✅ Fix — use targeted locators:**
```javascript
async _findColumnPositions() {
  // Use Playwright's built-in text matching instead of iterating all divs
  const lastLogonHeader = this.page.locator('div', { hasText: /^Last Logon$/ }).first();
  const accessExpHeader = this.page.locator('div', { hasText: /^Access$/ })
    .filter({ has: this.page.locator('xpath=following-sibling::div[1][normalize-space()="Expiration"]') })
    .first();

  const [lastLogonBox, accessExpBox] = await Promise.all([
    lastLogonHeader.boundingBox(),
    accessExpHeader.boundingBox(),
  ]);

  if (!lastLogonBox || !accessExpBox) {
    throw new Error('Could not locate required column headers');
  }
  return { lastLogon: lastLogonBox.x, accessExpiration: accessExpBox.x };
}
```

---

### 14. Large Non-Delegated Methods Remain in Facade (`administrationUserPage.js`)

These methods implement business logic directly in the facade rather than delegating to a module. They are inconsistent with the established delegation pattern and should be extracted to the appropriate module (`filterOps`, `notificationOps`):

| Method | Lines (approx.) | Correct module |
|--------|-----------------|----------------|
| `verifyFilteredSites` | ~60 | `filterOps` |
| `verifySitesVisibleInDropdown` | ~50 | `filterOps` |
| `verifyOnlySiteVisibleInDropdown` | ~40 | `filterOps` |
| `filterByEventType` | ~35 | `notificationOps` |
| `clickAdminToolbar` | ~20 | new `reportOps` or `navigationOps` |
| `clickUserStatus` / `verifyUsersTextVisible` / `clickCreateReport` | ~70 | new `reportOps` |

---

## 🟢 What Is Done Well

| Area | Observation |
|------|-------------|
| **Async/Await** | 100% consistent — no `.then()` chains or callbacks in either file |
| **No `var`** | Both files use only `const` and `let` throughout |
| **JSDoc coverage** | Nearly all public methods in the facade have complete JSDoc |
| **Logger usage** | Every action, step, and assertion is properly instrumented |
| **Test structure** | `beforeEach` correctly initializes `testSetup`; `try/catch` with `logger.testEnd` is consistent |
| **Helper extraction** | `setupUserForSiteAccess`, `grantSiteAccessAndSave`, `prepareGridForVerification`, `cleanupSiteAccess` are well-scoped DRY helpers |
| **`cleanupSiteAccess` error handling** | Intentional silent swallow with comment is the correct approach for tear-down |
| **Delegation pattern** | The facade correctly delegates to 10 modules for the majority of operations |
| **TIMEOUTS constants (partial)** | Report and scroll methods at lines 1804–1953 already use `TIMEOUTS.SHORT_WAIT`, `TIMEOUTS.REPORT_GENERATION`, etc. — this is the correct pattern to extend throughout |
| **Role-based locators** | `getByRole`, `getByText`, `getByLabel` are used correctly throughout |
| **Test isolation** | `test.beforeEach` re-instantiates `testSetup` on every test — correct |

---

## Summary of Actions Required

| Priority | Count | Action |
|----------|-------|--------|
| 🔴 Must fix | 4 | Hard-wait literals → TIMEOUTS, orphan JSDoc, unused `todayDate` captures, `getAccessStatus` polling |
| 🟡 Improve | 10 | WAIT_TIMES consolidation, magic string, double space, date builder duplication, `for...of` → filter, inconsistent wait API, finally cleanup, ghost step log, DOM scan refactor, non-delegated facade methods |
