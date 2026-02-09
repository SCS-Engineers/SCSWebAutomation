# GitHub Copilot Instructions for SCS Web Automation

## Project Overview

This is a **Playwright-based test automation framework** using the **Page Object Model (POM)** pattern for testing the SCS (Site Control System) web application. The project generates test reports using Allure and Playwright's built-in reporters.

## Technology Stack

- **Test Framework**: Playwright Test (`@playwright/test`)
- **Language**: JavaScript (ES6+)
- **Reporting**: Allure Reporter, Playwright HTML Reporter
- **Configuration**: dotenv for environment variables
- **Style Guide**: Google JavaScript Style Guide

---

## Coding Standards

### General JavaScript (ES6+)

- Use `const` for variables that are never reassigned, `let` for variables that may be reassigned. Never use `var`.
- Use arrow functions for anonymous functions and callbacks.
- Use template literals for string interpolation: `` `Hello ${name}` ``
- Use destructuring for objects and arrays when appropriate.
- Use async/await for asynchronous operations (never use raw Promises with `.then()` chains in tests).
- Use meaningful, descriptive variable and function names in camelCase.
- Class names should use PascalCase.
- Constants should use UPPER_SNAKE_CASE.

### Google Style Guide Highlights

- Use 2-space indentation.
- Always use semicolons.
- Use single quotes for strings (except to avoid escaping).
- Maximum line length: 80-120 characters.
- One statement per line.
- Use JSDoc comments for all classes and public methods.

---

## Project Structure

```
SCS/
├── pages/                    # Page Object classes
│   ├── basePage.js          # Base page with common methods
│   ├── loginPage.js         # Login page object
│   ├── siteStatusDashboardPage.js
│   └── ...
├── test/                     # Test specifications
│   ├── Authentication/       # Authentication tests
│   └── Data Services/        # Data services tests
│       └── Dashboard/        # Dashboard-specific tests
├── utils/                    # Utility classes
│   ├── credentials.js       # Credential management
│   ├── helper.js            # Helper functions
│   ├── logger.js            # Logging utility
│   └── testSetup.js         # Test setup and initialization
├── data/                     # Test data
│   └── testData.json        # Test data configuration
├── playwright.config.js      # Playwright configuration
└── package.json
```

---

## Page Object Model (POM) Guidelines

### Creating Page Objects

All page objects must:

1. **Extend `BasePage`** - Inherit common functionality from the base class.
2. **Define locators in constructor** - All element locators should be defined as class properties.
3. **Use descriptive locator names** - Names should clearly indicate the element purpose.
4. **Include JSDoc comments** - Document all methods with parameters and return types.

```javascript
const BasePage = require('./basePage');

/**
 * Example Page class extending BasePage
 */
class ExamplePage extends BasePage {
  constructor(page) {
    super(page);
    
    // Define locators as class properties
    this.submitButton = 'button:has-text("Submit")';
    this.inputField = 'input[name="fieldName"]';
    this.errorMessage = '.error-message';
  }

  /**
   * Submit the form with given data
   * @param {string} data - Data to submit
   */
  async submitForm(data) {
    this.logger.action('Submitting form');
    await this.fill(this.inputField, data);
    await this.click(this.submitButton);
  }
}

module.exports = ExamplePage;
```

### Locator Best Practices

Use locators in this priority order:

1. **Role-based locators** (most stable): `role=button[name="Submit"]`
2. **Test IDs**: `[data-testid="submit-btn"]`
3. **Playwright text selectors**: `text=Submit`, `button:has-text("Submit")`
4. **CSS selectors with semantic meaning**: `#login-button`, `.submit-form`
5. **Avoid**: XPath, complex CSS selectors, index-based selectors

---

## Test File Guidelines

### Test File Naming

- Use format: `featureName.spec.js`
- Place in appropriate folder under `test/`
- Use descriptive names that indicate what is being tested

### Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const logger = require('../../../utils/logger');

test.describe('Feature Name Tests', () => {
  let testSetup;
  let pageObject;

  test.beforeEach(async ({ page }) => {
    testSetup = new TestSetup();
    await testSetup.initialize(page);
    pageObject = testSetup.getPageObject();
  });

  test('TEST-ID-01 - Test description', async ({ page }) => {
    logger.testStart('TEST-ID-01 - Test description');
    
    // Arrange
    await testSetup.loginAsValidUser();
    await testSetup.acknowledgeHealthAndSafety();
    
    // Act
    logger.step('Perform action');
    await pageObject.performAction();
    
    // Assert
    logger.step('Verify result');
    await expect(pageObject.getElement()).toBeVisible();
    
    logger.testEnd('TEST-ID-01 - Test description', 'PASSED');
  });
});
```

### Test Naming Convention

- Use format: `TEST-ID-XX - Descriptive test name`
- Test IDs should be unique and follow a consistent pattern (e.g., `DS-SITE-STATUS-01`, `LOGIN-01`)
- Descriptions should clearly indicate what is being verified

---

## Logging Guidelines

Always use the `logger` utility for consistent logging:

```javascript
const logger = require('../utils/logger');

// Test lifecycle
logger.testStart('Test name');
logger.testEnd('Test name', 'PASSED');

// Steps and actions
logger.step('Step description');
logger.action('Clicking button', 'button selector');

