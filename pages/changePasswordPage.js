const BasePage = require('./basePage');
const LOCATORS = require('./constants/changePasswordPage.constants');

/**
 * Change Password Page class extending BasePage
 */
class ChangePasswordPage extends BasePage {
  constructor(page) {
    super(page);

    // Page locators for Change Password functionality
    this.usernameButton = LOCATORS.usernameButton;
    this.changePasswordMenuOption = LOCATORS.changePasswordMenuOption;
    this.changePasswordPopup = LOCATORS.changePasswordPopup;
    this.currentPasswordField = LOCATORS.currentPasswordField;
    this.dialogTitle = LOCATORS.dialogTitle;
    this.dialogContent = LOCATORS.dialogContent;
    this.closeButton = LOCATORS.closeButton;
    this.confirmationText = LOCATORS.confirmationText;
    this.yesButton = LOCATORS.yesButton;
    this.noButton = LOCATORS.noButton;
    this.toastMessage = LOCATORS.toastMessage;
    this.dashboardText = LOCATORS.dashboardText;
  }

  /**
   * Click on username button
   */
  async clickUsernameButton() {
    this.logger.info('Clicking on username button');
    await this.page.getByRole('button', { name: 'Automation User' }).click();
  }

  /**
   * Click on Change Password option from menu
   */
  async clickChangePasswordOption() {
    this.logger.info('Clicking on Change Password option');
    await this.page.locator(this.changePasswordMenuOption).click();
  }

  /**
   * Click Close button if popup appears
   */
  async clickCloseButton() {
    this.logger.info('Clicking Close button');
    const closeBtn = this.page.getByRole('button', { name: 'Close' });
    if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.click();
    }
  }

  /**
   * Check if Change Password popup is visible
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Change Password popup visibility status
   */
  async isChangePasswordPopupVisible(timeout = 10000) {
    this.logger.info('Checking if Change Password popup is visible');
    return this.page.locator(this.changePasswordPopup).isVisible({ timeout }).catch(() => false);
  }

  /**
   * Enter current password
   * @param {string} password - Current password
   */
  async enterCurrentPassword(password) {
    this.logger.info('Entering current password: ********');
    await this.page.getByRole('textbox', { name: 'Current Password' }).fill(password);
  }

  /**
   * Enter new password
   * @param {string} password - New password
   */
  async enterNewPassword(password) {
    this.logger.info('Entering new password: ********');
    await this.page.getByRole('textbox', { name: 'New Password' }).fill(password);
  }

  /**
   * Enter confirm password
   * @param {string} password - Confirm password
   */
  async enterConfirmPassword(password) {
    this.logger.info('Entering confirm password: ********');
    await this.page.getByRole('textbox', { name: 'Confirm Password' }).fill(password);
  }

  /**
   * Click Change Password button
   */
  async clickChangePasswordButton() {
    this.logger.info('Clicking Change Password button');
    await this.page.getByRole('button', { name: 'Change Password' }).click();
  }

  /**
   * Check if confirmation dialog is visible
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Confirmation dialog visibility status
   */
  async isConfirmationDialogVisible(timeout = 5000) {
    this.logger.info('Checking if confirmation dialog is visible');
    return this.page.locator(this.confirmationText).isVisible({ timeout }).catch(() => false);
  }

  /**
   * Get confirmation dialog text
   * @returns {Promise<string>} Confirmation dialog text
   */
  async getConfirmationDialogText() {
    this.logger.info('Getting confirmation dialog text');
    return this.page.locator(this.confirmationText).textContent();
  }

  /**
   * Check if toast message is visible
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Toast message visibility status
   */
  async isToastMessageVisible(timeout = 10000) {
    this.logger.info('Checking if toast message is visible');
    return this.page.locator(this.toastMessage).isVisible({ timeout }).catch(() => false);
  }

  /**
   * Get toast message text
   * @returns {Promise<string>} Toast message text
   */
  async getToastMessageText() {
    this.logger.info('Getting toast message text');
    return this.page.locator(this.toastMessage).textContent();
  }

  /**
   * Click Yes on confirmation dialog
   */
  async clickYesOnConfirmation() {
    this.logger.info('Clicking Yes on confirmation dialog');
    await this.page.getByRole('button', { name: 'Yes' }).click();
  }

  /**
   * Click No on confirmation dialog
   */
  async clickNoOnConfirmation() {
    this.logger.info('Clicking No on confirmation dialog');
    await this.page.locator(this.noButton).click();
  }

  /**
   * Verify dashboard is visible
   * @returns {Promise<boolean>} Dashboard visibility status
   */
  async isDashboardVisible() {
    this.logger.info('Checking if dashboard is visible');
    return this.page.locator(this.dashboardText).isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Complete password change flow
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   */
  async changePassword(currentPassword, newPassword) {
    this.logger.step('Starting password change flow');
    await this.enterCurrentPassword(currentPassword);
    await this.enterNewPassword(newPassword);
    await this.enterConfirmPassword(newPassword);
    await this.clickChangePasswordButton();
    this.logger.info('Password change form submitted');
  }

  /**
   * Navigate to change password from dashboard
   */
  async navigateToChangePassword() {
    this.logger.step('Navigating to Change Password from dashboard');
    await this.clickUsernameButton();
    await this.clickChangePasswordOption();
    this.logger.info('Navigation to Change Password completed');
  }

  /**
   * Wait for change password dialog to be visible
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForDialog(timeout = 10000) {
    await this.page.getByRole('textbox', { name: 'Current Password' }).waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for confirmation dialog to appear
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForConfirmationDialog(timeout = 10000) {
    this.logger.info('Waiting for confirmation dialog');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.locator(this.confirmationText).waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for toast message to appear
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForToastMessage(timeout = 12000) {
    this.logger.info('Waiting for toast message');
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the actual toast element to appear
    await this.page.waitForSelector(this.toastMessage, { state: 'visible', timeout });
    // Give a bit of time for toast to appear after action
    await this.page.waitForLoadState('networkidle').catch(() => {
      this.logger.info('Network did not go idle, but toast is visible');
    });
  }
}

module.exports = ChangePasswordPage;
