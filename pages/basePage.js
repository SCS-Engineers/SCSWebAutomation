const logger = require('../utils/logger');

/**
 * Base Page class with common methods for all pages
 */
class BasePage {
  constructor(page) {
    this.page = page;
    this.logger = logger;
  }

  /**
   * Navigate to a URL with retry logic
   * @param {string} url - URL to navigate to
   */
  async navigateTo(url) {
    this.logger.action(`Navigating to URL: ${url}`);
    
    // Retry logic for navigation
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 120000 // Increased to 120 seconds (2 minutes)
        });
        
        // Wait for network to be idle after navigation
        await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
          this.logger.info('Network did not go idle within timeout after navigation');
        });
        
        this.logger.info(`Successfully navigated to: ${url}`);
        return; // Success, exit the function
      } catch (error) {
        lastError = error;
        this.logger.warn(`Navigation attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          this.logger.info(`Retrying navigation...`);
          // Wait for page to be in a stable state before retrying
          await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch((err) => {
            this.logger.debug(`DOM state wait failed: ${err.message}`);
          });
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Click on an element
   * @param {string} selector - Element selector
   * @returns {Promise<void>}
   */
  async click(selector) {
    this.logger.action(`Clicking on element`, selector);
    await this.page.click(selector);
    this.logger.info(`Successfully clicked: ${selector}`);
  }

  /**
   * Fill input field
   * @param {string} selector - Element selector
   * @param {string} text - Text to fill
   * @returns {Promise<void>}
   */
  async fill(selector, text) {
    this.logger.action(`Filling text in element`, selector);
    await this.page.fill(selector, text);
    this.logger.info(`Successfully filled text in: ${selector}`);
  }

  /**
   * Get text from an element
   * @param {string} selector - Element selector
   * @returns {Promise<string>} Element text
   */
  async getText(selector) {
    this.logger.action(`Getting text from element`, selector);
    const text = await this.page.textContent(selector);
    this.logger.info(`Retrieved text: "${text}" from ${selector}`);
    return text;
  }

  /**
   * Check if element is visible
   * @param {string} selector - Element selector
   * @returns {Promise<boolean>} Visibility status
   */
  async isVisible(selector) {
    this.logger.action(`Checking visibility of element`, selector);
    const visible = await this.page.isVisible(selector);
    this.logger.info(`Element ${selector} visibility: ${visible}`);
    return visible;
  }

  /**
   * Wait for element to be visible
   * @param {string} selector - Element selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForElement(selector, timeout = 30000) {
    this.logger.action(`Waiting for element to be visible`, selector);
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    this.logger.info(`Element is now visible: ${selector}`);
  }

  /**
   * Wait for navigation
   * @param {string} state - Load state to wait for: 'load', 'domcontentloaded', or 'networkidle' (default: 'networkidle')
   * @param {number} timeout - Optional timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForNavigation(state = 'networkidle', timeout = 60000) {
    this.logger.action(`Waiting for page load state: ${state}`);
    await this.page.waitForLoadState(state, { timeout });
    this.logger.info(`Page reached load state: ${state}`);
  }

  /**
   * Take screenshot
   * @param {string} name - Screenshot name
   * @returns {Promise<void>}
   */
  async takeScreenshot(name) {
    this.logger.action(`Taking screenshot: ${name}`);
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
    this.logger.info(`Screenshot saved: screenshots/${name}.png`);
  }

  /**
   * Get page title
   * @returns {Promise<string>} Page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Get current URL
   * @returns {string} Current URL
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Press keyboard key
   * @param {string} key - Key to press
   */
  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  /**
   * Select option from dropdown
   * @param {string} selector - Element selector
   * @param {string} value - Option value
   * @returns {Promise<void>}
   */
  async selectOption(selector, value) {
    await this.page.selectOption(selector, value);
  }

  /**
   * Check checkbox
   * @param {string} selector - Element selector
   * @returns {Promise<void>}
   */
  async check(selector) {
    await this.page.check(selector);
  }

  /**
   * Uncheck checkbox
   * @param {string} selector - Element selector
   * @returns {Promise<void>}
   */
  async uncheck(selector) {
    await this.page.uncheck(selector);
  }

  /**
   * Hover over element
   * @param {string} selector - Element selector
   * @returns {Promise<void>}
   */
  async hover(selector) {
    await this.page.hover(selector);
  }

  /**
   * Double click on element
   * @param {string} selector - Element selector
   * @returns {Promise<void>}
   */
  async doubleClick(selector) {
    await this.page.dblclick(selector);
  }

  /**
   * Right click on element
   * @param {string} selector - Element selector
   * @returns {Promise<void>}
   */
  async rightClick(selector) {
    await this.page.click(selector, { button: 'right' });
  }

  /**
   * Wait for specified time
   * @param {number} timeout - Time in milliseconds
   * @returns {Promise<void>}
   */
  async wait(timeout) {
    this.logger.info(`Waiting for ${timeout}ms`);
    await this.page.waitForTimeout(timeout);
  }

  /**
   * Reload page
   * @returns {Promise<void>}
   */
  async reload() {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   * @returns {Promise<void>}
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Go forward in browser history
   */
  async goForward() {
    await this.page.goForward();
  }

  /**
   * Get element attribute value
   * @param {string} selector - Element selector
   * @param {string} attribute - Attribute name
   * @returns {Promise<string>} Attribute value
   */
  async getAttribute(selector, attribute) {
    this.logger.action(`Getting attribute "${attribute}" from element`, selector);
    const value = await this.page.getAttribute(selector, attribute);
    this.logger.info(`Retrieved attribute "${attribute}": "${value}" from ${selector}`);
    return value;
  }

  /**
   * Get all text contents from multiple elements
   * @param {string} selector - Element selector
   * @returns {Promise<string[]>} Array of text contents
   */
  async getAllTexts(selector) {
    this.logger.action(`Getting all text contents from elements`, selector);
    const texts = await this.page.$$eval(selector, elements => elements.map(el => el.textContent.trim()));
    this.logger.info(`Retrieved ${texts.length} text contents from ${selector}`);
    return texts;
  }

  /**
   * Wait for URL to match a pattern
   * @param {string|RegExp|Function} urlPattern - URL pattern to match
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForURL(urlPattern, timeout = 30000) {
    this.logger.action(`Waiting for URL to match pattern`, urlPattern);
    await this.page.waitForURL(urlPattern, { timeout });
    this.logger.info(`URL matched pattern: ${urlPattern}`);
  }

  /**
   * Get element inner text
   * @param {string} selector - Element selector
   * @returns {Promise<string>} Inner text
   */
  async getInnerText(selector) {
    this.logger.action(`Getting inner text from element`, selector);
    const text = await this.page.innerText(selector);
    this.logger.info(`Retrieved inner text: "${text}" from ${selector}`);
    return text;
  }

  /**
   * Get element count
   * @param {string} selector - Element selector
   * @returns {Promise<number>} Number of elements found
   */
  async getElementCount(selector) {
    this.logger.action(`Counting elements`, selector);
    const count = await this.page.locator(selector).count();
    this.logger.info(`Found ${count} elements matching ${selector}`);
    return count;
  }

  /**
   * Click element by text
   * @param {string} text - Text to search for
   */
  async clickByText(text) {
    this.logger.action(`Clicking element with text: "${text}"`);
    await this.page.click(`text=${text}`);
    this.logger.info(`Successfully clicked element with text: "${text}"`);
  }
}

module.exports = BasePage;
