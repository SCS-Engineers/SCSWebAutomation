const BasePage = require('./basePage');
const LOCATORS = require('./constants/loginPage.constants');

/**
 * Login Page class extending BasePage
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    // Page locators for SCS Login Page
    this.usernameInput = LOCATORS.usernameInput;
    this.passwordInput = LOCATORS.passwordInput;
    this.loginButton = LOCATORS.loginButton;
    this.errorMessage = LOCATORS.errorMessage;
    this.rememberMeCheckbox = LOCATORS.rememberMeCheckbox;
    this.forgotPasswordLink = LOCATORS.forgotPasswordLink;
    this.logoutButton = LOCATORS.logoutButton;
    this.healthSafetyMessage = LOCATORS.healthSafetyMessage;
    this.loginPageTitle = LOCATORS.loginPageTitle;
    this.usernameLabel = LOCATORS.usernameLabel;
    this.passwordLabel = LOCATORS.passwordLabel;
    this.validationMessage = LOCATORS.validationMessage;
  }

  /**
   * Navigate to login page
   * @param {string} url - Login page URL
   */
  async navigate(url) {
    await this.navigateTo(url);
    // Wait for network idle after navigation
    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      this.logger.info('Network did not go idle after navigation');
    });
  }

  /**
   * Enter username
   * @param {string} username - Username to enter
   * @returns {Promise<void>}
   */
  async enterUsername(username) {
    this.logger.info(`Entering username: ${username}`);
    await this.fill(this.usernameInput, username);
  }

  /**
   * Enter password
   * @param {string} password - Password to enter
   * @returns {Promise<void>}
   */
  async enterPassword(password) {
    this.logger.info('Entering password: ********');
    await this.fill(this.passwordInput, password);
  }

  /**
   * Click login button
   * @returns {Promise<void>}
   */
  async clickLoginButton() {
    this.logger.info('Clicking login button');
    await this.click(this.loginButton);
  }

  /**
   * Perform complete login
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<void>}
   */
  async login(username, password) {
    this.logger.step(`Performing login with username: ${username}`);
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
    this.logger.info(`Login attempt completed for user: ${username}`);
  }

  /**
   * Get error message
   * @returns {Promise<string>} Error message text
   */
  async getErrorMessage() {
    await this.waitForElement(this.errorMessage);
    return this.getText(this.errorMessage);
  }

  /**
   * Check if error message is displayed
   * @returns {Promise<boolean>} Error visibility status
   */
  async isErrorDisplayed() {
    return this.isVisible(this.errorMessage);
  }

  /**
   * Click remember me checkbox
   * @returns {Promise<void>}
   */
  async clickRememberMe() {
    await this.check(this.rememberMeCheckbox);
  }

  /**
   * Click forgot password link
   * @returns {Promise<void>}
   */
  async clickForgotPassword() {
    await this.click(this.forgotPasswordLink);
  }

  /**
   * Check if logout button is visible
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Logout button visibility status
   */
  async isLogoutButtonVisible(timeout = 5000) {
    return this.page.locator(this.logoutButton).isVisible({ timeout }).catch(() => false);
  }

  /**
   * Check if Health & Safety Message is visible
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Health & Safety Message visibility status
   */
  async isHealthSafetyMessageVisible(timeout = 10000) {
    return this.page.locator(this.healthSafetyMessage).isVisible({ timeout }).catch(() => false);
  }

  // ========== COMMON WAIT AND NAVIGATION METHODS ==========

  /**
   * Wait for page to be in networkidle state
   * @returns {Promise<void>}
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      this.logger.info('Network did not go idle within timeout');
    });
  }

  /**
   * Wait for DOM content to be loaded
   * @returns {Promise<void>}
   */
  async waitForDomContentLoaded() {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60000 });
  }

  /**
   * Login and wait for redirect away from login page
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<void>}
   */
  async loginAndWaitForRedirect(username, password) {
    await this.enterUsername(username);
    await this.enterPassword(password);

    // Click login and wait for navigation with extended timeout
    await Promise.all([
      this.page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 60000 }),
      this.clickLoginButton(),
    ]);

    // Wait for page to stabilize
    await this.waitForDomContentLoaded();

    // Wait for network to be idle with extended timeout
    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      this.logger.warn('Network idle timeout - continuing anyway');
    });

    this.logger.info('✓ Login successful and redirected');
  }

  /**
   * Listen for dialog, get message and accept
   * @returns {Promise<string>} Dialog message
   */
  async getDialogMessageAndAccept() {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });
  }

  /**
   * Wait for redirect to login page
   * @returns {Promise<void>}
   */
  async waitForRedirectToLogin() {
    await this.page.waitForURL((url) => url.toString().includes('/login'), { timeout: 15000 });
    this.logger.info('✓ Redirected to login page');
  }
}

module.exports = LoginPage;
