const BasePage = require('../../../basePage');
const LOCATORS = require('../../../constants/administrationUserPage.constants');

/**
 * UserNavigationOperations module for Administration User Page
 * Handles navigation, section visibility, and basic page setup
 */
class UserNavigationOperations extends BasePage {
  /**
   * Navigate to Administration tab
   * @returns {Promise<void>}
   */
  async navigateToAdministrationTab() {
    this.logger.action('Navigating to ADMINISTRATION tab');
    await this.click(LOCATORS.administrationTab);
    await this.page.waitForLoadState('networkidle');
    this.logger.info('✓ Navigated to ADMINISTRATION tab');
  }

  /**
   * Verify SITE LIST is visible
   * @returns {Promise<void>}
   */
  async verifySiteListVisible() {
    this.logger.action('Verifying SITE LIST is visible');
    const siteList = this.page.locator(LOCATORS.siteListText).first();
    await siteList.waitFor({ state: 'visible', timeout: 30000 });
    this.logger.info('✓ SITE LIST is visible');
  }

  /**
   * Navigate to Users → List
   * @returns {Promise<void>}
   */
  async navigateToUsersList() {
    this.logger.action('Opening Users → List');
    await this.click(LOCATORS.usersMenu);
    // Removed redundant wait - click operations auto-wait
    await this.click(LOCATORS.listMenuItem);
    await this.page.waitForLoadState('networkidle');
    this.logger.info('✓ Navigated to Users List');
  }

  /**
   * Click Edit button for user
   * @returns {Promise<void>}
   */
  async clickEditButton() {
    this.logger.action('Clicking Edit button');
    await this.page.locator(LOCATORS.editButton).first().click();
    // Wait for edit mode indicators to appear
    await this.page.locator(LOCATORS.saveButton).first().waitFor({ state: 'visible', timeout: 30000 });
    this.logger.info('✓ Edit button clicked');
  }

  /**
   * Open SITE ACCESS AND PERMISSIONS section
   * @returns {Promise<void>}
   */
  async openSiteAccessPermissions() {
    this.logger.action('Opening SITE ACCESS AND PERMISSIONS section');
    const header = this.page.locator(LOCATORS.siteAccessPermissionsHeader).first();
    await header.waitFor({ state: 'visible', timeout: 30000 });

    // Check if section is already expanded by looking for collapse icon
    const isExpanded = await header.locator('..').locator('.e-icons.e-chev-up-icon').isVisible().catch(() => false);

    if (!isExpanded) {
      await header.click();
      await this.page.waitForTimeout(1000);
    }

    this.logger.info('✓ SITE ACCESS AND PERMISSIONS section opened');
  }

  /**
   * Open GROUP ACCESS AND PERMISSIONS section by clicking the collapsible header.
   * If the header is not found (e.g., section is always visible), the method
   * logs a warning and continues safely.
   * @returns {Promise<void>}
   */
  async openGroupAccessPermissions() {
    this.logger.action('Opening GROUP ACCESS AND PERMISSIONS section');

    try {
      const header = this.page.locator(LOCATORS.groupAccessPermissionsHeader).first();
      const isHeaderVisible = await header.isVisible({ timeout: 5000 }).catch(() => false);

      if (isHeaderVisible) {
        // Check if section is already expanded by looking for collapse icon
        const isExpanded = await header.locator('..').locator('.e-icons.e-chev-up-icon').isVisible().catch(() => false);

        if (!isExpanded) {
          await header.click();
          await this.page.waitForTimeout(1000);
          this.logger.info('✓ GROUP ACCESS AND PERMISSIONS section expanded by clicking header');
        } else {
          this.logger.info('✓ GROUP ACCESS AND PERMISSIONS section already expanded');
        }
      } else {
        this.logger.info('✓ GROUP ACCESS header not found - assuming section is already visible');
      }
    } catch (error) {
      this.logger.warn(`Could not open GROUP ACCESS section: ${error.message}`);
    }
  }

  /**
   * Expand user list section by dragging resize handler down
   * @param {number} pixels - Number of pixels to drag down (default: 200)
   * @returns {Promise<void>}
   */
  async expandUserListSection(pixels = 200) {
    this.logger.action(`Expanding user list section by dragging resize handler down ${pixels} pixels`);

    const resizeHandler = this.page.locator(LOCATORS.resizeHandler).first();
    const isResizeHandlerVisible = await resizeHandler.isVisible().catch(() => false);

    if (isResizeHandlerVisible) {
      const box = await resizeHandler.boundingBox();
      if (box) {
        // Drag down to expand the top section (user list)
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + box.width / 2, box.y + pixels);
        await this.page.mouse.up();
        await this.page.waitForTimeout(1000);
        this.logger.info('✓ Dragged resize handler down to expand user list section');
      }
    } else {
      this.logger.info('Resize handler not visible, skipping');
    }
  }
}

module.exports = UserNavigationOperations;
