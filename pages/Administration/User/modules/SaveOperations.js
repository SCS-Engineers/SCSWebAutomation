const BasePage = require('../../../basePage');
const LOCATORS = require('../../../constants/administrationUserPage.constants');

/**
 * SaveOperations module for Administration User Page
 * Handles save operations and success/error message verification
 */
class SaveOperations extends BasePage {
  /**
   * Click the Save button
   * @returns {Promise<void>}
   */
  async clickSaveButton() {
    this.logger.action('Clicking Save button');
    await this.page.locator(LOCATORS.saveButton).first().click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
    this.logger.info('✓ Save button clicked');
  }

  /**
   * Wait for success message to appear and disappear
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForSuccessMessage(timeout = 30000) {
    this.logger.info('Waiting for success message');
    await this.page.locator('text=Successfully saved').first().waitFor({ state: 'visible', timeout });
    await this.page.locator('text=Successfully saved').first().waitFor({ state: 'hidden', timeout });
    this.logger.info('✓ Success message appeared and disappeared');
  }

  /**
   * Verify success toast message appears after save
   * @returns {Promise<void>}
   */
  async verifySaveSuccessMessage() {
    this.logger.action('Verifying "Successfully saved." message');

    // Wait for toast message to appear
    const toast = this.page.locator('[role="alert"]').filter({ hasText: 'Successfully saved.' });
    await toast.waitFor({ state: 'visible', timeout: 10000 });

    const isVisible = await toast.isVisible();
    if (isVisible) {
      this.logger.info('✓ "Successfully saved." message is visible');
    } else {
      throw new Error('"Successfully saved." message is not visible');
    }
  }

  /**
   * Verify error dialog appears with expected message
   * @param {string} expectedMessage - Expected error message content
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async verifyErrorDialogWithMessage(expectedMessage, timeout = 30000) {
    this.logger.info(`Waiting for error dialog with message: "${expectedMessage}"`);

    let dialogAppeared = false;
    let dialogMessage = '';

    // Setup dialog listener
    this.page.once('dialog', async (dialog) => {
      dialogAppeared = true;
      dialogMessage = dialog.message();
      this.logger.info(`Dialog appeared with message: "${dialogMessage}"`);
      await dialog.accept();
    });

    // Wait for dialog to appear
    const startTime = Date.now();
    while (!dialogAppeared && (Date.now() - startTime) < timeout) {
      await this.page.waitForTimeout(100);
    }

    if (!dialogAppeared) {
      throw new Error(`Error dialog did not appear within ${timeout}ms`);
    }

    // Verify message content
    if (!dialogMessage.includes(expectedMessage)) {
      throw new Error(`Expected error message "${expectedMessage}" but got "${dialogMessage}"`);
    }

    this.logger.info(`✓ Error dialog displays expected message: "${expectedMessage}"`);
  }
}

module.exports = SaveOperations;
