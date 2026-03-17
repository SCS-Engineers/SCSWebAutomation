# Code Quality Checklist - Quick Reference

**Purpose:** Use this checklist during code reviews and before committing code  
**Based on:** [code-quality-review-report.md](code-quality-review-report.md)

---

## ✅ Pre-Commit Checklist

### 1. Variables & Constants
- [ ] No `var` keyword used (use `const` or `let`)
- [ ] Variables use `const` by default (only `let` when reassignment needed)
- [ ] No magic numbers (extract to constants)
- [ ] Timeout values use constants from `pages/constants/timeouts.js`

**Examples:**
```javascript
// ❌ BAD
var count = 0;
await page.waitForTimeout(5000);

// ✅ GOOD
const TIMEOUTS = require('../pages/constants/timeouts');
let count = 0;  // Use let only if reassigned
await page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
```

---

### 2. Async/Await
- [ ] All async functions use `async/await` (no `.then()` chains)
- [ ] All Promises are awaited
- [ ] No forgotten `await` keywords

**Examples:**
```javascript
// ❌ BAD
function loginUser(username, password) {
  return this.page.fill('#username', username)
    .then(() => this.page.fill('#password', password))
    .then(() => this.page.click('#login'));
}

// ✅ GOOD
async loginUser(username, password) {
  await this.page.fill('#username', username);
  await this.page.fill('#password', password);
  await this.page.click('#login');
}
```

---

### 3. Waits & Timeouts
- [ ] No hard-coded `waitForTimeout()` with numbers
- [ ] Prefer explicit waits over hard waits
- [ ] Use Playwright auto-waiting when possible

**Examples:**
```javascript
// ❌ BAD
await page.waitForTimeout(2000);
await element.click();

// ✅ GOOD
await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.NETWORK_IDLE_SHORT });
await expect(element).toBeVisible();  // Auto-waits up to 30s
await element.click();  // Auto-waits for actionable state
```

---

### 4. Error Handling
- [ ] No empty `catch` blocks
- [ ] All caught errors are logged
- [ ] Critical operations have try-catch blocks

**Examples:**
```javascript
// ❌ BAD
await someOperation().catch(() => {});

// ✅ GOOD
await someOperation().catch((error) => {
  logger.warn(`Operation failed: ${error.message}. Continuing...`);
});

// ✅ BETTER - Use try-catch for complex logic
try {
  await criticalOperation();
} catch (error) {
  logger.error(`Critical operation failed: ${error.message}`);
  throw error;  // Re-throw if test should fail
}
```

---

### 5. Logging
- [ ] All test steps logged with `logger.step()` or `logger.action()`
- [ ] No `console.log()` in test or page files
- [ ] Use appropriate log levels (info, warn, error, debug)

**Examples:**
```javascript
// ❌ BAD
console.log('Clicking button');
await button.click();

// ✅ GOOD
logger.action('Clicking submit button');
await button.click();
logger.info('✓ Submit button clicked successfully');
```

---

### 6. Page Object Methods
- [ ] All page methods have JSDoc comments
- [ ] Methods include `@param` and `@returns` tags
- [ ] Method names are descriptive (avoid generic names like `doSomething()`)

**Examples:**
```javascript
// ❌ BAD
async doLogin(u, p) {
  await this.page.fill('#user', u);
  await this.page.fill('#pass', p);
}

// ✅ GOOD
/**
 * Login with provided credentials
 * @param {string} username - User's login username
 * @param {string} password - User's password
 * @returns {Promise<void>}
 */
async loginWithCredentials(username, password) {
  this.logger.action(`Logging in as ${username}`);
  await this.fill(this.usernameInput, username);
  await this.fill(this.passwordInput, password);
  await this.click(this.loginButton);
}
```

---

### 7. Test Structure
- [ ] Test has unique ID (e.g., `AUTH-LOGIN-01`)
- [ ] Test description is clear and specific
- [ ] Test uses `logger.testStart()` and `logger.testEnd()`
- [ ] Test follows Arrange-Act-Assert pattern

