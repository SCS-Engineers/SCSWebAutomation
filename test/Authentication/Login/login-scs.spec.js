const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const LoginPage = require('../../../pages/loginPage');
const credentials = require('../../../utils/credentials');
const logger = require('../../../utils/logger');
const testData = require('../../../data/testData.json');

test.describe('SCS Login Tests - Positive Scenarios', () => {
  let testSetup;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    testSetup = new TestSetup();
    await testSetup.initialize(page);
    loginPage = testSetup.getLoginPage();
  });

  test('AUTH-01 - Login with valid credentials (peter/Testing.123)', async ({ page }) => {
    logger.testStart('AUTH-01 - Login with valid credentials');

    const user = credentials.getUserCredentials('validUser');
    logger.step(`Step 1: Login with credentials ${user.username}/${user.password}`);
    logger.info(`User credentials loaded: ${user.username}`);

    logger.step('Performing login');
    await loginPage.loginAndWaitForRedirect(user.username, user.password);

    logger.step('Verifying successful login');
    const currentUrl = page.url();
    logger.info(`Current URL after login: ${currentUrl}`);

    const logoutButton = await loginPage.isLogoutButtonVisible();
    logger.info(`Logout button visible: ${logoutButton}`);

    const loginSuccessful = !currentUrl.includes('/login');
    logger.verify('Login successful - redirected to dashboard', loginSuccessful);
    expect(loginSuccessful).toBeTruthy();

    logger.verify('Logout button is visible', logoutButton);
    expect(logoutButton).toBeTruthy();

    // Additional verification - check if URL contains 'etools'
    if (currentUrl.includes('etools')) {
      logger.info('✓ Successfully redirected to etools dashboard');
      expect(currentUrl).toContain('etools');
    }

    logger.testEnd('AUTH-01 - Login with valid credentials', 'PASSED');
  });

  test('AUTH-08 - Verify that Health safety popup message is displayed for the applicable users', async ({ page }) => {
    logger.testStart('AUTH-08 - Health safety popup for applicable users');

    logger.info('Getting valid user credentials from test data');
    const user = credentials.getUserCredentials('validUser');
    logger.info(`User credentials loaded: ${user.username}`);

    logger.step('Performing login');
    await loginPage.loginAndWaitForRedirect(user.username, user.password);

    logger.step('Verifying successful login');
    const currentUrl = page.url();
    logger.info(`Current URL after login: ${currentUrl}`);

    const loginSuccessful = !currentUrl.includes('/login');
    logger.verify('Login successful - redirected to dashboard', loginSuccessful);
    expect(loginSuccessful).toBeTruthy();

    logger.step('Verifying Health & Safety Message is displayed');
    const isHealthSafetyVisible = await loginPage.isHealthSafetyMessageVisible();

    logger.info(`Health & Safety Message visible: ${isHealthSafetyVisible}`);
    logger.verify('Health & Safety Message is displayed for applicable user', isHealthSafetyVisible);
    expect(isHealthSafetyVisible).toBeTruthy();

    logger.testEnd('AUTH-08 - Health safety popup for applicable users', 'PASSED');
  });

  test('AUTH-09 - Verify that Health safety popup message is not displayed for non applicable users', async ({ page }) => {
    logger.testStart('AUTH-09 - Health safety popup not shown for non applicable users');

    logger.info('Getting non-applicable user credentials from test data');
    const user = credentials.getUserCredentials('nonApplicableUser');
    logger.info(`User credentials loaded: ${user.username}`);

    logger.step('Performing login');
    await loginPage.loginAndWaitForRedirect(user.username, user.password);

    logger.step('Verifying successful login');
    const currentUrl = page.url();
    logger.info(`Current URL after login: ${currentUrl}`);

    const loginSuccessful = !currentUrl.includes('/login');
    logger.verify('Login successful - redirected to dashboard', loginSuccessful);
    expect(loginSuccessful).toBeTruthy();

    logger.step('Verifying Health & Safety Message is NOT displayed');
    const isHealthSafetyVisible = await loginPage.isHealthSafetyMessageVisible(5000);

    logger.info(`Health & Safety Message visible: ${isHealthSafetyVisible}`);
    logger.verify('Health & Safety Message is NOT displayed for non-applicable user', !isHealthSafetyVisible);
    expect(isHealthSafetyVisible).toBeFalsy();

    logger.testEnd('AUTH-09 - Health safety popup not shown for non applicable users', 'PASSED');
  });

  test('AUTH-11 - Verify that a proper error message is displayed for a user with no access to any sites', async ({ page }) => {
    logger.testStart('AUTH-11 - Error message for user with no site access');

    logger.info('Getting no access user credentials from test data');
    const user = credentials.getUserCredentials('noAccessUser');
    logger.info(`User credentials loaded: ${user.username}`);

    logger.step('Performing login');
    await loginPage.enterUsername(user.username);
    await loginPage.enterPassword(user.password);

    logger.step('Waiting for error dialog to be displayed');
    const dialogPromise = loginPage.getDialogMessageAndAccept();
    await loginPage.clickLoginButton();
    const dialogMessage = await dialogPromise;

    logger.info(`Alert dialog appeared with message: ${dialogMessage}`);

    logger.step('Verifying error message for user with no site access');
    const hasErrorMessage = dialogMessage.length > 0;

    logger.info(`Error dialog visible: ${hasErrorMessage}`);
    logger.info(`Error message: ${dialogMessage}`);
    logger.verify('Error message displayed for user with no site access', hasErrorMessage);
    expect(hasErrorMessage).toBeTruthy();

    const expectedMessage = "User's configuration is not setup. Please contact SCSeTools administrators.";
    logger.info(`Expected message: ${expectedMessage}`);
    logger.verify('Error message matches expected text', dialogMessage === expectedMessage);
    expect(dialogMessage).toBe(expectedMessage);

    logger.testEnd('AUTH-11 - Error message for user with no site access', 'PASSED');
  });
});

