const BasePage = require('../../../basePage');
const LOCATORS = require('../../../constants/administrationUserPage.constants');

/**
 * UserFilterOperations module for Administration User Page
 * Handles all filtering operations on grids (users, sites, groups, columns)
 */
class UserFilterOperations extends BasePage {
  /**
   * Filter user list by first name
   * @param {string} firstName - First name to filter by
   * @returns {Promise<void>}
   */
  async filterByFirstName(firstName) {
    this.logger.action(`Filtering by First name: ${firstName}`);

    // Wait for grid to be visible
    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 10000 });

    // Find the "First name" column header container
    const headerCell = this.page.locator('.e-headercelldiv:has-text("First name")').first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Click the filter icon within the same parent container
    const filterIcon = headerCell.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    await filterIcon.click();
    // Removed redundant wait - explicit waitFor below handles timing

    // Wait for Excel filter dialog
    const excelFilter = this.page.getByLabel('Excel filter');
    await excelFilter.waitFor({ state: 'visible', timeout: 10000 });
    // Removed redundant wait - element operations below have built-in waits

    // Search for the specific user
    const searchInput = excelFilter.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.clear();
    await searchInput.fill(firstName);
    await this.page.waitForTimeout(1500);

    // Try to click "Select All" to deselect, but continue if it's not found
    try {
      await excelFilter.getByText('Select All', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
      await excelFilter.getByText('Select All', { exact: true }).click();
      await this.page.waitForTimeout(500);
    } catch (error) {
      this.logger.info('"Select All" not found - continuing with filtered results');
    }

    // Now click only the specific user name
    await excelFilter.getByText(firstName, { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
    await excelFilter.getByText(firstName, { exact: true }).click();
    // Removed redundant wait - button state check below handles timing

    // Wait for OK button to become enabled (critical - button starts disabled)
    await this.page.waitForFunction(
      () => {
        const filterDialog = document.querySelector('[aria-label="Excel filter"]');
        if (!filterDialog) return false;
        const btn = filterDialog.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      { timeout: 15000 },
    );

    // Click OK button within the Excel filter dialog
    const okButton = excelFilter.getByRole('button', { name: 'OK', exact: true });
    await okButton.click();
    // Removed redundant wait - waitForLoadState below ensures page stability
    await this.page.waitForLoadState('networkidle');

    this.logger.info(`✓ Filtered by First name: ${firstName}`);
  }

  /**
   * Filter by first name with retry logic
   * @param {string} userName - User first name to filter
   * @param {number} maxAttempts - Maximum retry attempts (default: 3)
   * @returns {Promise<void>}
   */
  async filterByFirstNameWithRetry(userName, maxAttempts = 3) {
    this.logger.info(`Filtering by First name with retry (max ${maxAttempts} attempts)`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.info(`Filter attempt ${attempt}/${maxAttempts}`);
        await this.filterByFirstName(userName);
        this.logger.info('✓ Filter applied successfully');
        return;
      } catch (error) {
        if (attempt < maxAttempts) {
          this.logger.warn(`Filter attempt ${attempt} failed, retrying...`);
          await this.page.waitForTimeout(5000);
        } else {
          this.logger.error(`All ${maxAttempts} filter attempts failed`);
          throw error;
        }
      }
    }
  }

  /**
   * Filter site list by site name
   * @param {string} siteName - Site name to filter by
   * @returns {Promise<void>}
   */
  async filterBySiteName(siteName) {
    this.logger.action(`Filtering by Site List: ${siteName}`);

    // Wait for grid to be visible
    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Find the "Site List" column header (not "Site Name")
    const headerCell = this.page.locator('.e-headercelldiv:has-text("Site List")').first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Click the filter icon within the same parent container
    const filterIcon = headerCell.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    await filterIcon.click();
    await this.page.waitForTimeout(500);

    // Wait for Excel filter dialog
    const excelFilter = this.page.getByLabel('Excel filter');
    await excelFilter.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for filter checkboxes to be loaded
    await excelFilter.locator('.e-checkboxlist').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      this.logger.debug('Checkbox list may still be loading');
    });

    // Search for the specific site with retry logic
    const searchInput = excelFilter.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Clear any existing text first
    await searchInput.clear();
    await this.page.waitForTimeout(200);
    
    // Fill the search input
    await searchInput.fill(siteName);
    
    // Wait for search to process (longer delay for search results)
    await this.page.waitForTimeout(1000);

    // Verify search results have loaded by checking if the site name appears
    const siteOption = excelFilter.getByText(siteName, { exact: true });
    try {
      await siteOption.waitFor({ state: 'visible', timeout: 8000 });
    } catch (error) {
      // If site not found, try refilling the search
      this.logger.warn(`Site name not found in first search attempt, retrying...`);
      await searchInput.clear();
      await this.page.waitForTimeout(300);
      await searchInput.fill(siteName);
      await this.page.waitForTimeout(1500);
      await siteOption.waitFor({ state: 'visible', timeout: 10000 });
    }

    // Try to click "Select All" to deselect, but continue if it's not found (might not appear with search results)
    try {
      const selectAllOption = excelFilter.getByText('Select All', { exact: true });
      await selectAllOption.waitFor({ state: 'visible', timeout: 3000 });
      await selectAllOption.click();
      
      // Wait for checkboxes to update after deselect
      await this.page.waitForTimeout(300);
    } catch (error) {
      this.logger.info('"Select All" not found - continuing with filtered results');
    }

    // Click the specific site name
    await siteOption.click();

    // Wait for checkbox state to update
    await this.page.waitForTimeout(300);

    // Wait for OK button to become enabled (critical - button starts disabled)
    await this.page.waitForFunction(
      () => {
        const filterDialog = document.querySelector('[aria-label="Excel filter"]');
        if (!filterDialog) return false;
        const btn = filterDialog.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      { timeout: 15000 },
    );

    // Click OK button within the Excel filter dialog
    const okButton = excelFilter.getByRole('button', { name: 'OK', exact: true });
    await okButton.click();
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');

    this.logger.info(`✓ Filtered by Site List: ${siteName}`);
  }

  /**
   * Filter by Accessible Sites (site access grid)
   * @param {string} siteName - Site name to filter by
   * @returns {Promise<void>}
   */
  async filterByAccessibleSites(siteName) {
    this.logger.action(`Filtering by Accessible Sites: ${siteName}`);

    // Wait for grid to be visible
    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Find the "Accessible Sites" or "Site List" column header
    let headerCell = this.page.locator('.e-headercelldiv:has-text("Accessible Sites")').first();
    const accessibleSitesExists = await headerCell.isVisible().catch(() => false);

    if (!accessibleSitesExists) {
      // Try "Site List" as fallback
      headerCell = this.page.locator('.e-headercelldiv:has-text("Site List")').first();
    }

    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Click the filter icon within the same parent container
    const filterIcon = headerCell.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    await filterIcon.click();
    await this.page.waitForTimeout(500);

    // Wait for Excel filter dialog
    const excelFilter = this.page.getByLabel('Excel filter');
    await excelFilter.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Search for the specific site
    const searchInput = excelFilter.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(siteName);
    await this.page.waitForTimeout(1000);

    // Click "Select All" to deselect all
    try {
      await excelFilter.getByText('Select All', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
      await excelFilter.getByText('Select All', { exact: true }).click();
      await this.page.waitForTimeout(500);
    } catch (error) {
      this.logger.info('"Select All" not found - continuing with filtered results');
    }

    // Now click only the specific site name
    await excelFilter.getByText(siteName, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    await excelFilter.getByText(siteName, { exact: true }).click();
    await this.page.waitForTimeout(500);

    // Wait for OK button to become enabled
    await this.page.waitForFunction(
      () => {
        const filterDialog = document.querySelector('[aria-label="Excel filter"]');
        if (!filterDialog) return false;
        const btn = filterDialog.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      { timeout: 15000 },
    );

    // Click OK button within the Excel filter dialog
    const okButton = excelFilter.getByRole('button', { name: 'OK', exact: true });
    await okButton.click();
    await this.page.waitForTimeout(500);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

    this.logger.info(`✓ Filtered by Accessible Sites: ${siteName}`);
  }

  /**
   * Filter group list by group name
   * @param {string} groupName - Group name to filter by
   * @returns {Promise<void>}
   */
  async filterByGroupName(groupName) {
    this.logger.action(`Filtering by Group List: ${groupName}`);

    // Wait for grid to be visible
    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Find the "Group List" column header
    const headerCell = this.page.locator('.e-headercelldiv:has-text("Group List")').first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Click the filter icon within the same parent container
    const filterIcon = headerCell.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    await filterIcon.click();
    await this.page.waitForTimeout(500);

    // Wait for Excel filter dialog
    const excelFilter = this.page.getByLabel('Excel filter');
    await excelFilter.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Search for the specific group
    const searchInput = excelFilter.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(groupName);
    await this.page.waitForTimeout(1000);

    // Click "Select All" to deselect all
    try {
      await excelFilter.getByText('Select All', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
      await excelFilter.getByText('Select All', { exact: true }).click();
      await this.page.waitForTimeout(500);
    } catch (error) {
      this.logger.info('"Select All" not found - continuing with filtered results');
    }

    // Now click only the specific group name
    await excelFilter.getByText(groupName, { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
    await excelFilter.getByText(groupName, { exact: true }).click();
    await this.page.waitForTimeout(500);

    // Wait for OK button to become enabled
    await this.page.waitForFunction(
      () => {
        const filterDialog = document.querySelector('[aria-label="Excel filter"]');
        if (!filterDialog) return false;
        const btn = filterDialog.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      { timeout: 15000 },
    );

    // Click OK button within the Excel filter dialog
    const okButton = excelFilter.getByRole('button', { name: 'OK', exact: true });
    await okButton.click();
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');

    this.logger.info(`✓ Filtered by Group List: ${groupName}`);
  }

  /**
   * Clear filter on a specific column
   * @param {string} columnName - Name of the column to clear filter
   * @returns {Promise<void>}
   */
  async clearColumnFilter(columnName) {
    this.logger.action(`Clearing filter on column: ${columnName}`);

    // Find the column header
    const columnHeader = this.page.locator(`.e-headercelldiv:has-text("${columnName}")`).first();

    // Scroll to the column header (both vertically and horizontally)
    // Intentionally suppress error - element may already be in view
    await columnHeader.scrollIntoViewIfNeeded().catch(() => {});
    this.logger.info(`✓ Scrolled to column: ${columnName}`);

    // Wait a moment for scrolling to complete
    await this.page.waitForTimeout(500);

    // Check if header is now visible
    const headerVisible = await columnHeader.isVisible().catch(() => false);

    if (!headerVisible) {
      this.logger.info(`✓ ${columnName} column not found in grid`);
      return;
    }

    // Find and check filter icon
    const filterIcon = columnHeader.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    const isFilterIconVisible = await filterIcon.isVisible().catch(() => false);

    if (!isFilterIconVisible) {
      this.logger.info(`✓ No filter icon visible on ${columnName} column`);
      return;
    }

    // Click filter icon
    this.logger.info(`Clicking filter icon on ${columnName} to clear filter...`);
    await filterIcon.click();
    // Intentionally suppress timeout - filter icon may not hide if menu already opened
    await filterIcon.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Look for Clear Filter option
    const clearFilterOption = this.page.getByText('Clear Filter', { exact: true });
    const isClearVisible = await clearFilterOption.isVisible().catch(() => false);

    if (isClearVisible) {
      this.logger.info('Clicking Clear Filter...');
      await clearFilterOption.click();
      // Intentionally suppress timeout - grid rows should be visible but may load slowly
      await this.page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
      this.logger.info(`✓ Filter cleared on ${columnName} column - all items now visible`);
    } else {
      this.logger.info('✓ No Clear Filter option - filter may already be clear');
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * Click filter icon on Access Status column
   * @returns {Promise<void>}
   */
  async clickAccessStatusFilterIcon() {
    this.logger.action('Clicking filter icon on Access Status column');

    // Wait for grid to be visible
    await this.page.locator('.e-grid').first().waitFor({ state: 'visible', timeout: 10000 });

    // Find the Access Status column header container
    const headerCell = this.page.locator('.e-headercelldiv:has-text("Access Status")').first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Click the filter icon within the same parent container
    const filterIcon = headerCell.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    await filterIcon.click();
    await this.page.waitForTimeout(500);

    this.logger.info('✓ Filter icon clicked');
  }

  /**
   * Click filter icon on any column by column name
   * @param {string} columnName - Name of the column to click filter icon
   * @returns {Promise<void>}
   */
  async clickColumnFilterIcon(columnName) {
    this.logger.action(`Clicking filter icon on ${columnName} column`);

    // Wait for grid to be visible
    await this.page.locator('.e-grid').first().waitFor({ state: 'visible', timeout: 10000 });

    // Find the column header container
    const headerCell = this.page.locator(`.e-headercelldiv:has-text("${columnName}")`).first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Click the filter icon within the same parent container
    const filterIcon = headerCell.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    await filterIcon.click();

    this.logger.info(`✓ Filter icon clicked on ${columnName} column`);
  }

  /**
   * Get Excel filter dialog element
   * @returns {Promise<Locator>} Excel filter dialog locator
   */
  async getExcelFilterDialog() {
    const excelFilter = this.page.getByLabel('Excel filter');
    await excelFilter.waitFor({ state: 'visible', timeout: 10000 });
    return excelFilter;
  }

  /**
   * Filter column by text using Excel filter
   * @param {string} columnName - Name of the column to filter
   * @param {string} searchText - Text to search for
   * @returns {Promise<void>}
   */
  async filterColumnByText(columnName, searchText) {
    this.logger.action(`Filtering ${columnName} column by: ${searchText}`);

    await this.clickColumnFilterIcon(columnName);

    const excelFilter = await this.getExcelFilterDialog();

    // Enter search text
    const searchInput = excelFilter.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(1000);

    // Click OK button to apply filter
    const okButton = excelFilter.getByRole('button', { name: 'OK', exact: true });
    await okButton.waitFor({ state: 'visible', timeout: 10000 });
    await okButton.click();
    await this.page.waitForTimeout(2000);

    this.logger.info(`✓ Filter applied on ${columnName} column`);
  }

  /**
   * Get count of visible rows in grid
   * @returns {Promise<number>} Count of visible rows
   */
  async getVisibleRowCount() {
    this.logger.action('Getting count of visible rows');
    const visibleRows = this.page.locator('.e-row:visible');
    const count = await visibleRows.count();
    this.logger.info(`✓ Visible row count: ${count}`);
    return count;
  }

  /**
   * Get Clear Filter option from Excel filter dialog
   * @returns {Promise<Locator>} Clear Filter option locator
   */
  async getClearFilterOption() {
    const clearFilterOption = this.page.getByText('Clear Filter', { exact: true });
    await clearFilterOption.waitFor({ state: 'visible', timeout: 10000 });
    return clearFilterOption;
  }

  /**
   * Verify Access Status filter options are available
   * @returns {Promise<void>}
   */
  async verifyAccessStatusFilterOptions() {
    this.logger.action('Verifying Access Status filter options');

    // Wait for filter menu to appear
    const filterMenu = this.page.getByLabel('Excel filter');
    await filterMenu.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);

    // Excel filter doesn't have "All" as a separate option - it uses "Select All" checkbox instead
    const expectedOptions = ['Active', 'Expired', 'Expiring Soon', 'Blanks'];

    // Verify each expected option exists by trying to find it with getByText
    for (const option of expectedOptions) {
      try {
        const optionElement = filterMenu.getByText(option, { exact: true });
        await optionElement.waitFor({ state: 'visible', timeout: 5000 });
        this.logger.info(`✓ Found filter option: ${option}`);
      } catch (error) {
        throw new Error(`Missing filter option: ${option}`);
      }
    }

    this.logger.info('✓ All required filter options are present (Active, Expired, Expiring Soon, Blanks)');
  }

  /**
   * Select a specific Access Status filter option
   * @param {string} filterOption - Filter option to select (All, Expiring Soon, Expired, Blanks, Active)
   * @returns {Promise<void>}
   */
  async selectAccessStatusFilter(filterOption) {
    this.logger.action(`Selecting Access Status filter: ${filterOption}`);

    const filterMenu = this.page.getByLabel('Excel filter');
    await filterMenu.waitFor({ state: 'visible', timeout: 10000 });

    // Handle "All" case - use "Select All" checkbox
    if (filterOption === 'All') {
      this.logger.info('Handling "All" filter by ensuring all checkboxes are selected');

      // Check if "Select All" checkbox is already checked
      const selectAllCheckbox = filterMenu.locator('.e-list-item:has-text("Select All") input[type="checkbox"]');
      const isChecked = await selectAllCheckbox.isChecked();

      if (!isChecked) {
        // Click "Select All" to check all options
        const selectAllOption = filterMenu.getByText('Select All', { exact: true });
        await selectAllOption.click();
        await this.page.waitForTimeout(500);
        this.logger.info('✓ Clicked "Select All" to select all options');
      } else {
        this.logger.info('✓ "Select All" is already checked');
      }
    } else {
      // For specific filter options: First deselect all, then select the target

      // Step 1: Click "Select All" to deselect all if it's checked
      try {
        const selectAllCheckbox = filterMenu.locator('.e-list-item:has-text("Select All") input[type="checkbox"]');
        const isChecked = await selectAllCheckbox.isChecked();

        if (isChecked) {
          const selectAllOption = filterMenu.getByText('Select All', { exact: true });
          await selectAllOption.click();
          await this.page.waitForTimeout(500);
          this.logger.info('✓ Clicked "Select All" to deselect all');
        }
      } catch (error) {
        this.logger.info('"Select All" not found or not needed');
      }

      // Step 2: Click the target filter option
      const targetOption = filterMenu.getByText(filterOption, { exact: true });
      await targetOption.waitFor({ state: 'visible', timeout: 5000 });
      await targetOption.click();
      await this.page.waitForTimeout(500);
      this.logger.info(`✓ Selected "${filterOption}"`);
    }

    // Step 3: Wait for OK button and click it
    const okButton = filterMenu.locator('button:has-text("OK")');
    await this.page.waitForFunction(
      (btn) => {
        const button = document.querySelector(btn);
        return button && !button.disabled;
      },
      'button:has-text("OK")',
      { timeout: 10000 },
    );
    await okButton.click();
    await this.page.waitForTimeout(500);
    this.logger.info('✓ Clicked OK button');

    // Wait for filter to apply
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      this.logger.info('Network did not go idle after filter');
    });

    this.logger.info(`✓ Access Status filter "${filterOption}" applied`);
  }
}

module.exports = UserFilterOperations;