**Examples:**
```javascript
// ❌ BAD
test('test login', async ({ page }) => {
  // No logging, no clear structure
  await page.goto('/login');
  await page.fill('#username', 'user');
  expect(await page.title()).toBe('Dashboard');
});

// ✅ GOOD
test('AUTH-LOGIN-01 - Login with valid credentials', async ({ page }) => {
  logger.testStart('AUTH-LOGIN-01 - Login with valid credentials');
  
  // Arrange
  await testSetup.initialize(page);
  const user = credentials.getUserCredentials('validUser');
  
  // Act
  logger.step('Performing login');
  await loginPage.loginWithCredentials(user.username, user.password);
  
  // Assert
  logger.step('Verifying successful login');
  await expect(page).toHaveURL(/dashboard/);
  
  logger.testEnd('AUTH-LOGIN-01', 'PASSED');
});
```

---

### 8. Naming Conventions
- [ ] Variables: `camelCase`
- [ ] Functions/Methods: `camelCase`
- [ ] Classes: `PascalCase`
- [ ] Constants: `UPPER_SNAKE_CASE`
- [ ] Files: `camelCase.js` or `PascalCase.js` for classes

**Examples:**
```javascript
// ✅ GOOD
const userName = 'peter';  // camelCase variable
const MAX_RETRIES = 3;     // UPPER_SNAKE_CASE constant

class LoginPage extends BasePage {  // PascalCase class
  async enterUsername(username) {   // camelCase method
    // ...
  }
}
```

---

### 9. Code Organization
- [ ] Imports at top of file
- [ ] Constants defined before functions
- [ ] Related methods grouped together
- [ ] No duplicate code (extract to shared methods)

**Example Structure:**
```javascript
// Imports
const { test, expect } = require('@playwright/test');
const TestSetup = require('./utils/testSetup');
const logger = require('./utils/logger');

// Constants
const TEST_CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
};

// Test suite
test.describe('Feature Tests', () => {
  // Setup
  test.beforeEach(async ({ page }) => {
    // ...
  });

  // Tests
  test('TEST-01', async ({ page }) => {
    // ...
  });
});
```

---

### 10. Locators
- [ ] Locators defined as class properties in constructor
- [ ] Use role-based selectors when possible
- [ ] Avoid XPath unless absolutely necessary
- [ ] Locators stored in constants file when used by multiple methods

**Priority Order:**
1. Role-based: `page.getByRole('button', { name: 'Submit' })`
2. Test IDs: `[data-testid="submit-button"]`
3. Playwright text: `page.getByText('Submit')`
4. CSS selectors: `#login-button`, `.submit-form`
5. XPath: (avoid if possible)

---

## 🔍 Code Review Checklist

Use this when reviewing pull requests:

### General Quality
- [ ] No `var` keyword usage
- [ ] No `console.log()` in test/page files
- [ ] All async functions properly use `await`
- [ ] Error handling present for critical operations
- [ ] No empty catch blocks

### Test Quality
- [ ] Test has unique ID and clear description
- [ ] Test setup uses TestSetup utility or fixtures
- [ ] Test includes proper logging (testStart/testEnd)
- [ ] Assertions use Playwright's `expect()` API
- [ ] No hard-coded waits (or justified with comment)

### Code Maintainability
- [ ] Methods are focused (do one thing)
- [ ] No duplicated code
- [ ] Magic numbers extracted to constants
- [ ] JSDoc comments present
- [ ] Naming conventions followed

### Performance
- [ ] No unnecessary waits
- [ ] Locators reused (not recreated in loops)
- [ ] No inefficient loops that could use Promise.all

### Security
- [ ] No hardcoded credentials
- [ ] Sensitive data not logged
- [ ] Environment variables used for secrets

---

## 🚨 Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Hard-Coded Waits
```javascript
// BAD
await page.waitForTimeout(5000);
```

**Why:** Slows down tests, brittle, not responsive to actual page state.

**Fix:** Use explicit waits or Playwright auto-waiting.

---

### ❌ Anti-Pattern 2: Empty Catch Blocks
```javascript
// BAD
await operation().catch(() => {});
```

**Why:** Silently swallows errors, makes debugging impossible.

**Fix:** Add logging or document why error is ignored.

---

### ❌ Anti-Pattern 3: Using var
```javascript
// BAD
var count = 0;
```

**Why:** Function-scoped, hoisting issues, no longer needed in ES6+.

**Fix:** Use `const` (preferred) or `let`.

---

### ❌ Anti-Pattern 4: XPath Locators
```javascript
// BAD
await page.locator('//div[@class="container"]//button[1]').click();
```

