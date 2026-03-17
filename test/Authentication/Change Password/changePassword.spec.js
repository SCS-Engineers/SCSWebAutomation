const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const logger = require('../../../utils/logger');
const credentials = require('../../../utils/credentials');
const testData = require('../../../data/testData.json');

// Wait time constants for explicit timing requirements
const WAIT_TIMES = {
  MODAL_DISMISS: 2000,
};

test.describe('SCS Change Password Tests', () => {
  let testSetup;
  let loginPage;
  let changePasswordPage;

  test.beforeEach(async ({ page }) => {
    testSetup = new TestSetup();
    await testSetup.initialize(page);
    loginPage = testSetup.getLoginPage();
    changePasswordPage = testSetup.getChangePasswordPage();
  });

  test('FGT-PW-01 - Verify user can change password after logging in', async ({ page }) => {
    logger.testStart('FGT-PW-01 - Verify user can change password after logging in');

    const user = credentials.getUserCredentials('nonApplicableUser');
    const { newPassword } = credentials.testData.changePassword;

    logger.step(`Step 1: Login with credentials ${user.username}/${user.password}`);
    await loginPage.loginAndWaitForRedirect(user.username, user.password);

    logger.step('Step 2: Verifying successful login to dashboard');
    expect(!page.url().includes('/login')).toBeTruthy();

    // Check and handle Health & Safety modal if present
    logger.step('Step 2.1: Check for Health & Safety modal');
    const healthSafetyVisible = await loginPage.isHealthSafetyMessageVisible(5000);
    if (healthSafetyVisible) {
      logger.info('Health & Safety modal detected - acknowledging');
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForTimeout(WAIT_TIMES.MODAL_DISMISS);
    } else {
      logger.info('No Health & Safety modal found');
    }

    logger.step('Step 3: Navigate to Change Password');
    await changePasswordPage.navigateToChangePassword();

    logger.step('Step 4: Enter passwords and submit');
    await changePasswordPage.waitForDialog();
    await changePasswordPage.changePassword(user.password, newPassword);

    logger.step('Step 5: Confirm password change');
    await changePasswordPage.waitForConfirmationDialog();
    expect(await changePasswordPage.getConfirmationDialogText()).toContain('Are you sure you want to change your password?');
    await changePasswordPage.clickYesOnConfirmation();

    logger.step('Step 6: Verify password change success message');
    await changePasswordPage.waitForToastMessage(12000);

    expect(await changePasswordPage.isToastMessageVisible(10000)).toBeTruthy();
    const toastText = await changePasswordPage.getToastMessageText();
    expect(toastText).toContain('You will be redirected to login page');
    expect(toastText).toContain('Please sign in with your new credentials');

    await loginPage.waitForRedirectToLogin();

    logger.step(`Step 7: Login with new password (${newPassword})`);
    await loginPage.loginAndWaitForRedirect(user.username, newPassword);
    expect(!page.url().includes('/login')).toBeTruthy();

    // CLEANUP: Revert password back to initial
    logger.step(`CLEANUP: Reverting password back to ${user.password}`);
    await changePasswordPage.navigateToChangePassword();
    await changePasswordPage.waitForDialog();
    await changePasswordPage.changePassword(newPassword, user.password);
    await changePasswordPage.waitForConfirmationDialog();

    if (await changePasswordPage.isConfirmationDialogVisible(3000)) {
      await changePasswordPage.clickYesOnConfirmation();
      logger.info('✓ Password reverted successfully');
      // Intentionally suppress timeout - redirect may happen immediately
      await loginPage.waitForRedirectToLogin().catch(() => {});
    }

    logger.testEnd('FGT-PW-01 - Verify user can change password after logging in', 'PASSED');
  });

  test('FGT-PW-02 - Verify user cant change password if the new password does not meet the required conditions', async ({ page }) => {
    logger.testStart('FGT-PW-02 - Verify user cant change password if the new password does not meet the required conditions');

    const user = credentials.getUserCredentials('nonApplicableUser');
    const { invalidPassword } = credentials.testData.changePassword;

    logger.step(`Step 1: Login with credentials ${user.username}/${user.password}`);
    await loginPage.loginAndWaitForRedirect(user.username, user.password);

    logger.step('Step 2: Verifying successful login to dashboard');
    expect(!page.url().includes('/login')).toBeTruthy();

    // Check and handle Health & Safety modal if present
    logger.step('Step 2.1: Check for Health & Safety modal');
    const healthSafetyVisible = await loginPage.isHealthSafetyMessageVisible(5000);
    if (healthSafetyVisible) {
      logger.info('Health & Safety modal detected - acknowledging');
      await page.getByRole('button', { name: 'OK' }).click();
      await page.waitForTimeout(WAIT_TIMES.MODAL_DISMISS);
    } else {
      logger.info('No Health & Safety modal found');
    }

    logger.step('Step 3: Navigate to Change Password');
    await changePasswordPage.navigateToChangePassword();

    logger.step(`Step 4: Enter current password and invalid new password (${invalidPassword})`);
    await changePasswordPage.waitForDialog();
    await changePasswordPage.changePassword(user.password, invalidPassword);

    logger.step('Step 5: Click Yes on confirmation dialog');
    await changePasswordPage.waitForConfirmationDialog();
    expect(await changePasswordPage.getConfirmationDialogText()).toContain('Are you sure you want to change your password?');
    await changePasswordPage.clickYesOnConfirmation();

    logger.step('Step 6: Verify password validation error message appears');
    await changePasswordPage.waitForToastMessage(12000);

    expect(await changePasswordPage.isToastMessageVisible(10000)).toBeTruthy();
    const toastText = await changePasswordPage.getToastMessageText();
    expect(toastText).toContain('Password does not satisfy the conditions');
    logger.info('✓ Password validation error message verified successfully');

    logger.testEnd('FGT-PW-02 - Verify user cant change password if the new password does not meet the required conditions', 'PASSED');
  });
});
