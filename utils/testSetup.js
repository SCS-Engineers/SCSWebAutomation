const LoginPage = require('../pages/loginPage');
const SiteStatusDashboardPage = require('../pages/siteStatusDashboardPage');
const ChangePasswordPage = require('../pages/changePasswordPage');
const LandingPage = require('../pages/landingPage');
const credentials = require('./credentials');
const logger = require('./logger');

/**
 * Test Setup Utility
 * Provides common setup and helper methods for test files
 */
class TestSetup {
  constructor() {
    this.loginPage = null;
    this.siteStatusDashboardPage = null;
    this.changePasswordPage = null;
    this.landingPage = null;
  }

  /**
   * Initialize page objects and navigate to login page
   * @param {Page} page - Playwright page object
   */
  async initialize(page) {
    logger.divider();
    logger.info('Setting up test - Initializing page objects');
    
    this.loginPage = new LoginPage(page);
    this.siteStatusDashboardPage = new SiteStatusDashboardPage(page);
    this.changePasswordPage = new ChangePasswordPage(page);
    this.landingPage = new LandingPage(page);
    
    // Navigate to login page
    const loginUrl = credentials.getUrl('loginPage');
    logger.info(`Navigating to login page: ${loginUrl}`);
    await this.loginPage.navigate(loginUrl);
    await this.loginPage.waitForDomContentLoaded();
    
    logger.info('Test setup completed');
    logger.divider();
  }

  /**
   * Login as valid user
   * @returns {Object} User credentials object
   */
  async loginAsValidUser() {
    const { username, password, ...userDetails } = credentials.getUserCredentials('validUser');
    logger.step(`Login as ${username}`);
    await this.loginPage.loginAndWaitForRedirect(username, password);
    return { username, password, ...userDetails };
  }

  /**
   * Acknowledge Health and Safety modal
   */
  async acknowledgeHealthAndSafety() {
    logger.step('Acknowledge Health & Safety modal');
    await this.siteStatusDashboardPage.clickOkOnHealthSafetyModal();
  }

  /**
   * Get login page instance
   */
  getLoginPage() {
    return this.loginPage;
  }

  /**
   * Get site status dashboard page instance
   */
  getSiteStatusDashboardPage() {
    return this.siteStatusDashboardPage;
  }

  /**
   * Get change password page instance
   */
  getChangePasswordPage() {
    return this.changePasswordPage;
  }

  /**
   * Get landing page instance
   */
  getLandingPage() {
    return this.landingPage;
  }
}

module.exports = TestSetup;
