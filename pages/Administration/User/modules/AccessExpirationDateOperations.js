const BasePage = require('../../../basePage');
const helper = require('../../../../utils/helper');
const LOCATORS = require('../../../constants/administrationUserPage.constants');

const { columnHeaders: COLUMN_HEADERS } = LOCATORS;

/**
 * Access Expiration Date Operations Module
 * Handles all operations related to editing, setting, and verifying access expiration dates
 */
class AccessExpirationDateOperations extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Edit Access Expiration Date cell by double-clicking
   * @param {string} siteName - Site name
   * @returns {Promise<void>}
   */
  async editAccessExpirationDateCell(siteName) {
    this.logger.action(`Double-clicking Access Expiration Date cell for site: ${siteName}`);

    // Find the correct grid with Access Expiration column
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let expirationColumnIndex = -1;
    let correctGridIndex = -1;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      let hasAccessStatus = false;
      let hasAccessExpiration = false;
      let tempExpirationIndex = 0; // Count only visible columns
      let visibleColumnIndex = 0;

      for (let i = 0; i < headerCount; i++) {
        const header = headers.nth(i);
        const headerText = await header.textContent();
        const headerClass = await header.getAttribute('class').catch(() => '');
        
        // Skip hidden columns
        if (headerClass && headerClass.includes('e-hide')) {
          continue;
        }
        
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
        }
        if (headerText && (headerText.includes('Access Expiration Date') || headerText.includes('Access Expiration'))) {
          hasAccessExpiration = true;
          tempExpirationIndex = visibleColumnIndex;
        }
        
        visibleColumnIndex++; // Increment only for visible columns
      }

      if (hasAccessStatus && hasAccessExpiration) {
        expirationColumnIndex = tempExpirationIndex;
        correctGridIndex = gridIndex;
        break;
      }
    }

    if (expirationColumnIndex === -1 || correctGridIndex === -1) {
      throw new Error('Site Access grid not found');
    }

    // Find the row with the site name and get the expiration date cell
    const correctGrid = allGrids.nth(correctGridIndex);
    const siteRow = correctGrid.locator('.e-row').filter({ hasText: siteName }).first();
    await siteRow.waitFor({ state: 'visible', timeout: 10000 });

    // Get only visible cells (exclude cells with e-hide class)
    const expirationCell = siteRow.locator(`td:not(.e-hide)`).nth(expirationColumnIndex);

    // Double-click to enable editing
    await expirationCell.dblclick();

    // Wait for datepicker input to be visible and editable (indicating edit mode is active)
    const dateInput = this.page.locator('.e-input-group input.e-input, input[role="combobox"]').first();
    await dateInput.waitFor({ state: 'visible', timeout: 10000 });
    await dateInput.waitFor({ state: 'attached', timeout: 5000 });

    // Verify input is editable (not disabled)
    const isDisabled = await dateInput.isDisabled().catch(() => false);
    if (isDisabled) {
      throw new Error('Date input is disabled, cannot edit');
    }

    this.logger.info('✓ Access Expiration Date cell is now in edit mode');
  }

  /**
   * Clear the Access Expiration Date by filling input with empty string
   * @param {string} siteName - Site name to clear expiration for
   * @param {Object} waitForGridStabilization - Function reference to wait for grid stabilization
   * @returns {Promise<void>}
   */
  async clearAccessExpirationDate(siteName, waitForGridStabilization) {
    this.logger.action(`Clearing Access Expiration Date for site: ${siteName}`);

    // Wait for grid to stabilize before clearing
    if (waitForGridStabilization) {
      await waitForGridStabilization();
    }

    // Double-click to enable editing
    await this.editAccessExpirationDateCell(siteName);
    await this.page.waitForTimeout(1000);

    // Click the close button to clear the date
    const closeButton = this.page.getByRole('button', { name: 'close' });
    await closeButton.click();
    await this.page.waitForTimeout(500);

    this.logger.info('✓ Access Expiration Date cleared');
  }

  /**
   * Clear access expiration date with retry logic for reliability
   * @param {string} siteName - Site name
   * @param {number} maxRetries - Maximum retry attempts (default: 3)
   * @param {Object} waitForGridStabilization - Function reference to wait for grid stabilization
   * @returns {Promise<void>}
   */
  async clearAccessExpirationDateWithRetry(siteName, maxRetries, waitForGridStabilization) {
    const retries = maxRetries || 3;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.info(`Attempt ${attempt}/${retries} to clear expiration date for "${siteName}"`);

        // Ensure grid is stabilized before operation
        if (waitForGridStabilization) {
          await waitForGridStabilization();
        }

        // Try to clear the date
        await this.clearAccessExpirationDate(siteName, waitForGridStabilization);

        this.logger.info(`✓ Successfully cleared expiration date on attempt ${attempt}`);
        return; // Success
      } catch (error) {
        this.logger.warn(`Attempt ${attempt} failed: ${error.message}`);

        if (attempt < retries) {
          // Wait before retry
          await this.page.waitForTimeout(2000);

          // Try to refresh the grid state
          // Intentionally suppress timeout - DOM load state is optimal but not required
          await this.page.waitForLoadState('domcontentloaded').catch(() => {});
        } else {
          throw new Error(`Failed to clear expiration date after ${retries} attempts: ${error.message}`);
        }
      }
    }
  }

  /**
   * Verify that Access Expiration Date is empty/cleared for a site
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateIsEmpty(siteName) {
    this.logger.action(`Verifying Access Expiration Date is empty for site: ${siteName}`);

    // Wait for grid to stabilize
    await this.page.waitForTimeout(1000);
    await this.page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout: 10000 });

    // Find the correct grid with Access Expiration column
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let expirationColumnIndex = -1;
    let correctGridIndex = -1;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      let hasAccessStatus = false;
      let hasAccessExpiration = false;
      let tempExpirationIndex = -1;

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
        }
        if (headerText && (headerText.includes('Access Expiration Date') || headerText.includes('Access Expiration'))) {
          hasAccessExpiration = true;
          tempExpirationIndex = i;
        }
      }

      if (hasAccessStatus && hasAccessExpiration) {
        expirationColumnIndex = tempExpirationIndex;
        correctGridIndex = gridIndex;
        break;
      }
    }

    if (expirationColumnIndex === -1 || correctGridIndex === -1) {
      throw new Error('Site Access grid not found');
    }

    // Find the row with the site name and get the expiration date cell
    const correctGrid = allGrids.nth(correctGridIndex);
    const siteRow = correctGrid.locator('.e-row').filter({ hasText: siteName }).first();
    await siteRow.waitFor({ state: 'visible', timeout: 15000 });

    const cells = siteRow.locator('td');
    const expirationCell = cells.nth(expirationColumnIndex);

    // Get the text content and verify it's empty or contains only whitespace
    const expirationText = await expirationCell.textContent();
    const cleanedText = expirationText.replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim();

    if (cleanedText !== '') {
      throw new Error(`Access Expiration Date is not empty. Actual: ${cleanedText}`);
    }

    this.logger.info('✓ Access Expiration Date is empty');
  }

  /**
   * Get Access Expiration Date for a site
   * @param {string} siteName - Site name
   * @returns {Promise<string>} Expiration date text
   */
  async getAccessExpirationDate(siteName) {
    this.logger.action(`Getting Access Expiration Date for site: ${siteName}`);

    // Find the correct grid by looking for one that has BOTH "Access Status" AND "Access Expiration" columns
    // This uniquely identifies the Site Access grid (not Site List grid or User grid)
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let expirationColumnIndex = -1;
    let correctGridIndex = -1;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      let hasAccessStatus = false;
      let hasAccessExpiration = false;
      let tempExpirationIndex = -1;

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
        }
        if (headerText && (headerText.includes('Access Expiration Date') || headerText.includes('Access Expiration'))) {
          hasAccessExpiration = true;
          tempExpirationIndex = i;
        }
      }

      // Only use this grid if it has BOTH columns
      if (hasAccessStatus && hasAccessExpiration) {
        expirationColumnIndex = tempExpirationIndex;
        correctGridIndex = gridIndex;
        this.logger.info(`Found Site Access grid at index ${gridIndex}, Access Expiration at column ${tempExpirationIndex}`);
        break;
      }
    }

    if (expirationColumnIndex === -1 || correctGridIndex === -1) {
      throw new Error('Site Access grid (with both Access Status and Access Expiration columns) not found');
    }

    // Find the row with the site name within the correct grid
    const correctGrid = allGrids.nth(correctGridIndex);
    const siteRow = correctGrid.locator('.e-row').filter({ hasText: siteName }).first();
    await siteRow.waitFor({ state: 'visible', timeout: 10000 });

    // Get the cell at the expiration column index
    const cells = siteRow.locator('td');
    const expirationCell = cells.nth(expirationColumnIndex);
    const expirationDate = await expirationCell.textContent();

    // Remove all whitespace including zero-width spaces
    const cleanedDate = expirationDate.replace(/[\s\u200B-\u200D\uFEFF]/g, ' ').trim();

    this.logger.info(`✓ Access Expiration Date: ${cleanedDate}`);
    return cleanedDate;
  }

  /**
   * Verify Access Expiration Date is Today + 1 Year (Pacific Time)
   * @param {string} siteName - Site name to verify expiration date for
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateIsOneYearFromToday(siteName) {
    this.logger.action('Verifying Access Expiration Date is Today + 1 Year (Pacific Time)');

    const expirationDate = await this.getAccessExpirationDate(siteName);

    // Calculate expected date (Today + 1 Year in Pacific Time)
    const expectedDate = helper.getDatePlusOneYearPacific();

    if (expirationDate !== expectedDate) {
      throw new Error(`Access Expiration Date mismatch. Expected: ${expectedDate}, Actual: ${expirationDate}`);
    }

    this.logger.info(`✓ Access Expiration Date is correct: ${expirationDate} (Today + 1 Year)`);
  }

  /**
   * Change permission module to a random value
   * @returns {Promise<string>} - Selected module name
   */
  async changePermissionModuleToRandom() {
    this.logger.action('Changing permission module to random value');

    // Locate the Permissions for Module dropdown
    const dropdown = this.page.locator('label:has-text("Permissions for Module")').locator('..').locator('select, .e-dropdownlist, input').first();
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });

    // Click to open dropdown
    await dropdown.click();
    await this.page.waitForTimeout(1000);

    // Get all dropdown list items excluding "MAINT" option
    const allItems = this.page.locator('.e-list-item').filter({ hasNotText: /^$/ });
    await allItems.first().waitFor({ state: 'visible', timeout: 5000 });

    // Filter out MAINT option
    const filteredItems = [];
    const totalCount = await allItems.count();

    for (let i = 0; i < totalCount; i++) {
      const itemText = await allItems.nth(i).textContent();
      const trimmedText = itemText.trim();
      if (trimmedText && !trimmedText.includes('MAINT')) {
        filteredItems.push(i);
      }
    }

    if (filteredItems.length === 0) {
      throw new Error('No items found in Permissions for Module dropdown (excluding MAINT)');
    }

    // Select a random item from filtered list
    const randomIndex = filteredItems[Math.floor(Math.random() * filteredItems.length)];
    const selectedItem = allItems.nth(randomIndex);
    const selectedText = await selectedItem.textContent();

    await selectedItem.click();
    await this.page.waitForTimeout(500);

    this.logger.info(`✓ Selected permission module: ${selectedText.trim()}`);
    return selectedText.trim();
  }

  /**
   * Verify expiration date remains Today + 1 Year after changing permission module
   * @param {string} siteName - Site name to verify
   * @param {number} iterations - Number of times to change and verify (default: 3)
   * @returns {Promise<void>}
   */
  async verifyExpirationDateRemainsAfterModuleChange(siteName, iterations) {
    const numIterations = iterations || 3;
    this.logger.action(`Verifying expiration date remains Today + 1 Year after ${numIterations} module changes`);

    const expectedDate = helper.getDatePlusOneYearPacific();

    for (let i = 1; i <= numIterations; i++) {
      this.logger.info(`Iteration ${i}/${numIterations}`);

      // Change permission module
      const selectedModule = await this.changePermissionModuleToRandom();

      // Wait for any updates to complete
      await this.page.waitForTimeout(1000);
      // Intentionally suppress timeout - networkidle state is optimal but not required
      await this.page.waitForLoadState('networkidle').catch(() => {});

      // Verify expiration date
      const currentDate = await this.getAccessExpirationDate(siteName);

      if (currentDate !== expectedDate) {
        throw new Error(`Expiration date changed after selecting "${selectedModule}". Expected: ${expectedDate}, Actual: ${currentDate}`);
      }

      this.logger.info(`✓ Iteration ${i}: Expiration date remains ${expectedDate} after selecting "${selectedModule}"`);
    }

    this.logger.info(`✓ Verified expiration date remained Today + 1 Year across ${numIterations} permission module changes`);
  }

  /**
   * Set Access Expiration Date to yesterday (to create expired status)
   * @param {string} siteName - Site name to set expiration for
   * @returns {Promise<void>}
   */
  async setAccessExpirationDateToYesterday(siteName) {
    this.logger.action(`Setting Access Expiration Date to yesterday for site: ${siteName}`);

    // Get yesterday's date in Pacific Time
    const pacificTime = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const yesterday = new Date(pacificTime);
    yesterday.setDate(yesterday.getDate() - 1);

    const month = yesterday.getMonth() + 1;
    const day = yesterday.getDate();
    const year = yesterday.getFullYear();

    this.logger.info(`Setting expiration date to: ${month}/${day}/${year} (yesterday)`);

    // Double-click to enable editing
    await this.editAccessExpirationDateCell(siteName);

    // Wait for date picker to be ready
    await this.page.waitForTimeout(2000);

    // Select all and type the new date (this works better than fill)
    await this.page.keyboard.press('Control+A');
    await this.page.waitForTimeout(300);
    await this.page.keyboard.type(`${month}/${day}/${year}`);
    await this.page.waitForTimeout(500);

    // Press Enter to confirm
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);

    this.logger.info(`✓ Access Expiration Date set to yesterday: ${month}/${day}/${year}`);
  }

  /**
   * Verify expiration date is not before today
   * @param {string} siteName - Site name to verify
   * @param {number} todayDate - Today's date number
   * @returns {Promise<void>}
   */
  async verifyExpirationDateIsNotBeforeToday(siteName, todayDate) {
    this.logger.action('Verifying expiration date is not before today');

    const expirationDate = await this.getAccessExpirationDate(siteName);

    let expirationDay;

    // Try to parse MM/DD/YYYY format first (e.g., "02/13/2026")
    const mmddyyyyMatch = expirationDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mmddyyyyMatch) {
      expirationDay = parseInt(mmddyyyyMatch[2], 10);
    } else {
      // Try Month Day, Year format (e.g., "Feb 13, 2026")
      const monthDayYearMatch = expirationDate.match(/(\w+)\s+(\d+),\s+(\d+)/);
      if (monthDayYearMatch) {
        expirationDay = parseInt(monthDayYearMatch[2], 10);
      } else {
        throw new Error(`Unable to parse expiration date: ${expirationDate}`);
      }
    }

    if (expirationDay < todayDate) {
      throw new Error(`Expiration date ${expirationDate} (day ${expirationDay}) is before today (day ${todayDate})`);
    }

    this.logger.info(`✓ Expiration date ${expirationDate} is not before today`);
  }

  /**
   * Set Access Expiration Date to today's date
   * @param {string} siteName - Site name
   * @param {Function} openExpirationDateCalendar - Function to open calendar
   * @param {Function} clickTodayInCalendar - Function to click today button
   * @returns {Promise<void>}
   */
  async setAccessExpirationDateToToday(siteName, openExpirationDateCalendar, clickTodayInCalendar) {
    this.logger.action(`Setting Access Expiration Date to today for site: ${siteName}`);

    await this.editAccessExpirationDateCell(siteName);
    await openExpirationDateCalendar();
    await clickTodayInCalendar();

    this.logger.info('✓ Access Expiration Date set to today');
  }

  /**
   * Verify Access Expiration Date is today's date
   * @param {string} siteName - Site name
   * @param {Function} verifyAccessExpirationDateExists - Function to verify date exists
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateIsToday(siteName, verifyAccessExpirationDateExists) {
    this.logger.action(`Verifying Access Expiration Date is today for site: ${siteName}`);

    const today = new Date();
    const expectedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;

    await verifyAccessExpirationDateExists(siteName, expectedDate);

    this.logger.info(`✓ Access Expiration Date is today: ${expectedDate}`);
  }

  /**
   * Set Access Expiration Date to specific days from today
   * @param {string} siteName - Site name
   * @param {number} daysFromToday - Number of days from today (negative for past dates)
   * @param {Function} openExpirationDateCalendar - Function to open calendar
   * @param {Function} clickTodayInCalendar - Function to click today button
   * @param {Function} clickDateInCalendar - Function to click specific date
   * @returns {Promise<void>}
   */
  async setAccessExpirationDate(siteName, daysFromToday, openExpirationDateCalendar, clickTodayInCalendar, clickDateInCalendar) {
    this.logger.action(`Setting Access Expiration Date to Today+${daysFromToday} for site: ${siteName}`);

    // Double-click to enable editing
    await this.editAccessExpirationDateCell(siteName);

    // Open calendar
    await openExpirationDateCalendar();

    // Click Today to establish context
    await clickTodayInCalendar();

    // Reopen calendar to select target date
    await this.editAccessExpirationDateCell(siteName);
    await openExpirationDateCalendar();

    // Select date
    await clickDateInCalendar(daysFromToday);

    this.logger.info(`✓ Access Expiration Date set to Today+${daysFromToday}`);
  }

  /**
   * Verify that Access Expiration Date cell contains a date value
   * @param {string} siteName - Site name
   * @param {string} expectedDate - Expected date text (e.g., "02/18/2026" or "Feb 18, 2026")
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateExists(siteName, expectedDate) {
    this.logger.action(`Verifying Access Expiration Date exists for site: ${siteName}`);

    // Find the correct grid with Access Expiration column
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let expirationColumnIndex = -1;
    let correctGridIndex = -1;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      let hasAccessStatus = false;
      let hasAccessExpiration = false;
      let tempExpirationIndex = -1;

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
        }
        if (headerText && (headerText.includes('Access Expiration Date') || headerText.includes('Access Expiration'))) {
          hasAccessExpiration = true;
          tempExpirationIndex = i;
        }
      }

      if (hasAccessStatus && hasAccessExpiration) {
        expirationColumnIndex = tempExpirationIndex;
        correctGridIndex = gridIndex;
        break;
      }
    }

    if (expirationColumnIndex === -1 || correctGridIndex === -1) {
      throw new Error('Site Access grid not found');
    }

    // Find the row with the site name and get the expiration date cell
    const correctGrid = allGrids.nth(correctGridIndex);
    const siteRow = correctGrid.locator('.e-row').filter({ hasText: siteName }).first();
    await siteRow.waitFor({ state: 'visible', timeout: 10000 });

    const cells = siteRow.locator('td');
    const expirationCell = cells.nth(expirationColumnIndex);
    const cellText = await expirationCell.textContent();
    const trimmedText = cellText.trim();

    if (trimmedText === '' || trimmedText === '-') {
      throw new Error(`Access Expiration Date is empty for site: ${siteName}`);
    }

    // If expected date is provided, verify it matches
    if (expectedDate) {
      if (!trimmedText.includes(expectedDate)) {
        throw new Error(`Access Expiration Date mismatch. Expected: ${expectedDate}, Actual: ${trimmedText}`);
      }
      this.logger.info(`✓ Access Expiration Date verified: ${trimmedText}`);
    } else {
      this.logger.info(`✓ Access Expiration Date exists: ${trimmedText}`);
    }
  }

  /**
   * Get date value from Access Expiration column
   * @param {Function} _findAccessExpirationHeader - Function to find header
   * @param {Function} _findDateValuesAfterIndex - Function to find date values
   * @returns {Promise<string>} Access expiration date value
   */
  async getAccessExpirationDateValue(_findAccessExpirationHeader, _findDateValuesAfterIndex) {
    this.logger.action('Getting date value from Access Expiration column');

    try {
      const headerIndex = await _findAccessExpirationHeader();
      const dateDivs = await _findDateValuesAfterIndex(headerIndex);

      if (dateDivs.length === 0) {
        throw new Error('No date value found in Access Expiration column');
      }

      const ACCESS_EXPIRATION_DATE_INDEX = 3;
      const dateIndex = Math.min(ACCESS_EXPIRATION_DATE_INDEX, dateDivs.length - 1);
      const accessExpirationDate = dateDivs[dateIndex].value;

      this.logger.info(`✓ Access Expiration date value: ${accessExpirationDate}`);
      return accessExpirationDate;
    } catch (error) {
      this.logger.error(`Failed to get Access Expiration date: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AccessExpirationDateOperations;