test.describe('SCS Login Tests - Negative Scenarios', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    logger.divider();
    logger.info('Setting up test - Initializing page objects');
    loginPage = new LoginPage(page);

    // Navigate to login page
    const loginUrl = credentials.getUrl('loginPage');
    logger.info(`Navigating to login page: ${loginUrl}`);
    await loginPage.navigate(loginUrl);
    await loginPage.waitForDomContentLoaded();
    logger.info('Test setup completed');
    logger.divider();
  });

  test('AUTH-02 - Login with invalid username', async ({ page }) => {
    logger.testStart('AUTH-02 - Login with invalid username');

    // Get invalid username credentials
    logger.info('Getting invalid username credentials');
    const user = credentials.getUserCredentials('invalidUsername');
    logger.info(`Testing with username: ${user.username}`);

    // Perform login
    await loginPage.login(user.username, user.password);
    await loginPage.waitForDomContentLoaded();

    // Verify login failed - still on login page or error message shown
    logger.step('Verifying login failed');
    const currentUrl = page.url();
    logger.info(`Current URL after login attempt: ${currentUrl}`);

    const loginFailed = currentUrl.includes('/login');
    logger.verify('Login failed - still on login page', loginFailed);
    expect(loginFailed).toBeTruthy();

    logger.testEnd('AUTH-02 - Login with invalid username', 'PASSED');
  });

  test('AUTH-03 - Login with invalid password', async ({ page }) => {
    logger.testStart('AUTH-03 - Login with invalid password');

    // Get invalid password credentials
    logger.info('Getting credentials with invalid password');
    const user = credentials.getUserCredentials('invalidPassword');
    logger.info(`Testing with username: ${user.username} and wrong password`);

    // Perform login
    await loginPage.login(user.username, user.password);
    await loginPage.waitForDomContentLoaded();

    // Verify login failed
    logger.step('Verifying login failed with wrong password');
    const currentUrl = page.url();
    logger.info(`Current URL after login attempt: ${currentUrl}`);

    const loginFailed = currentUrl.includes('/login');
    logger.verify('Login failed - still on login page', loginFailed);
    expect(loginFailed).toBeTruthy();

    logger.testEnd('AUTH-03 - Login with invalid password', 'PASSED');
  });

  test('AUTH-04 - Login with empty username', async ({ page }) => {
    logger.testStart('AUTH-04 - Login with empty username');

    logger.info('Attempting to login with empty username');

    // Enter only password
    await loginPage.enterPassword('Testing.123');
    await loginPage.clickLoginButton();

    // Verify still on login page
    logger.step('Verifying login validation for empty username');
    const currentUrl = page.url();
    logger.info(`Current URL: ${currentUrl}`);

    const stillOnLoginPage = currentUrl.includes('/login');
    logger.verify('Validation worked - still on login page', stillOnLoginPage);
    expect(stillOnLoginPage).toBeTruthy();

    logger.testEnd('AUTH-04 - Login with empty username', 'PASSED');
  });

  test('AUTH-05 - Login with empty password', async ({ page }) => {
    logger.testStart('AUTH-05 - Login with empty password');

    logger.info('Attempting to login with empty password');

    // Enter only username
    await loginPage.enterUsername('peter');
    await loginPage.clickLoginButton();

    // Verify still on login page
    logger.step('Verifying login validation for empty password');
    const currentUrl = page.url();
    logger.info(`Current URL: ${currentUrl}`);

    const stillOnLoginPage = currentUrl.includes('/login');
    logger.verify('Validation worked - still on login page', stillOnLoginPage);
    expect(stillOnLoginPage).toBeTruthy();

    logger.testEnd('AUTH-05 - Login with empty password', 'PASSED');
  });

  test('AUTH-07 - Login with empty credentials', async ({ page }) => {
    logger.testStart('AUTH-07 - Login with empty credentials');

    logger.info('Attempting to login without entering any credentials');

    // Click login without entering credentials
    await loginPage.clickLoginButton();

    // Verify still on login page
    logger.step('Verifying login validation for empty credentials');
    const currentUrl = page.url();
    logger.info(`Current URL: ${currentUrl}`);

    const stillOnLoginPage = currentUrl.includes('/login');
    logger.verify('Validation worked - still on login page', stillOnLoginPage);
    expect(stillOnLoginPage).toBeTruthy();

    logger.testEnd('AUTH-07 - Login with empty credentials', 'PASSED');
  });

  test('AUTH-06 - Login with invalid username and password', async ({ page }) => {
    logger.testStart('AUTH-0 - Login with invalid username and password');

    // Get invalid credentials (both username and password)
    logger.info('Getting invalid credentials for both username and password');
    const user = credentials.getUserCredentials('invalidBoth');
    logger.info(`Testing with username: ${user.username}`);

    // Perform login
    await loginPage.login(user.username, user.password);
    await loginPage.waitForDomContentLoaded();

    // Verify login failed - still on login page or error message shown
    logger.step('Verifying login failed');
    const currentUrl = page.url();
    logger.info(`Current URL after login attempt: ${currentUrl}`);

    const loginFailed = currentUrl.includes('/login');
    logger.verify('Login failed - still on login page', loginFailed);
    expect(loginFailed).toBeTruthy();

    logger.testEnd('AUTH-06 - Login with invalid username and password', 'PASSED');
  });
});
