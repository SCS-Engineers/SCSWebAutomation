const BasePage = require('./basePage');
const LOCATORS = require('./constants/landingPage.constants');

/**
 * Landing Page class extending BasePage
 */
class LandingPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Page locators for SCS Landing Page
    this.scsRmcLink = LOCATORS.scsRmcLink;
    this.forgotPasswordLink = LOCATORS.forgotPasswordLink;
    
    // SCSRMC page locators
    this.signInText = LOCATORS.signInText;
    this.needHelpText = LOCATORS.needHelpText;
    
    // Forgot Password popup locators
    this.supportTitle = LOCATORS.supportTitle;
    this.instructionText = LOCATORS.instructionText;
  }

  /**
   * Click on SCSRMC.COM link
   * @param {Object} context - Browser context for handling new tabs
   * @returns {Promise<Page>} New page/tab object
   */
  async clickScsRmcLink(context) {
    this.logger.info('Waiting for SCSRMC.COM link to be visible');
    await this.waitForElement(this.scsRmcLink, 10000);
    
    this.logger.info('Clicking on SCSRMC.COM link');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      this.click(this.scsRmcLink)
    ]);
    
    this.logger.info('New tab opened, waiting for page to load');
    await newPage.waitForLoadState('domcontentloaded');
    await newPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await newPage.waitForLoadState('networkidle');
    
    return newPage;
  }

  /**
   * Verify SCSRMC page URL
   * @param {Page} page - Page object to check
   * @returns {Promise<boolean>} True if URL contains scsrmc.com
   */
  async verifyScsRmcUrl(page) {
    const url = page.url();
    this.logger.info(`New page URL: ${url}`);
    return url.includes('scsrmc.com');
  }

  /**
   * Check if "Sign in to your account" text is visible on SCSRMC page
   * @param {Page} page - Page object to check
   * @returns {Promise<boolean>} Visibility status
   */
  async isSignInTextVisible(page) {
    return await page.locator(this.signInText).isVisible({ timeout: 10000 }).catch(() => false);
  }

  /**
   * Check if "Need Help?" text is visible on SCSRMC page
   * @param {Page} page - Page object to check
   * @returns {Promise<boolean>} Visibility status
   */
  async isNeedHelpTextVisible(page) {
    return await page.locator(this.needHelpText).isVisible({ timeout: 10000 }).catch(() => false);
  }

  /**
   * Click on Forgot Password link
   */
  async clickForgotPasswordLink() {
    this.logger.info('Waiting for Forgot username or password link to be visible');
    await this.waitForElement(this.forgotPasswordLink, 10000);
    await this.click(this.forgotPasswordLink);
    this.logger.info('Clicked on Forgot username or password link');
    
    // Wait for the support modal/section to appear instead of page navigation
    await this.page.locator(this.supportTitle).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  }

  /**
   * Check if support title is visible in popup
   * @returns {Promise<boolean>} Visibility status
   */
  async isSupportTitleVisible() {
    await this.page.locator(this.supportTitle).first().waitFor({ state: 'visible', timeout: 10000 });
    return await this.page.locator(this.supportTitle).first().isVisible();
  }

  /**
   * Check if instruction text is visible in popup
   * @returns {Promise<boolean>} Visibility status
   */
  async isInstructionTextVisible() {
    // Check for either the email link or phone link
    const emailLink = await this.page.locator('a[href*="support@scsetools.com"], a:has-text("support@scsetools.com")').isVisible({ timeout: 5000 }).catch(() => false);
    const phoneLink = await this.page.locator('a[href*="866-612-6820"], a:has-text("866-612-6820"), a:has-text("1-866-612-6820")').isVisible({ timeout: 5000 }).catch(() => false);
    const supportTextVisible = await this.page.locator('text=SCSeTools Customer Support').isVisible({ timeout: 5000 }).catch(() => false);
    
    return emailLink || phoneLink || supportTextVisible;
  }
}

module.exports = LandingPage;
