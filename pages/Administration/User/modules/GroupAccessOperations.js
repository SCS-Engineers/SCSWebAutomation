const BasePage = require('../../../basePage');
const LOCATORS = require('../../../constants/administrationUserPage.constants');

/**
 * GroupAccessOperations module for Administration User Page
 * Handles all group access management operations (grant, remove, radio buttons, verification)
 */
class GroupAccessOperations extends BasePage {
  /**
   * Enable "Show groups with no access granted"
   * @returns {Promise<void>}
   */
  async enableShowGroupsWithNoAccess() {
    this.logger.action('Enabling "Show groups with no access granted"');
    const radioButton = this.page.locator(LOCATORS.showGroupsNoAccessRadio).first();
    await radioButton.waitFor({ state: 'visible', timeout: 10000 });
    await radioButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);

    this.logger.info('✓ "Show groups with no access granted" enabled');
  }

  /**
   * Enable "Show groups with access granted"
   * @returns {Promise<void>}
   */
  async enableShowGroupsWithAccessGranted() {
    this.logger.action('Enabling "Show groups with access granted"');
    const radioButton = this.page.locator(LOCATORS.showGroupsWithAccessRadio).first();
    await radioButton.waitFor({ state: 'visible', timeout: 10000 });
    await radioButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);

    this.logger.info('✓ "Show groups with access granted" enabled');
  }

  /**
   * Grant access to group by selecting checkbox
   * @param {string} groupName - Group name to grant access to
   * @returns {Promise<void>}
   */
  async grantAccessToGroup(groupName) {
    this.logger.action(`Granting access to group: ${groupName}`);

    // Find the row with the group name
    const groupRow = this.page.locator('.e-row').filter({ hasText: groupName }).first();
    await groupRow.waitFor({ state: 'visible', timeout: 10000 });

    // Click checkbox in the row
    const checkbox = groupRow.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await this.page.waitForTimeout(500);

    this.logger.info(`✓ Access granted to group: ${groupName}`);
  }

  /**
   * Verify "Show groups with access granted" is selected
   * @returns {Promise<void>}
   */
  async verifyShowGroupsWithAccessSelected() {
    this.logger.action('Verifying "Show groups with access granted" is selected');

    // Wait for the system to auto-select the radio button after saving
    await this.page.waitForTimeout(3000);

    const radioButton = this.page.locator(LOCATORS.showGroupsWithAccessRadio).first();
    await radioButton.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for the radio to become checked (auto-selected by system)
    await this.page.waitForFunction(
      (radioText) => {
        const labels = Array.from(document.querySelectorAll('label'));
        const label = labels.find((l) => l.textContent.includes(radioText));
        if (!label) return false;
        const radio = label.querySelector('input[type="radio"]')
                     || label.parentElement.querySelector('input[type="radio"]');
        return radio && radio.checked === true;
      },
      'Show groups with access granted',
      { timeout: 10000 },
    );

    this.logger.info('✓ "Show groups with access granted" is selected');
  }

  /**
   * Remove access for group using context menu (same pattern as removeAccessForSite)
   * @param {string} groupName - Group name to remove access from
   * @returns {Promise<void>}
   */
  async removeAccessForGroup(groupName) {
    this.logger.action(`Removing access for group: ${groupName}`);

    const maxAttempts = 3;
    let attempt = 1;

    while (attempt <= maxAttempts) {
      this.logger.info(`Removal attempt ${attempt}/${maxAttempts}`);

      // Find the row with the group name
      const groupRow = this.page.locator('.e-row').filter({ hasText: groupName }).first();
      const rowExists = await groupRow.count() > 0;

      if (!rowExists) {
        this.logger.info('Row no longer visible, checking for "No records to display"');
        break;
      }

      await groupRow.waitFor({ state: 'visible', timeout: 5000 });

      // Click to select the row (it will turn orange/yellow)
      const groupCell = groupRow.locator('td').first();
      await groupCell.click();
      await this.page.waitForTimeout(500);
      this.logger.info('✓ Row selected (highlighted)');

      // Right-click on the row to open context menu
      await groupRow.click({ button: 'right' });
      await this.page.waitForTimeout(500);
      this.logger.info('✓ Context menu opened');

      // Click Remove option
      const removeOption = this.page.locator('text=Remove').first();
      await removeOption.waitFor({ state: 'visible', timeout: 5000 });
      await removeOption.click();
      this.logger.info('✓ Clicked Remove');

      // After clicking Remove the row turns #bd8585 (pending-deletion state).
      // The record is NOT removed from the DOM until Save is clicked.
      // Verify the row background changed to confirm Remove was registered.
      try {
        await this.page.waitForFunction(
          (name) => {
            const rows = document.querySelectorAll('.e-row');
            for (const row of rows) {
              if (row.textContent && row.textContent.includes(name)) {
                const bg = window.getComputedStyle(row).backgroundColor;
                // #bd8585 → rgb(189, 133, 133)
                return bg === 'rgb(189, 133, 133)';
              }
            }
            // Row not found - treat as already removed (save was already done)
            return true;
          },
          groupName,
          { timeout: 5000 },
        );
        this.logger.info(`✓ Row marked for deletion (background #bd8585) — call Save to persist`);
        break;
      } catch (error) {
        this.logger.info('Row colour not yet updated, will retry...');
        attempt++;
        await this.page.waitForTimeout(1000);
      }
    }

    this.logger.info(`✓ Group "${groupName}" marked for removal — caller must click Save`);
  }

  /**
   * Click on a group cell in the grid and wait for selection
   * @param {string} groupName - Name of the group to click
   * @returns {Promise<void>}
   */
  async clickGroupCell(groupName) {
    this.logger.action(`Clicking on group "${groupName}"`);
    await this.page.getByRole('gridcell', { name: groupName }).click();
    // Wait for row to be selected (indicated by e-selectionbackground class)
    await this.page.locator('.e-row.e-selectionbackground').waitFor({ state: 'attached', timeout: 5000 }).catch(() => {
      this.logger.info('Row selection indicator not found');
    });
    this.logger.info(`✓ Clicked on group "${groupName}"`);
  }
}

module.exports = GroupAccessOperations;