// Information
logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');
```

---

## TestSetup Utility

Use `TestSetup` for common test operations:

```javascript
const testSetup = new TestSetup();
await testSetup.initialize(page);

// Login helpers
await testSetup.loginAsValidUser();
await testSetup.acknowledgeHealthAndSafety();

// Get page objects
const loginPage = testSetup.getLoginPage();
const dashboardPage = testSetup.getSiteStatusDashboardPage();
```

---

## Assertions

Use Playwright's built-in assertions with `expect`:

```javascript
const { expect } = require('@playwright/test');

// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText('Expected text');
await expect(element).toContainText('Partial text');

// Attributes
await expect(element).toHaveAttribute('href', '/expected-url');

// State
await expect(element).toBeEnabled();
await expect(element).toBeDisabled();
await expect(element).toBeChecked();

// Values
await expect(inputElement).toHaveValue('expected value');
```

---

## Async/Await Patterns

### Always use async/await

```javascript
// ✅ Correct
async clickAndVerify() {
  await this.click(this.button);
  await this.waitForElement(this.resultElement);
}

// ❌ Incorrect - Don't use Promise chains
clickAndVerify() {
  return this.click(this.button)
    .then(() => this.waitForElement(this.resultElement));
}
```

### Handle retries gracefully

```javascript
async navigateWithRetry(url, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      return;
    } catch (error) {
      lastError = error;
      this.logger.info(`Attempt ${attempt}/${maxRetries} failed`);
      if (attempt < maxRetries) {
        await this.page.waitForTimeout(2000);
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

---

## Test Data Management

### Using testData.json

Store test data in `data/testData.json`:

```javascript
const testData = require('../../../data/testData.json');

// Access test data
const { contactIconClass, expectedTabs } = testData.testData.siteStatusDashboard;
```

### Credentials Management

Never hardcode credentials. Use the `credentials.js` utility:

```javascript
const credentials = require('./credentials');

const user = credentials.getUserCredentials('validUser');
const url = credentials.getUrl('loginPage');
```

---

## Waits and Timeouts

### Prefer explicit waits over hard waits

```javascript
// ✅ Correct - Wait for specific condition
await this.page.waitForSelector(selector, { state: 'visible', timeout: 30000 });
await this.page.waitForLoadState('networkidle');

// ❌ Avoid - Hard waits
await this.page.waitForTimeout(5000);
```

### Timeout Configuration

Default timeouts are configured in `playwright.config.js`:
- Test timeout: 300 seconds (5 minutes)
- Expect timeout: 30 seconds
- Action timeout: 30 seconds
- Navigation timeout: 120 seconds

---

## Helper Methods (utils/helper.js)

Use helper utilities for common operations:

```javascript
const helper = require('../../../utils/helper');

// Generate random data
const email = helper.generateRandomEmail();
const randomString = helper.generateRandomString(10);

// Date utilities
const currentDate = helper.getCurrentDate('YYYY-MM-DD');
const isCurrentMonth = helper.isCurrentMonthInDateRange(dateText);

// Wait utility
await helper.wait(1000);
```

---

## Code Comments

### JSDoc for Classes and Methods

```javascript
/**
 * Site Status Dashboard Page class extending BasePage
 * Handles all interactions with the Site Status Dashboard
 */
class SiteStatusDashboardPage extends BasePage {
  /**
   * Click the contact icon for a site
   * @param {string} iconClass - CSS class of the contact icon
   * @returns {Promise<void>}
   */
  async clickContactIcon(iconClass) {
    // Implementation
  }
}
```

### Inline Comments

Use inline comments sparingly for complex logic:

```javascript
// Regex pattern: MMM DD, YYYY HH:MM AM/PM (e.g., "Jan 16, 2026 4:29 PM")
const datePattern = new RegExp(dateTimePattern);
```

---

## Error Handling

### Use try-catch for expected failures

```javascript
async safeClick(selector) {
  try {
    await this.page.click(selector, { timeout: 5000 });
    return true;
  } catch (error) {
    this.logger.warn(`Element not clickable: ${selector}`);
    return false;
  }
}
```

### Log errors with context

```javascript
try {
  await this.performAction();
} catch (error) {
  this.logger.error(`Failed to perform action: ${error.message}`);
  throw error;
}
```

---

## Don't Do

- ❌ Don't use `var` - use `const` or `let`
- ❌ Don't use callback-based async patterns
- ❌ Don't hardcode credentials or sensitive data
- ❌ Don't use hard-coded waits (`waitForTimeout`) when explicit waits are possible
- ❌ Don't write tests without proper logging
- ❌ Don't create page methods that don't use `this.logger`
- ❌ Don't use XPath selectors when CSS or role-based selectors work
- ❌ Don't skip the `beforeEach` setup in test files
- ❌ Don't use anonymous test names - always include TEST-ID

---

## Do

- ✅ Use `async/await` for all asynchronous operations
- ✅ Follow the Page Object Model pattern
- ✅ Log all test steps and actions
- ✅ Use meaningful test IDs and descriptions
- ✅ Extend `BasePage` for all page objects
- ✅ Use `TestSetup` for common test initialization
- ✅ Store test data in `testData.json`
- ✅ Handle credentials via `credentials.js` utility
- ✅ Use Playwright's built-in assertions
- ✅ Document code with JSDoc comments
- ✅ Use descriptive locator names in page objects