**Why:** Brittle, hard to read, breaks easily with DOM changes.

**Fix:** Use role-based or CSS selectors.

---

### ❌ Anti-Pattern 5: Callback-Based Async
```javascript
// BAD
function doSomething() {
  return page.click(button).then(() => {
    return page.fill(input, 'text');
  });
}
```

**Why:** Hard to read, error handling complex, not modern.

**Fix:** Use async/await.

---

### ❌ Anti-Pattern 6: No Error Handling
```javascript
// BAD
async criticalOperation() {
  await this.database.deleteAllData();
}
```

**Why:** No feedback when operation fails.

**Fix:** Add try-catch and logging.

---

### ❌ Anti-Pattern 7: Generic Method Names
```javascript
// BAD
async doStuff() { }
async handleClick() { }
async process() { }
```

**Why:** Unclear purpose, hard to find, not self-documenting.

**Fix:** Use descriptive names like `loginWithCredentials()`, `clickSubmitButton()`.

---

### ❌ Anti-Pattern 8: Magic Numbers
```javascript
// BAD
for (let i = 0; i < 50; i++) {
  await page.waitForTimeout(2000);
}
```

**Why:** No context, hard to maintain, unclear intent.

**Fix:** Extract to named constants.

---

### ❌ Anti-Pattern 9: Mixing Test Logic in Page Objects
```javascript
// BAD - Page object should not contain assertions
class LoginPage extends BasePage {
  async verifyLoginSuccess() {
    expect(await this.isLoggedIn()).toBeTruthy();  // ❌ Assertion in page object
  }
}
```

**Why:** Breaks separation of concerns, reduces reusability.

**Fix:** Page objects return data, tests do assertions.

```javascript
// GOOD
class LoginPage extends BasePage {
  async isLoggedIn() {
    return this.isVisible(this.logoutButton);  // Returns boolean
  }
}

// In test file:
expect(await loginPage.isLoggedIn()).toBeTruthy();  // ✅ Assertion in test
```

---

### ❌ Anti-Pattern 10: Not Using Page Object Model
```javascript
// BAD - Direct page interactions in test
test('login test', async ({ page }) => {
  await page.fill('#username', 'user');
  await page.fill('#password', 'pass');
  await page.click('button[type="submit"]');
});
```

**Why:** Duplicated selectors, hard to maintain, breaks DRY principle.

**Fix:** Use page objects.

```javascript
// GOOD
test('login test', async ({ page }) => {
  await loginPage.loginWithCredentials('user', 'pass');
});
```

---

## 📊 Quick File Size Check

When reviewing files, check if they need refactoring:

| File Type | Recommended Max | Warning Level | Action Required |
|-----------|----------------|---------------|-----------------|
| Test Spec | 500 lines | 800 lines | Split into multiple test files |
| Page Object | 800 lines | 1,200 lines | Split into modules |
| Utility | 300 lines | 500 lines | Extract related functions to separate files |
| Constants | 200 lines | 300 lines | Split by feature area |

**Current Large Files:**
- ⚠️ `administrationUserPage.js` - 4,649 lines (REFACTOR REQUIRED)
- ⚠️ `siteStatusDashboardPage.js` - 2,800+ lines (REFACTOR RECOMMENDED)
- ⚠️ `adminUserSiteAccessExpirationDate.spec.js` - 1,610 lines (Consider splitting)

---

## 🎯 Before You Commit

Run this quick checklist:

```bash
# 1. Run tests affected by your changes
npx playwright test path/to/your/test.spec.js

# 2. Check for console.log (should return 0 or 1 result)
grep -r "console.log" pages/ test/ utils/ | grep -v "node_modules"

# 3. Check for var usage (should return 0 results)
grep -rn "\bvar\b" pages/ test/ utils/ | grep -v "node_modules"

# 4. Check for hard-coded timeouts
grep -rn "waitForTimeout([0-9]" test/ pages/

# 5. Run full test suite (if time permits)
npx playwright test
```

---

## 📚 Additional Resources

- [Code Quality Review Report](code-quality-review-report.md) - Full analysis
- [Code Quality Action Plan](code-quality-action-plan.md) - Implementation roadmap
- [GitHub Copilot Instructions](.github/copilot-instructions.md) - Coding standards
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

**Quick Tip:** Bookmark this file and reference it before every commit!

**Last Updated:** 2025-01-16
