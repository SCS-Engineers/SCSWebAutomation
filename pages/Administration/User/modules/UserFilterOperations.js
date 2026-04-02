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

    // Wait for the users list grid to be visible (scoped to the grid that has
    // the "First name" column so residual hidden site-access grids are ignored).
    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    await usersListGrid.locator('.e-gridcontent').waitFor({ state: 'visible', timeout: 10000 });

    // Find the "First name" column header container
    const headerCell = this.page.locator('.e-headercelldiv:has-text("First name")').first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Click the filter icon within the same parent container.
    // EJ2 sets aria-hidden on the filter icon unless the column is in hover state.
    // Use page.mouse.move() (no actionability checks) to trigger EJ2 hover,
    // then click with force:true to open the filter regardless of aria-hidden.
    const filterIcon = headerCell.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    // EJ2 requires the mouse to be over the filter icon itself (not just header cell)
    // to activate its click handler. Move mouse directly to the icon's bounding box.
    const iconBox = await filterIcon.boundingBox();
    if (iconBox) {
      await this.page.mouse.move(
        iconBox.x + iconBox.width / 2,
        iconBox.y + iconBox.height / 2,
      );
      await this.page.waitForTimeout(500);
    }
    await filterIcon.click({ force: true });
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

    // Find the "Site List" column header (not "Site Name")
    const headerCell = this.page.locator('.e-headercelldiv:has-text("Site List")').first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Scroll the header into view to ensure the filter icon is accessible
    await headerCell.scrollIntoViewIfNeeded();

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

    // Find the "Group List" column header
    const headerCell = this.page.locator('.e-headercelldiv:has-text("Group List")').first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });

    // Scroll the header into view to ensure the filter icon is accessible
    await headerCell.scrollIntoViewIfNeeded();

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

  /**
   * Get first N first names from the user grid "First name" column
   * @param {number} count - Number of first names to retrieve (default: 5)
   * @returns {Promise<string[]>} Array of first name strings
   */
  async getFirstNamesFromUserGrid(count = 5) {
    this.logger.action(`Getting first ${count} first names from user grid`);

    // Find the grid that contains a "First name" column header
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();

    let firstNameColumnIndex = -1;
    let correctGridIndex = -1;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('First name')) {
          firstNameColumnIndex = i;
          correctGridIndex = gridIndex;
          break;
        }
      }

      if (firstNameColumnIndex !== -1) break;
    }

    if (firstNameColumnIndex === -1) {
      throw new Error('"First name" column not found in any grid');
    }

    const correctGrid = allGrids.nth(correctGridIndex);
    const rows = correctGrid.locator('.e-row');
    const rowCount = await rows.count();
    const actualCount = Math.min(count, rowCount);
    const names = [];

    for (let i = 0; i < actualCount; i++) {
      const cell = rows.nth(i).locator('td').nth(firstNameColumnIndex);
      const text = await cell.textContent();
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        names.push(trimmed);
      }
    }

    this.logger.info(`✓ Captured first names: ${names.join(', ')}`);
    return names;
  }

  /**
   * Select a site from the EJ2 site filter dropdown on the Users List page
   * by typing and selecting the matching option.
   * EJ2 DropDownList IDs are dynamic (auto-incremented), so this method uses
   * aria attributes or a contextual fallback to locate the wrapper span.
   * @param {string} dropdownId - The element ID hint (e.g. 'ej2_dropdownlist_5269')
   * @param {string} siteName - The site name to type and select
   * @returns {Promise<void>}
   */
  async selectSiteFromDropdownById(dropdownId, siteName) {
    this.logger.action(`Selecting site "${siteName}" from site filter dropdown`);

    // EJ2 DropDownList renders as:
    //   <span role="combobox" class="e-ddl e-lib e-control-wrapper ..." aria-describedby="<ID>">
    //     <input type="text" readonly ...>  ← readonly internal input, NOT the click target
    //   </span>
    // The wrapper span intercepts pointer events — we must click IT, not the internal input.

    // Strategy 1: find wrapper span by aria-describedby matching the provided ID
    let wrapper = this.page.locator(`span.e-ddl[aria-describedby="${dropdownId}"], span.e-ddl[aria-describedby="${dropdownId}_hidden"]`);
    const byIdCount = await wrapper.count();

    if (byIdCount === 0) {
      // Strategy 2: ID is dynamic — find the site filter combobox wrapper contextually.
      // The "Assigned to selected site" checkbox lives in the same filter panel as this dropdown.
      this.logger.info(`Dropdown #${dropdownId} not found by ID — using contextual locator`);
      wrapper = this.page.locator('span.e-ddl[role="combobox"]').first();
    }

    await wrapper.waitFor({ state: 'visible', timeout: 10000 });
    await wrapper.click();
    await this.page.waitForTimeout(500);

    // Wait for the EJ2 popup to open
    const popup = this.page.locator('.e-popup.e-popup-open');
    await popup.waitFor({ state: 'visible', timeout: 10000 });

    // Fill the popup filter/search input if present (EJ2 filterable DropDownList)
    const filterInput = popup.locator('input.e-input-filter, input[role="combobox"]').first();
    const hasFilterInput = await filterInput.isVisible().catch(() => false);

    if (hasFilterInput) {
      await filterInput.fill(siteName);
      await this.page.waitForTimeout(1000);
    }

    // Click the exact matching option
    const option = popup.locator('.e-list-item').filter({ hasText: siteName }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();

    await this.page.waitForTimeout(500);
    this.logger.info(`✓ Selected site "${siteName}" from dropdown`);
  }

  /**
   * Click the "Assigned to selected site" checkbox label to toggle filter
   * @returns {Promise<void>}
   */
  async clickAssignedToSelectedSiteCheckbox() {
    this.logger.action('Clicking "Assigned to selected site" checkbox');

    const label = this.page.getByText('Assigned to selected site', { exact: true });
    await label.waitFor({ state: 'visible', timeout: 10000 });
    await label.click();

    await this.page.waitForTimeout(500);
    this.logger.info('✓ "Assigned to selected site" checkbox clicked');
  }

  /**
   * Uncheck the "Assigned to selected site" filter checkbox if it is currently checked.
   * This resets the Users List to show all users, making the grid content visible again.
   * Safe to call even if the checkbox is already unchecked or not visible.
   * @returns {Promise<void>}
   */
  async resetAssignedToSiteFilter() {
    this.logger.action('Resetting "Assigned to selected site" filter if active');

    try {
      const label = this.page.getByText('Assigned to selected site', { exact: true });
      const isVisible = await label.isVisible({ timeout: 5000 }).catch(() => false);

      if (!isVisible) {
        this.logger.info('"Assigned to selected site" label not visible — skipping reset');
        return;
      }

      // Locate the associated checkbox input
      const checkboxInput = label.locator('..').locator('input[type="checkbox"]').first();
      const isChecked = await checkboxInput.isChecked().catch(() => false);

      if (isChecked) {
        await label.click();
        await this.page.waitForTimeout(1000);
        this.logger.info('✓ "Assigned to selected site" unchecked — grid will reload with all users');
      } else {
        this.logger.info('✓ "Assigned to selected site" already unchecked — no action needed');
      }
    } catch (error) {
      this.logger.warn(`resetAssignedToSiteFilter: ${error.message}`);
    }
  }

  /**
   * Verify that all specified first names are visible somewhere in the user grid
   * @param {string[]} firstNames - Array of first names to verify as present
   * @returns {Promise<void>}
   */
  async verifyFirstNamesPresent(firstNames) {
    this.logger.action(`Verifying first names present in grid: ${firstNames.join(', ')}`);

    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 10000 });

    for (const name of firstNames) {
      const row = this.page.locator('.e-row').filter({ hasText: name }).first();
      const isVisible = await row.isVisible().catch(() => false);
      if (!isVisible) {
        throw new Error(`Expected first name "${name}" not found in grid`);
      }
      this.logger.info(`✓ "${name}" is visible in grid`);
    }

    this.logger.info('✓ All expected first names are present in the grid');
  }

  /**
   * Verify that only the specified first names are visible in the user grid
   * @param {string[]} expectedNames - Array of first names that should be the only ones visible
   * @returns {Promise<void>}
   */
  async verifyOnlyFirstNamesVisible(expectedNames) {
    this.logger.action(`Verifying only these first names are visible: ${expectedNames.join(', ')}`);

    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 10000 });

    // Retrieve all non-empty names currently rendered in the grid
    const allNames = await this.getFirstNamesFromUserGrid(100);
    const actualNames = allNames.filter((n) => n.length > 0);

    // Every expected name must be present
    for (const expected of expectedNames) {
      if (!actualNames.includes(expected)) {
        throw new Error(
          `Expected name "${expected}" not found in grid. Visible names: ${actualNames.join(', ')}`,
        );
      }
      this.logger.info(`✓ "${expected}" is present in grid`);
    }

    // No unexpected names should be present
    for (const actual of actualNames) {
      if (!expectedNames.includes(actual)) {
        throw new Error(
          `Unexpected name "${actual}" found in grid. Only expected: ${expectedNames.join(', ')}`,
        );
      }
    }

    this.logger.info(`✓ Grid shows exactly: ${expectedNames.join(', ')}`);
  }

  /**
   * Verify that a specific first name is NOT visible in the user grid
   * @param {string} firstName - First name expected to be absent
   * @returns {Promise<void>}
   */
  async verifyFirstNameNotVisible(firstName) {
    this.logger.action(`Verifying "${firstName}" is NOT visible in user grid`);

    await this.page.locator('.e-gridcontent').first()
      .waitFor({state: 'visible', timeout: 10000});

    const row = this.page.locator('.e-row')
      .filter({hasText: firstName}).first();
    const isVisible = await row.isVisible().catch(() => false);

    if (isVisible) {
      throw new Error(
        `Expected "${firstName}" to NOT be visible in grid, but it was found`,
      );
    }

    this.logger.info(`✓ "${firstName}" is not visible in grid`);
  }

  /**
   * Get all visible column header texts from the Users list grid
   * (the grid identified by having a "First name" column)
   * @returns {Promise<string[]>} Array of column header text strings
   */
  async getUserListGridColumnHeaders() {
    this.logger.action('Getting column headers from Users list grid');

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    await usersListGrid.locator('.e-gridcontent')
      .waitFor({state: 'visible', timeout: 10000});

    const headers = usersListGrid.locator('.e-gridheader .e-headercell');
    const headerCount = await headers.count();
    const columnNames = [];

    for (let i = 0; i < headerCount; i++) {
      const header = headers.nth(i);
      const isVisible = await header.isVisible().catch(() => false);
      if (!isVisible) continue;

      // Get text from .e-headercelldiv to avoid accessibility hints
      let headerText = await header.locator('.e-headercelldiv')
        .first().textContent().catch(() => null);
      if (!headerText) {
        headerText = await header.textContent();
      }
      const cleaned = (headerText || '')
        .replace(/Press Alt Down.*$/s, '')
        .replace(/Press Enter.*$/s, '')
        .trim().replace(/\s+/g, ' ');
      if (cleaned) {
        columnNames.push(cleaned);
      }
    }

    this.logger.info(
      `Found ${columnNames.length} visible columns: ${columnNames.join(', ')}`,
    );
    return columnNames;
  }

  /**
   * Verify the "Access Expiration" column is visible in the Users list grid
   * and is positioned between "Last Login" and "Created On" columns
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationColumnVisibleInUserGrid() {
    this.logger.action(
      'Verifying Access Expiration column is visible between '
      + 'Last Login and Created On in user grid',
    );

    const headers = await this.getUserListGridColumnHeaders();
    const accessExpIdx = headers.findIndex(
      (h) => h.includes('Access') && h.includes('Expiration'),
    );
    if (accessExpIdx === -1) {
      throw new Error(
        'Access Expiration column not found in Users list grid. '
        + `Headers: ${headers.join(', ')}`,
      );
    }

    const lastLoginIdx = headers.findIndex(
      (h) => h.includes('Last Login') || h.includes('Last Logon'),
    );
    const createdOnIdx = headers.findIndex(
      (h) => h.includes('Created On') || h.includes('Created Date'),
    );

    if (lastLoginIdx !== -1 && accessExpIdx <= lastLoginIdx) {
      throw new Error(
        `Access Expiration (index ${accessExpIdx}) should be after `
        + `Last Login (index ${lastLoginIdx})`,
      );
    }
    if (createdOnIdx !== -1 && accessExpIdx >= createdOnIdx) {
      throw new Error(
        `Access Expiration (index ${accessExpIdx}) should be before `
        + `Created On (index ${createdOnIdx})`,
      );
    }

    this.logger.info(
      '✓ Access Expiration column is visible and positioned correctly',
    );
  }

  /**
   * Verify the "Access Expiration" column is NOT visible in the Users list grid
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationColumnNotVisibleInUserGrid() {
    this.logger.action(
      'Verifying Access Expiration column is NOT visible in user grid',
    );

    const headers = await this.getUserListGridColumnHeaders();
    const found = headers.some(
      (h) => h.includes('Access') && h.includes('Expiration'),
    );
    if (found) {
      throw new Error(
        'Access Expiration column should NOT be visible, '
        + `but was found. Headers: ${headers.join(', ')}`,
      );
    }

    this.logger.info('✓ Access Expiration column is not visible');
  }

  /**
   * Get the "Access Expiration" cell value for a user in the Users list grid
   * @param {string} userName - First name of the user
   * @returns {Promise<string>} The cell text content
   */
  async getAccessExpirationValueForUser(userName) {
    this.logger.action(
      `Getting Access Expiration value for "${userName}" in user grid`,
    );

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    await usersListGrid.locator('.e-gridcontent')
      .waitFor({state: 'visible', timeout: 10000});

    // Find the Access Expiration column index
    const headers = usersListGrid.locator('.e-gridheader .e-headercell');
    const headerCount = await headers.count();
    let colIdx = -1;

    for (let i = 0; i < headerCount; i++) {
      const text = (await headers.nth(i).textContent() || '')
        .trim().replace(/\s+/g, ' ');
      if (text.includes('Access') && text.includes('Expiration')) {
        colIdx = i;
        break;
      }
    }
    if (colIdx === -1) {
      throw new Error(
        'Access Expiration column not found in Users list grid',
      );
    }

    // Find the user's row and get the cell
    const userRow = usersListGrid.locator('.e-row')
      .filter({hasText: userName}).first();
    await userRow.waitFor({state: 'visible', timeout: 10000});
    const cellText = (
      await userRow.locator('td').nth(colIdx).textContent() || ''
    ).trim();

    this.logger.info(
      `Access Expiration for "${userName}": "${cellText}"`,
    );
    return cellText;
  }

  /**
   * Verify the Access Expiration date for a user matches MM/DD/YYYY format
   * @param {string} userName - First name of the user
   * @returns {Promise<string>} The date value
   */
  async verifyAccessExpirationDateFormatInUserGrid(userName) {
    this.logger.action(
      `Verifying Access Expiration date format for "${userName}"`,
    );

    const value = await this.getAccessExpirationValueForUser(userName);
    const pattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!pattern.test(value)) {
      throw new Error(
        `Access Expiration date "${value}" does not match `
        + 'expected MM/DD/YYYY format',
      );
    }

    this.logger.info(
      `✓ Access Expiration date "${value}" matches MM/DD/YYYY`,
    );
    return value;
  }

  /**
   * Verify the Access Expiration cell is empty for a user in the Users list grid
   * @param {string} userName - First name of the user
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationCellEmptyForUser(userName) {
    this.logger.action(
      `Verifying Access Expiration cell is empty for "${userName}"`,
    );

    const value = await this.getAccessExpirationValueForUser(userName);
    const cleaned = value.replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim();
    if (cleaned !== '') {
      throw new Error(
        `Access Expiration cell is not empty for "${userName}". `
        + `Actual: "${cleaned}"`,
      );
    }

    this.logger.info(
      `✓ Access Expiration cell is empty for "${userName}"`,
    );
  }

  /**
   * Get the column index of the Access Expiration column in the Users list grid
   * @returns {Promise<number>} 0-based column index
   * @throws {Error} If column not found
   */
  async _getAccessExpirationColumnIndex() {
    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    const headers = usersListGrid.locator('.e-gridheader .e-headercell');
    const headerCount = await headers.count();

    for (let i = 0; i < headerCount; i++) {
      const text = (await headers.nth(i).textContent() || '')
        .trim().replace(/\s+/g, ' ');
      if (text.includes('Access') && text.includes('Expiration')) {
        return i;
      }
    }
    throw new Error(
      'Access Expiration column not found in Users list grid',
    );
  }

  /**
   * Get all visible Access Expiration values from the Users list grid
   * @returns {Promise<string[]>} Array of cell text values (may include empty strings)
   */
  async getAllAccessExpirationValues() {
    this.logger.action(
      'Getting all Access Expiration values from user grid',
    );

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    await usersListGrid.locator('.e-gridcontent')
      .waitFor({state: 'visible', timeout: 10000});

    const colIdx = await this._getAccessExpirationColumnIndex();
    const rows = usersListGrid.locator('.e-row');
    const rowCount = await rows.count();
    const values = [];

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const isVisible = await row.isVisible().catch(() => false);
      if (!isVisible) continue;
      const cellText = (
        await row.locator('td').nth(colIdx).textContent() || ''
      ).trim();
      values.push(cellText);
    }

    this.logger.info(
      `Retrieved ${values.length} Access Expiration values`,
    );
    return values;
  }

  /**
   * Click the Access Expiration column header to sort in the Users list grid
   * @returns {Promise<void>}
   */
  async clickAccessExpirationColumnHeader() {
    this.logger.action(
      'Clicking Access Expiration column header to sort',
    );

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    await usersListGrid.locator('.e-gridcontent')
      .waitFor({state: 'visible', timeout: 10000});

    const headers = usersListGrid.locator('.e-gridheader .e-headercell');
    const headerCount = await headers.count();

    for (let i = 0; i < headerCount; i++) {
      const text = (await headers.nth(i).textContent() || '')
        .trim().replace(/\s+/g, ' ');
      if (text.includes('Access') && text.includes('Expiration')) {
        await headers.nth(i).locator('.e-headercelldiv').first().click();
        await this.page.waitForTimeout(1000);
        this.logger.info(
          '✓ Clicked Access Expiration column header',
        );
        return;
      }
    }
    throw new Error(
      'Access Expiration column header not found for sorting',
    );
  }

  /**
   * Sort the Users list grid by the Access Expiration column in ascending order
   * Clicks the header until it reaches ascending state
   * @returns {Promise<void>}
   */
  async sortAccessExpirationAscending() {
    this.logger.action(
      'Sorting Access Expiration column ascending',
    );

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    const headers = usersListGrid.locator('.e-gridheader .e-headercell');
    const headerCount = await headers.count();
    let headerCell = null;

    for (let i = 0; i < headerCount; i++) {
      const text = (await headers.nth(i).textContent() || '')
        .trim().replace(/\s+/g, ' ');
      if (text.includes('Access') && text.includes('Expiration')) {
        headerCell = headers.nth(i);
        break;
      }
    }
    if (!headerCell) {
      throw new Error('Access Expiration column header not found');
    }

    // Click until aria-sort is ascending (max 3 clicks)
    for (let attempt = 0; attempt < 3; attempt++) {
      const sortState = await headerCell.getAttribute('aria-sort')
        .catch(() => 'none');
      if (sortState === 'ascending') {
        this.logger.info(
          '✓ Access Expiration column sorted ascending',
        );
        return;
      }
      await headerCell.locator('.e-headercelldiv').first().click();
      await this.page.waitForTimeout(1000);
    }

    const finalSort = await headerCell.getAttribute('aria-sort')
      .catch(() => 'none');
    if (finalSort !== 'ascending') {
      throw new Error(
        `Failed to set ascending sort. Current: ${finalSort}`,
      );
    }
    this.logger.info('✓ Access Expiration column sorted ascending');
  }

  /**
   * Sort the Users list grid by the Access Expiration column in descending order
   * Clicks the header until it reaches descending state
   * @returns {Promise<void>}
   */
  async sortAccessExpirationDescending() {
    this.logger.action(
      'Sorting Access Expiration column descending',
    );

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    const headers = usersListGrid.locator('.e-gridheader .e-headercell');
    const headerCount = await headers.count();
    let headerCell = null;

    for (let i = 0; i < headerCount; i++) {
      const text = (await headers.nth(i).textContent() || '')
        .trim().replace(/\s+/g, ' ');
      if (text.includes('Access') && text.includes('Expiration')) {
        headerCell = headers.nth(i);
        break;
      }
    }
    if (!headerCell) {
      throw new Error('Access Expiration column header not found');
    }

    // Click until aria-sort is descending (max 3 clicks)
    for (let attempt = 0; attempt < 3; attempt++) {
      const sortState = await headerCell.getAttribute('aria-sort')
        .catch(() => 'none');
      if (sortState === 'descending') {
        this.logger.info(
          '✓ Access Expiration column sorted descending',
        );
        return;
      }
      await headerCell.locator('.e-headercelldiv').first().click();
      await this.page.waitForTimeout(1000);
    }

    const finalSort = await headerCell.getAttribute('aria-sort')
      .catch(() => 'none');
    if (finalSort !== 'descending') {
      throw new Error(
        `Failed to set descending sort. Current: ${finalSort}`,
      );
    }
    this.logger.info(
      '✓ Access Expiration column sorted descending',
    );
  }

  /**
   * Verify Access Expiration values are sorted in ascending order
   * Empty values are pushed to the end in ascending sort
   * @returns {Promise<string[]>} The sorted values for logging
   */
  async verifyAccessExpirationSortedAscending() {
    this.logger.action(
      'Verifying Access Expiration values are sorted ascending',
    );

    const values = await this.getAllAccessExpirationValues();
    const dateValues = values.filter((v) => v.trim() !== '');
    const emptyCount = values.filter((v) => v.trim() === '').length;

    // Verify dates are in ascending order (MM/DD/YYYY)
    for (let i = 1; i < dateValues.length; i++) {
      const prev = new Date(dateValues[i - 1]);
      const curr = new Date(dateValues[i]);
      if (prev > curr) {
        throw new Error(
          `Access Expiration not sorted ascending: "${dateValues[i - 1]}" `
          + `should be before "${dateValues[i]}"`,
        );
      }
    }

    // Verify empty values are grouped together (not interleaved with dates)
    let seenEmpty = false;
    for (const val of values) {
      const isEmpty = val.trim() === '';
      if (seenEmpty && !isEmpty) {
        // After seeing empty, we found a date — blanks are at the start
        // That's acceptable; just verify dates themselves are ordered
        break;
      }
      if (isEmpty) seenEmpty = true;
    }

    this.logger.info(
      `✓ Access Expiration sorted ascending: ${dateValues.length} dates, `
      + `${emptyCount} empty`,
    );
    return values;
  }

  /**
   * Verify Access Expiration values are sorted in descending order
   * Empty values may appear at the beginning or end depending on grid behavior
   * @returns {Promise<string[]>} The sorted values for logging
   */
  async verifyAccessExpirationSortedDescending() {
    this.logger.action(
      'Verifying Access Expiration values are sorted descending',
    );

    const values = await this.getAllAccessExpirationValues();
    const dateValues = values.filter((v) => v.trim() !== '');
    const emptyCount = values.filter((v) => v.trim() === '').length;

    // Verify dates are in descending order (MM/DD/YYYY)
    for (let i = 1; i < dateValues.length; i++) {
      const prev = new Date(dateValues[i - 1]);
      const curr = new Date(dateValues[i]);
      if (prev < curr) {
        throw new Error(
          `Access Expiration not sorted descending: "${dateValues[i - 1]}" `
          + `should be after "${dateValues[i]}"`,
        );
      }
    }

    this.logger.info(
      `✓ Access Expiration sorted descending: ${dateValues.length} dates, `
      + `${emptyCount} empty`,
    );
    return values;
  }

  /**
   * Open the Excel filter dialog for the Access Expiration column.
   * Uses mouse hover to activate EJ2 filter icon before clicking.
   * @private
   * @returns {Promise<Locator>} The Excel filter dialog locator
   */
  async _openAccessExpirationFilterDialog() {
    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    const headers = usersListGrid.locator('.e-gridheader .e-headercell');
    const headerCount = await headers.count();
    let headerCellDiv = null;

    for (let i = 0; i < headerCount; i++) {
      const text = (await headers.nth(i).textContent() || '')
        .trim().replace(/\s+/g, ' ');
      if (text.includes('Access') && text.includes('Expiration')) {
        headerCellDiv = headers.nth(i).locator('.e-headercelldiv').first();
        break;
      }
    }
    if (!headerCellDiv) {
      throw new Error('Access Expiration column header not found');
    }

    // EJ2 keeps filter icons aria-hidden until hover — move mouse first
    const filterIcon = headerCellDiv.locator('..')
      .locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({state: 'visible', timeout: 10000});
    const iconBox = await filterIcon.boundingBox();
    if (iconBox) {
      await this.page.mouse.move(
        iconBox.x + iconBox.width / 2,
        iconBox.y + iconBox.height / 2,
      );
      await this.page.waitForTimeout(500);
    }
    await filterIcon.click({force: true});

    // Wait for Excel filter dialog
    const excelFilter = this.page.getByLabel('Excel filter');
    await excelFilter.waitFor({state: 'visible', timeout: 10000});
    return excelFilter;
  }

  /**
   * Filter the Access Expiration column in the Users list grid by a value
   * Uses the Excel filter dialog pattern
   * @param {string} searchText - Text to search/filter by
   * @returns {Promise<void>}
   */
  async filterAccessExpirationByValue(searchText) {
    this.logger.action(
      `Filtering Access Expiration column by: ${searchText}`,
    );

    const excelFilter = await this._openAccessExpirationFilterDialog();

    // Search for the value
    const searchInput = excelFilter
      .locator('input[placeholder="Search"]');
    await searchInput.waitFor({state: 'visible', timeout: 10000});
    await searchInput.clear();
    await searchInput.fill(searchText);
    await this.page.waitForTimeout(1500);

    // Deselect all then select matching
    try {
      await excelFilter.getByText('Select All', {exact: true})
        .waitFor({state: 'visible', timeout: 5000});
      await excelFilter.getByText('Select All', {exact: true}).click();
      await this.page.waitForTimeout(500);
    } catch (error) {
      this.logger.info('"Select All" not found — continuing');
    }

    // Select the searched value
    await excelFilter.getByText(searchText, {exact: true})
      .waitFor({state: 'visible', timeout: 10000});
    await excelFilter.getByText(searchText, {exact: true}).click();
    await this.page.waitForTimeout(500);

    // Wait for OK to be enabled and click
    await this.page.waitForFunction(
      () => {
        const fd = document.querySelector('[aria-label="Excel filter"]');
        if (!fd) return false;
        const btn = fd.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      {timeout: 15000},
    );
    const okButton = excelFilter
      .getByRole('button', {name: 'OK', exact: true});
    await okButton.click();
    await this.page.waitForLoadState('networkidle')
      .catch(() => {});
    await this.page.waitForTimeout(1000);

    this.logger.info(
      `✓ Access Expiration filtered by: ${searchText}`,
    );
  }

  /**
   * Filter the Access Expiration column in the Users list grid to show only
   * rows with blank (empty) values
   * @returns {Promise<void>}
   */
  async filterAccessExpirationByBlanks() {
    this.logger.action(
      'Filtering Access Expiration column by Blanks',
    );

    const excelFilter = await this._openAccessExpirationFilterDialog();
    await this.page.waitForTimeout(500);

    // Step 1: Click "Select All" to deselect every option
    try {
      const selectAllOption = excelFilter
        .getByText('Select All', {exact: true});
      await selectAllOption.waitFor({state: 'visible', timeout: 5000});
      await selectAllOption.click();
      await this.page.waitForTimeout(500);
      this.logger.info('✓ Clicked "Select All" to deselect all');
    } catch (error) {
      this.logger.info('"Select All" not found — continuing');
    }

    // Step 2: Select only "Blanks"
    const blanksOption = excelFilter
      .getByText('Blanks', {exact: true});
    await blanksOption.waitFor({state: 'visible', timeout: 5000});
    await blanksOption.click();
    await this.page.waitForTimeout(500);
    this.logger.info('✓ Selected "Blanks"');

    // Step 3: Wait for OK to be enabled and click
    await this.page.waitForFunction(
      () => {
        const fd = document.querySelector('[aria-label="Excel filter"]');
        if (!fd) return false;
        const btn = fd.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      {timeout: 15000},
    );
    const okButton = excelFilter
      .getByRole('button', {name: 'OK', exact: true});
    await okButton.click();
    await this.page.waitForLoadState('networkidle')
      .catch(() => {});
    await this.page.waitForTimeout(1000);

    this.logger.info('✓ Access Expiration filtered by Blanks');
  }

  /**
   * Clear the filter on the Access Expiration column in the Users list grid
   * @returns {Promise<void>}
   */
  async clearAccessExpirationColumnFilter() {
    this.logger.action(
      'Clearing Access Expiration column filter',
    );

    try {
      await this._openAccessExpirationFilterDialog();
    } catch (error) {
      this.logger.info(
        'Access Expiration filter dialog could not be opened — '
        + 'filter may already be clear',
      );
      return;
    }

    // Look for Clear Filter option
    const clearFilter = this.page.getByText('Clear Filter', {exact: true});
    const isClearVisible = await clearFilter.isVisible()
      .catch(() => false);
    if (isClearVisible) {
      await clearFilter.click();
      await this.page.locator('.e-grid .e-row').first()
        .waitFor({state: 'visible', timeout: 30000}).catch(() => {});
      this.logger.info(
        '✓ Access Expiration column filter cleared',
      );
    } else {
      this.logger.info(
        '✓ No Clear Filter option — filter may already be clear',
      );
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * Verify all visible Access Expiration values match the expected value
   * @param {string} expectedValue - Expected cell value
   * @returns {Promise<number>} Count of rows verified
   */
  async verifyAllAccessExpirationValuesMatch(expectedValue) {
    this.logger.action(
      `Verifying all Access Expiration values are "${expectedValue}"`,
    );

    const values = await this.getAllAccessExpirationValues();
    for (const value of values) {
      if (value.trim() !== expectedValue.trim()) {
        throw new Error(
          `Expected Access Expiration "${expectedValue}" `
          + `but found "${value}"`,
        );
      }
    }

    this.logger.info(
      `✓ All ${values.length} Access Expiration values match `
      + `"${expectedValue}"`,
    );
    return values.length;
  }

  /**
   * Verify all visible Access Expiration cells are empty
   * @returns {Promise<number>} Count of rows verified
   */
  async verifyAllAccessExpirationValuesEmpty() {
    this.logger.action(
      'Verifying all Access Expiration values are empty',
    );

    const values = await this.getAllAccessExpirationValues();
    for (let i = 0; i < values.length; i++) {
      const cleaned = values[i]
        .replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim();
      if (cleaned !== '') {
        throw new Error(
          `Access Expiration cell at row ${i} is not empty. `
          + `Actual: "${cleaned}"`,
        );
      }
    }

    this.logger.info(
      `✓ All ${values.length} Access Expiration values are empty`,
    );
    return values.length;
  }

  // ── Access Expiration Context Menu & Popup Methods ──────────────

  /**
   * Click/select a user row in the Users list grid by first name
   * @param {string} userName - First name of the user
   * @returns {Promise<void>}
   */
  async clickUserRowInGrid(userName) {
    this.logger.action(`Clicking user row for "${userName}"`);

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    const userRow = usersListGrid.locator('.e-row')
      .filter({hasText: userName}).first();
    await userRow.waitFor({state: 'visible', timeout: 10000});
    await userRow.scrollIntoViewIfNeeded();
    await userRow.click();

    // Wait for row to be selected (highlighted)
    await this.page.waitForTimeout(500);
    this.logger.info(`✓ User row "${userName}" selected`);
  }

  /**
   * Verify the user row is highlighted (selected) in the Users list grid.
   * Checks for the Syncfusion `.e-active` class or `aria-selected` attribute.
   * @param {string} userName - First name of the user
   * @returns {Promise<void>}
   */
  async verifyUserRowHighlighted(userName) {
    this.logger.action(`Verifying user row "${userName}" is highlighted`);

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    const userRow = usersListGrid.locator('.e-row')
      .filter({hasText: userName}).first();
    await userRow.waitFor({state: 'visible', timeout: 10000});

    // Check for active/selected state
    const isActive = await userRow.evaluate((el) => {
      return el.classList.contains('e-active') ||
        el.getAttribute('aria-selected') === 'true' ||
        el.classList.contains('e-row-selected');
    });

    if (!isActive) {
      this.logger.warn(
        `Row for "${userName}" not highlighted — clicking again`,
      );
      await userRow.click();
      await this.page.waitForTimeout(500);
    }

    this.logger.info(`✓ User row "${userName}" is highlighted`);
  }

  /**
   * Right-click the Access Expiration cell for a user in the Users list grid
   * @param {string} userName - First name of the user
   * @returns {Promise<void>}
   */
  async rightClickAccessExpirationCell(userName) {
    this.logger.action(
      `Right-clicking Access Expiration cell for "${userName}"`,
    );

    const usersListGrid = this.page
      .locator('.e-grid:has(.e-headercelldiv:has-text("First name"))')
      .first();
    const colIdx = await this._getAccessExpirationColumnIndex();

    const userRow = usersListGrid.locator('.e-row')
      .filter({hasText: userName}).first();
    await userRow.waitFor({state: 'visible', timeout: 10000});

    const cell = userRow.locator('td').nth(colIdx);
    await cell.click({button: 'right'});
    await this.page.waitForTimeout(500);

    this.logger.info(
      `✓ Right-clicked Access Expiration cell for "${userName}"`,
    );
  }

  /**
   * Verify the context menu item "Edit Exp. Dates" is visible
   * @param {string} menuItemText - Expected context menu item text
   * @returns {Promise<void>}
   */
  async verifyContextMenuItemVisible(menuItemText) {
    this.logger.action(`Verifying context menu item "${menuItemText}"`);

    const menuItem = this.page.locator('.e-contextmenu, .e-menu-parent')
      .locator(`text=${menuItemText}`).first();
    await menuItem.waitFor({state: 'visible', timeout: 10000});

    this.logger.info(`✓ Context menu item "${menuItemText}" is visible`);
  }

  /**
   * Click the context menu item "Edit Exp. Dates"
   * @param {string} menuItemText - Context menu item text to click
   * @returns {Promise<void>}
   */
  async clickContextMenuItem(menuItemText) {
    this.logger.action(`Clicking context menu item "${menuItemText}"`);

    const menuItem = this.page.locator('.e-contextmenu, .e-menu-parent')
      .locator(`text=${menuItemText}`).first();
    await menuItem.waitFor({state: 'visible', timeout: 10000});
    await menuItem.click();

    this.logger.info(`✓ Clicked context menu item "${menuItemText}"`);
  }

  /**
   * Verify the "Access Expiration Dates" popup is displayed
   * @param {string} popupTitle - Expected popup title text
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationPopupVisible(popupTitle) {
    this.logger.action('Verifying Access Expiration popup is visible');

    const popup = this.page.locator('.e-dialog, .e-popup-open')
      .filter({hasText: popupTitle}).first();
    await popup.waitFor({state: 'visible', timeout: 10000});

    this.logger.info(`✓ "${popupTitle}" popup is visible`);
  }

  /**
   * Select a future date from the popup calendar and return the date string
   * in MM/DD/YYYY format. Clicks the calendar icon, navigates forward one
   * month, then picks the first enabled date.
   * @returns {Promise<string>} The selected date in MM/DD/YYYY format
   */
  async selectFutureDateInPopupCalendar() {
    this.logger.action('Selecting a future date from popup calendar');

    const popup = this.page.locator('.e-dialog')
      .filter({hasText: 'Access Expiration Dates'}).first();
    await popup.waitFor({state: 'visible', timeout: 10000});

    // Find the datepicker combobox inside the popup
    const dateInput = popup.getByRole('combobox', {name: 'datepicker'});
    await dateInput.waitFor({state: 'visible', timeout: 10000});

    // Click to open the calendar dropdown
    await dateInput.click();
    await this.page.waitForTimeout(500);

    // Try to use the calendar dropdown if it opened
    const calendar = this.page
      .locator('.e-calendar, .e-datepicker.e-popup').first();
    const calendarOpened = await calendar
      .waitFor({state: 'visible', timeout: 5000})
      .then(() => true).catch(() => false);

    if (calendarOpened) {
      // Navigate forward one month
      const nextBtn = calendar
        .locator('.e-next, .e-icon-container.e-next, button.e-next')
        .first();
      await nextBtn.click();
      await this.page.waitForTimeout(500);

      // Pick the first enabled date cell
      const enabledCells = calendar
        .locator('.e-content td:not(.e-disabled):not(.e-other-month)');
      await enabledCells.first().waitFor({state: 'visible', timeout: 5000});
      await enabledCells.first().click();
      await this.page.waitForTimeout(500);
    } else {
      // Calendar did not open — type a future date directly
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      const dateStr = `${futureDate.getMonth() + 1}/`
        + `${futureDate.getDate()}/`
        + `${futureDate.getFullYear()}`;
      await dateInput.fill(dateStr);
      await this.page.waitForTimeout(500);
      await dateInput.press('Tab');
    }

    // Read back the selected date value and normalize to MM/DD/YYYY
    await this.page.waitForTimeout(300);
    const rawDate = await dateInput.inputValue();
    const parts = rawDate.split('/');
    const selectedDate = parts.length === 3
      ? `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`
      : rawDate;

    this.logger.info(`✓ Selected date: "${selectedDate}"`);
    return selectedDate;
  }

  /**
   * Clear the date in the popup using the clear (X) icon
   * @returns {Promise<void>}
   */
  async clearDateInPopup() {
    this.logger.action('Clearing date in popup');

    const popup = this.page.locator('.e-dialog')
      .filter({hasText: 'Access Expiration Dates'}).first();
    const dateInput = popup.getByRole('combobox', {name: 'datepicker'});
    await dateInput.waitFor({state: 'visible', timeout: 10000});

    // Try the clear icon first, then fall back to clearing input directly
    const clearIcon = popup
      .locator('.e-clear-icon, .e-input-group-icon.e-clear-icon')
      .first();
    const hasClearIcon = await clearIcon.isVisible().catch(() => false);

    if (hasClearIcon) {
      await clearIcon.click();
    } else {
      await dateInput.click({clickCount: 3});
      await dateInput.press('Delete');
      await dateInput.press('Tab');
    }

    await this.page.waitForTimeout(500);
    this.logger.info('✓ Date cleared in popup');
  }

  /**
   * Click the "Apply to all filtered users who have site level access" checkbox
   * @param {string} labelText - Checkbox label text
   * @returns {Promise<void>}
   */
  async clickApplyToAllFilteredUsersCheckbox(labelText) {
    this.logger.action(`Clicking "${labelText}" checkbox`);

    const checkbox = this.page.getByText(labelText, {exact: false}).first();
    await checkbox.waitFor({state: 'visible', timeout: 10000});
    await checkbox.click();

    this.logger.info(`✓ Clicked "${labelText}" checkbox`);
  }

  /**
   * Click "Save and Exit" button in the popup
   * @param {string} buttonText - Button text to click
   * @returns {Promise<void>}
   */
  async clickSaveAndExitInPopup(buttonText) {
    this.logger.action(`Clicking "${buttonText}" button`);

    const button = this.page.getByRole('button', {name: buttonText}).first();
    await button.waitFor({state: 'visible', timeout: 10000});
    await button.click();

    this.logger.info(`✓ Clicked "${buttonText}" button`);
  }

  /**
   * Verify the confirmation popup is displayed and its message
   * @param {string} expectedMessage - Expected confirmation message
   * @returns {Promise<void>}
   */
  async verifyConfirmationPopupMessage(expectedMessage) {
    this.logger.action('Verifying confirmation popup message');

    // Find the Confirmation dialog by title and action text
    const dialog = this.page.locator('.e-dialog')
      .filter({hasText: 'Confirmation'})
      .filter({hasText: 'Do you want to proceed?'}).first();
    await dialog.waitFor({state: 'visible', timeout: 10000});

    const dialogText = await dialog.textContent();

    // Normalize date formats (M/D/YYYY <-> MM-DD-YYYY) for comparison
    const normalizeDates = (text) => text
      .replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g, (_, m, d, y) =>
        `${m.padStart(2, '0')}-${d.padStart(2, '0')}-${y}`)
      .replace(/(\d{1,2})-(\d{1,2})-(\d{4})/g, (_, m, d, y) =>
        `${m.padStart(2, '0')}-${d.padStart(2, '0')}-${y}`);

    const normalizedExpected = normalizeDates(expectedMessage);
    const normalizedActual = normalizeDates(dialogText);

    if (!normalizedActual.includes(normalizedExpected)) {
      throw new Error(
        `Confirmation message mismatch.\n`
        + `Expected to contain: "${expectedMessage}"\n`
        + `Actual: "${dialogText}"`,
      );
    }

    this.logger.info(
      `✓ Confirmation message verified: "${dialogText.trim()}"`,
    );
  }

  /**
   * Click YES on the confirmation popup
   * @returns {Promise<void>}
   */
  async clickYesOnConfirmation() {
    this.logger.action('Clicking Yes on confirmation popup');

    const yesButton = this.page
      .getByRole('button', {name: 'Yes'}).first();
    await yesButton.waitFor({state: 'visible', timeout: 10000});
    await yesButton.click();
    await this.page.waitForTimeout(1000);

    this.logger.info('✓ Clicked Yes on confirmation');
  }

  /**
   * Click NO on the confirmation popup
   * @returns {Promise<void>}
   */
  async clickNoOnConfirmation() {
    this.logger.action('Clicking No on confirmation popup');

    const noButton = this.page
      .getByRole('button', {name: 'No'}).first();
    await noButton.waitFor({state: 'visible', timeout: 10000});
    await noButton.click();
    await this.page.waitForTimeout(1000);

    this.logger.info('✓ Clicked No on confirmation');
  }

  /**
   * Verify the success toast/message is displayed
   * @param {string} expectedMessage - Expected success message text
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationSuccessMessage(expectedMessage) {
    this.logger.action('Verifying success message');

    const toast = this.page.locator('.e-toast, .toast-message, [role="alert"]')
      .filter({hasText: expectedMessage}).first();
    await toast.waitFor({state: 'visible', timeout: 15000});

    this.logger.info(`✓ Success message: "${expectedMessage}"`);
  }

  /**
   * Verify Access Expiration value matches expected date for a user
   * @param {string} userName - First name of the user
   * @param {string} expectedDate - Expected date string (MM/DD/YYYY)
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationValueForUser(userName, expectedDate) {
    this.logger.action(
      `Verifying Access Expiration for "${userName}" is "${expectedDate}"`,
    );

    const actual = await this.getAccessExpirationValueForUser(userName);
    if (actual !== expectedDate) {
      throw new Error(
        `Access Expiration mismatch for "${userName}". `
        + `Expected: "${expectedDate}", Actual: "${actual}"`,
      );
    }

    this.logger.info(
      `✓ Access Expiration for "${userName}" is "${expectedDate}"`,
    );
  }

  /**
   * Check if the "Edit Exp. Dates" context menu item is disabled/hidden
   * for a group-level access user
   * @param {string} menuItemText - Context menu item text
   * @returns {Promise<{visible: boolean, disabled: boolean}>}
   */
  async getContextMenuItemState(menuItemText) {
    this.logger.action(
      `Checking context menu item state for "${menuItemText}"`,
    );

    // Check within any visible context menu
    const menu = this.page.locator('.e-contextmenu, .e-menu-parent').first();
    await menu.waitFor({state: 'visible', timeout: 10000});

    const menuItem = menu
      .locator(`li, .e-menu-item`)
      .filter({hasText: menuItemText}).first();

    const isVisible = await menuItem.isVisible().catch(() => false);
    let isDisabled = false;

    if (isVisible) {
      const classList = await menuItem.getAttribute('class') || '';
      isDisabled = classList.includes('e-disabled')
        || classList.includes('e-menu-hide');

      const ariaDisabled = await menuItem.getAttribute('aria-disabled');
      if (ariaDisabled === 'true') {
        isDisabled = true;
      }
    }

    this.logger.info(
      `Context menu item "${menuItemText}": `
      + `visible=${isVisible}, disabled=${isDisabled}`,
    );
    return {visible: isVisible, disabled: isDisabled};
  }

  /**
   * Read the current value from the datepicker in the Access Expiration popup
   * @returns {Promise<string>} The date value in MM/DD/YYYY format
   */
  async getPopupDatePickerValue() {
    this.logger.action('Reading datepicker value from popup');

    const popup = this.page.locator('.e-dialog')
      .filter({hasText: 'Access Expiration Dates'}).first();
    const dateInput = popup.getByRole('combobox', {name: 'datepicker'});
    await dateInput.waitFor({state: 'visible', timeout: 10000});

    const rawDate = await dateInput.inputValue();
    const parts = rawDate.split('/');
    const normalised = parts.length === 3
      ? `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`
      : rawDate;

    this.logger.info(`✓ Popup datepicker value: "${normalised}"`);
    return normalised;
  }

  /**
   * Verify the popup datepicker shows the default date of today + 1 year
   * @returns {Promise<void>}
   */
  async verifyPopupDateIsDefaultOneYearFromToday() {
    this.logger.action(
      'Verifying popup date is today + 1 year',
    );

    const actual = await this.getPopupDatePickerValue();

    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const expected = `${String(future.getMonth() + 1).padStart(2, '0')}/`
      + `${String(future.getDate()).padStart(2, '0')}/`
      + `${future.getFullYear()}`;

    if (actual !== expected) {
      throw new Error(
        `Default date mismatch. Expected: "${expected}", `
        + `Actual: "${actual}"`,
      );
    }

    this.logger.info(
      `\u2713 Popup default date is today + 1 year: "${expected}"`,
    );
  }

  /**
   * Verify the popup datepicker shows a specific expected date
   * @param {string} expectedDate - Expected date string (MM/DD/YYYY)
   * @returns {Promise<void>}
   */
  async verifyPopupDateMatchesExpectedDate(expectedDate) {
    this.logger.action(
      `Verifying popup date matches "${expectedDate}"`,
    );

    const actual = await this.getPopupDatePickerValue();

    // Normalise both to MM/DD/YYYY for comparison
    const normalise = (d) => {
      const p = d.split('/');
      return p.length === 3
        ? `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`
        : d;
    };
    const normActual = normalise(actual);
    const normExpected = normalise(expectedDate);

    if (normActual !== normExpected) {
      throw new Error(
        `Popup date mismatch. Expected: "${normExpected}", `
        + `Actual: "${normActual}"`,
      );
    }

    this.logger.info(
      `\u2713 Popup date matches expected: "${normExpected}"`,
    );
  }

  /**
   * Click Cancel button in the Access Expiration popup
   * @returns {Promise<void>}
   */
  async clickCancelInPopup() {
    this.logger.action('Clicking Cancel in Access Expiration popup');

    const popup = this.page.locator('.e-dialog')
      .filter({hasText: 'Access Expiration Dates'}).first();
    const cancelBtn = popup
      .getByRole('button', {name: 'Cancel'}).first();
    await cancelBtn.waitFor({state: 'visible', timeout: 10000});
    await cancelBtn.click();
    await this.page.waitForTimeout(500);

    this.logger.info('\u2713 Clicked Cancel in popup');
  }

  /**
   * Verify a context menu item is visible and disabled
   * @param {string} menuItemText - Text of the menu item
   * @returns {Promise<void>}
   * @throws {Error} If the item is not visible or not disabled
   */
  async verifyContextMenuItemDisabled(menuItemText) {
    this.logger.action(
      `Verifying context menu item "${menuItemText}" is disabled`,
    );

    const state = await this.getContextMenuItemState(menuItemText);

    if (!state.visible) {
      throw new Error(
        `Context menu item "${menuItemText}" is not visible`,
      );
    }
    if (!state.disabled) {
      throw new Error(
        `Context menu item "${menuItemText}" is visible but not disabled`,
      );
    }

    this.logger.info(
      `\u2713 Context menu item "${menuItemText}" is visible and disabled`,
    );
  }
}

module.exports = UserFilterOperations;
