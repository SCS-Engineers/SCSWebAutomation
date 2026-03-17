const logger = require('../../../../utils/logger');

/**
 * Access Status Verification Operations Module
 * Handles all access status verification operations including color validation
 */
class AccessStatusVerificationOperations {
  constructor(page) {
    this.page = page;
    this.logger = logger;
  }

  /**
   * Verify Access Status is Active (simple text check)
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status from facade
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsActive(siteName, getAccessStatusFn) {
    this.logger.action('Verifying Access Status is Active');

    const accessStatus = await getAccessStatusFn(siteName);

    if (accessStatus !== 'Active') {
      throw new Error(`Access Status is not Active. Actual: ${accessStatus}`);
    }

    this.logger.info('✓ Access Status is Active');
  }

  /**
   * Verify Access Status is Active with green background
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status from facade
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsActiveWithColor(siteName, getAccessStatusFn) {
    this.logger.action('Verifying Access Status is "Active" with green background');

    // Get access status text
    const accessStatus = await getAccessStatusFn(siteName);

    if (accessStatus !== 'Active') {
      throw new Error(`Access Status is not "Active". Actual: ${accessStatus}`);
    }

    this.logger.info('✓ Access Status text is "Active"');

    // Find the correct grid with Access Status column
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let statusCell = null;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      let hasAccessStatus = false;
      let statusColumnIndex = -1;

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
          statusColumnIndex = i;
          break;
        }
      }

      if (hasAccessStatus) {
        // Find the row for this site
        const rows = grid.locator('.e-row');
        const rowCount = await rows.count();

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
          const row = rows.nth(rowIndex);
          const cells = row.locator('td');
          const cellCount = await cells.count();

          // Check if this row contains the site name
          let foundSite = false;
          for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
            const cellText = await cells.nth(cellIndex).textContent();
            if (cellText && cellText.trim() === siteName) {
              foundSite = true;
              break;
            }
          }

          if (foundSite && statusColumnIndex < cellCount) {
            statusCell = cells.nth(statusColumnIndex);
            break;
          }
        }

        if (statusCell) {
          break;
        }
      }
    }

    if (!statusCell) {
      throw new Error(`Could not find Access Status cell for site: ${siteName}`);
    }

    // Look for the div element with "Active" text that has the green background
    const activeDiv = statusCell.locator('div:has-text("Active")');
    const hasDivElement = await activeDiv.count() > 0;

    let backgroundColor;
    let textColor;

    if (hasDivElement) {
      // Check the div element with "Active" text
      backgroundColor = await activeDiv.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      this.logger.info(`Access Status div background color: ${backgroundColor}`);

      textColor = await activeDiv.evaluate((el) => window.getComputedStyle(el).color);
      this.logger.info(`Access Status div text color: ${textColor}`);
    } else {
      // Fallback: check any inner element or the cell itself
      const innerElement = statusCell.locator('*').first();
      const hasInnerElement = await innerElement.count() > 0;

      if (hasInnerElement) {
        backgroundColor = await innerElement.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        this.logger.info(`Access Status inner element background color: ${backgroundColor}`);

        textColor = await innerElement.evaluate((el) => window.getComputedStyle(el).color);
      } else {
        backgroundColor = await statusCell.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        this.logger.info(`Access Status cell background color: ${backgroundColor}`);

        textColor = await statusCell.evaluate((el) => window.getComputedStyle(el).color);
      }
    }

    // Green color variants: rgb(0, 128, 0), rgb(40, 167, 69), rgb(76, 175, 80), rgb(46, 125, 50), rgb(67, 160, 71), rgb(56, 142, 60)
    const isGreen = backgroundColor.includes('rgb(0, 128, 0)')
                    || backgroundColor.includes('rgb(40, 167, 69)')
                    || backgroundColor.includes('rgb(76, 175, 80)')
                    || backgroundColor.includes('rgb(46, 125, 50)')
                    || backgroundColor.includes('rgb(67, 160, 71)')
                    || backgroundColor.includes('rgb(56, 142, 60)')
                    || backgroundColor.includes('rgb(34, 139, 34)')
                    || backgroundColor.includes('rgb(0, 150, 0)')
                    || backgroundColor.match(/rgb\([0-9]{1,2},\s*1[2-6][0-9],\s*[0-9]{1,2}\)/)
                    || backgroundColor.match(/rgb\([3-7][0-9],\s*1[4-7][0-9],\s*[5-8][0-9]\)/);

    if (!isGreen) {
      throw new Error(`Access Status background color is not green. Actual: ${backgroundColor}`);
    }

    this.logger.info('✓ Access Status has green background color');

    // Verify text color is visible (white or light color)
    this.logger.info(`Access Status text color: ${textColor}`);

    // White or light color
    const isLightColor = textColor.includes('rgb(255, 255, 255)')
                         || textColor.includes('rgb(248, 249, 250)')
                         || textColor.includes('white')
                         || textColor.match(/rgb\(2[4-5][0-9],\s*2[4-5][0-9],\s*2[4-5][0-9]\)/);

    if (!isLightColor) {
      this.logger.warn(`Access Status text color may not be optimal for readability. Color: ${textColor}`);
    } else {
      this.logger.info('✓ Access Status has light text color (white or near-white)');
    }

    this.logger.info('✓ Access Status is "Active" with green background and visible text');
  }

  /**
   * Verify Access Status is Expired with red background
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status from facade
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsExpired(siteName, getAccessStatusFn) {
    this.logger.action('Verifying Access Status is Expired with red background');

    // Get access status text
    const accessStatus = await getAccessStatusFn(siteName);

    if (accessStatus !== 'Expired') {
      throw new Error(`Access Status is not Expired. Actual: ${accessStatus}`);
    }

    this.logger.info('✓ Access Status text is "Expired"');

    // Find the correct grid with Access Status column
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let statusCell = null;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      let hasAccessStatus = false;
      let statusColumnIndex = -1;

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
          statusColumnIndex = i;
          break;
        }
      }

      if (hasAccessStatus) {
        // Find the row for this site
        const rows = grid.locator('.e-row');
        const rowCount = await rows.count();

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
          const row = rows.nth(rowIndex);
          const cells = row.locator('td');
          const cellCount = await cells.count();

          // Check if this row contains the site name
          let foundSite = false;
          for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
            const cellText = await cells.nth(cellIndex).textContent();
            if (cellText && cellText.trim() === siteName) {
              foundSite = true;
              break;
            }
          }

          if (foundSite && statusColumnIndex < cellCount) {
            statusCell = cells.nth(statusColumnIndex);
            break;
          }
        }

        if (statusCell) {
          break;
        }
      }
    }

    if (!statusCell) {
      throw new Error(`Could not find Access Status cell for site: ${siteName}`);
    }

    // Look for the div element with "Expired" text that has the red background
    const expiredDiv = statusCell.locator('div:has-text("Expired")');
    const hasDivElement = await expiredDiv.count() > 0;

    let backgroundColor;
    let textColor;

    if (hasDivElement) {
      // Check the div element with "Expired" text
      backgroundColor = await expiredDiv.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      this.logger.info(`Access Status div background color: ${backgroundColor}`);

      textColor = await expiredDiv.evaluate((el) => window.getComputedStyle(el).color);
      this.logger.info(`Access Status div text color: ${textColor}`);
    } else {
      // Fallback: check any inner element or the cell itself
      const innerElement = statusCell.locator('*').first();
      const hasInnerElement = await innerElement.count() > 0;

      if (hasInnerElement) {
        backgroundColor = await innerElement.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        this.logger.info(`Access Status inner element background color: ${backgroundColor}`);

        textColor = await innerElement.evaluate((el) => window.getComputedStyle(el).color);
      } else {
        backgroundColor = await statusCell.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        this.logger.info(`Access Status cell background color: ${backgroundColor}`);

        textColor = await statusCell.evaluate((el) => window.getComputedStyle(el).color);
      }
    }

    // Red color should be rgb(255, 0, 0) or similar red variant
    // Common red variants: rgb(255, 0, 0), rgb(220, 53, 69), rgb(255, 99, 71), rgb(244, 67, 54), rgb(213, 0, 0), rgb(198, 40, 40)
    const isRed = backgroundColor.includes('rgb(255, 0, 0)')
                  || backgroundColor.includes('rgb(220, 53, 69)')
                  || backgroundColor.includes('rgb(255, 99, 71)')
                  || backgroundColor.includes('rgb(244, 67, 54)')
                  || backgroundColor.includes('rgb(213, 0, 0)')
                  || backgroundColor.includes('rgb(198, 40, 40)')
                  || backgroundColor.match(/rgb\(2[2-5][0-9],\s*[0-9]{1,2},\s*[0-9]{1,2}\)/);

    if (!isRed) {
      throw new Error(`Access Status background color is not red. Actual: ${backgroundColor}`);
    }

    this.logger.info('✓ Access Status has red background color');

    // Verify text color is visible (white or light color)
    this.logger.info(`Access Status text color: ${textColor}`);

    // White or light color should be rgb(255, 255, 255) or similar
    const isLightColor = textColor.includes('rgb(255, 255, 255)')
                         || textColor.includes('rgb(248, 249, 250)')
                         || textColor.includes('white')
                         || textColor.match(/rgb\(2[4-5][0-9],\s*2[4-5][0-9],\s*2[4-5][0-9]\)/);

    if (!isLightColor) {
      this.logger.warn(`Access Status text color may not be optimal for readability. Color: ${textColor}`);
    } else {
      this.logger.info('✓ Access Status has light text color (white or near-white)');
    }

    this.logger.info('✓ Access Status is "Expired" with red background and visible text');
  }

  /**
   * Verify Access Status is Expiring Soon with orange background
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status from facade
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsExpiringSoon(siteName, getAccessStatusFn) {
    this.logger.action('Verifying Access Status is "Expiring Soon" with orange background');

    // Get access status text
    const accessStatus = await getAccessStatusFn(siteName);

    if (accessStatus !== 'Expiring Soon') {
      throw new Error(`Access Status is not "Expiring Soon". Actual: ${accessStatus}`);
    }

    this.logger.info('✓ Access Status text is "Expiring Soon"');

    // Find the correct grid with Access Status column
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let statusCell = null;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      let hasAccessStatus = false;
      let statusColumnIndex = -1;

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
          statusColumnIndex = i;
          break;
        }
      }

      if (hasAccessStatus) {
        // Find the row for this site
        const rows = grid.locator('.e-row');
        const rowCount = await rows.count();

        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
          const row = rows.nth(rowIndex);
          const cells = row.locator('td');
          const cellCount = await cells.count();

          // Check if this row contains the site name
          let foundSite = false;
          for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
            const cellText = await cells.nth(cellIndex).textContent();
            if (cellText && cellText.trim() === siteName) {
              foundSite = true;
              break;
            }
          }

          if (foundSite && statusColumnIndex < cellCount) {
            statusCell = cells.nth(statusColumnIndex);
            break;
          }
        }

        if (statusCell) {
          break;
        }
      }
    }

    if (!statusCell) {
      throw new Error(`Could not find Access Status cell for site: ${siteName}`);
    }

    // Look for the div element with "Expiring Soon" text that has the orange background
    const expiringDiv = statusCell.locator('div:has-text("Expiring Soon")');
    const hasDivElement = await expiringDiv.count() > 0;

    let backgroundColor;
    let textColor;

    if (hasDivElement) {
      // Check the div element with "Expiring Soon" text
      backgroundColor = await expiringDiv.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      this.logger.info(`Access Status div background color: ${backgroundColor}`);

      textColor = await expiringDiv.evaluate((el) => window.getComputedStyle(el).color);
      this.logger.info(`Access Status div text color: ${textColor}`);
    } else {
      // Fallback: check any inner element or the cell itself
      const innerElement = statusCell.locator('*').first();
      const hasInnerElement = await innerElement.count() > 0;

      if (hasInnerElement) {
        backgroundColor = await innerElement.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        this.logger.info(`Access Status inner element background color: ${backgroundColor}`);

        textColor = await innerElement.evaluate((el) => window.getComputedStyle(el).color);
      } else {
        backgroundColor = await statusCell.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        this.logger.info(`Access Status cell background color: ${backgroundColor}`);

        textColor = await statusCell.evaluate((el) => window.getComputedStyle(el).color);
      }
    }

    // Orange color variants: rgb(255, 165, 0), rgb(255, 140, 0), rgb(255, 152, 0), rgb(243, 156, 18), rgb(230, 126, 34), rgb(235, 115, 0)
    const isOrange = backgroundColor.includes('rgb(255, 165, 0)')
                     || backgroundColor.includes('rgb(255, 140, 0)')
                     || backgroundColor.includes('rgb(255, 152, 0)')
                     || backgroundColor.includes('rgb(243, 156, 18)')
                     || backgroundColor.includes('rgb(230, 126, 34)')
                     || backgroundColor.includes('rgb(235, 115, 0)')
                     || backgroundColor.includes('rgb(251, 140, 0)')
                     || backgroundColor.match(/rgb\(2[3-5][0-9],\s*1[0-6][0-9],\s*[0-4][0-9]\)/);

    if (!isOrange) {
      throw new Error(`Access Status background color is not orange. Actual: ${backgroundColor}`);
    }

    this.logger.info('✓ Access Status has orange background color');

    // Verify text color is visible (white or light color)
    this.logger.info(`Access Status text color: ${textColor}`);

    // White or light color
    const isLightColor = textColor.includes('rgb(255, 255, 255)')
                         || textColor.includes('rgb(248, 249, 250)')
                         || textColor.includes('white')
                         || textColor.match(/rgb\(2[4-5][0-9],\s*2[4-5][0-9],\s*2[4-5][0-9]\)/);

    if (!isLightColor) {
      this.logger.warn(`Access Status text color may not be optimal for readability. Color: ${textColor}`);
    } else {
      this.logger.info('✓ Access Status has light text color (white or near-white)');
    }

    this.logger.info('✓ Access Status is "Expiring Soon" with orange background and visible text');
  }

  /**
   * Verify Access Status is empty (no status displayed)
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status from facade
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsEmpty(siteName, getAccessStatusFn) {
    this.logger.action('Verifying Access Status is empty (no status displayed)');

    // Get the Access Status
    const accessStatus = await getAccessStatusFn(siteName);

    // Remove all whitespace and check if empty
    const cleanedStatus = accessStatus.replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim();

    if (cleanedStatus !== '') {
      throw new Error(`Expected Access Status to be empty, but found: "${accessStatus}"`);
    }

    this.logger.info('✓ Access Status is empty (no status displayed)');
  }

  /**
   * Verify "No records to display" message is visible
   * @returns {Promise<void>}
   */
  async verifyNoRecordsToDisplay() {
    this.logger.action('Verifying "No records to display" message is visible');

    // Wait for the empty record message to appear
    const noRecordsLocator = this.page.locator('.e-emptyrecord, .e-grid .e-gridcontent:has-text("No records to display")');
    await noRecordsLocator.waitFor({ state: 'visible', timeout: 10000 });

    const isVisible = await noRecordsLocator.isVisible();
    if (isVisible) {
      this.logger.info('✓ "No records to display" message is visible');
    } else {
      throw new Error('"No records to display" message is not visible');
    }
  }

  /**
   * Get visible column headers from Site Access grid
   * @returns {Promise<string[]>}
   */
  async getSiteAccessGridHeaders() {
    this.logger.action('Getting visible column headers from Site Access grid');

    // Wait for grid to be visible and fully loaded
    await this.page.locator('.e-grid').first().waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(5000); // Increased wait for all columns to render

    // Find the correct grid with both Access Status and Access Expiration columns
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      let hasAccessStatus = false;
      let hasAccessExpiration = false;

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
        }
        if (headerText && headerText.includes('Access Expiration')) {
          hasAccessExpiration = true;
        }
      }

      // Found the site access grid
      if (hasAccessStatus && hasAccessExpiration) {
        const columnHeaders = [];

        for (let i = 0; i < headerCount; i++) {
          const header = headers.nth(i);
          const isVisible = await header.isVisible().catch(() => false);

          if (isVisible) {
            // Try to get the header text from .e-headertext or .e-headercelldiv first
            let headerText = await header.locator('.e-headertext').first().textContent().catch(() => null);
            if (!headerText) {
              headerText = await header.locator('.e-headercelldiv').first().textContent().catch(() => null);
            }
            if (!headerText) {
              // Fallback to direct text content, but only get the first line
              const fullText = await header.textContent();
              headerText = fullText.split('\n')[0];
            }

            const cleanedText = headerText.trim().replace(/\s+/g, ' '); // Normalize whitespace

            // Skip empty headers, action columns, or headers with accessibility hints
            if (cleanedText
                && !cleanedText.includes('e-icon')
                && !cleanedText.includes('Press Alt Down')
                && !cleanedText.includes('Press Enter to sort')) {
              columnHeaders.push(cleanedText);
            }
          }
        }

        this.logger.info(`Found ${columnHeaders.length} visible columns: ${columnHeaders.join(', ')}`);
        return columnHeaders;
      }
    }

    throw new Error('Site Access grid not found');
  }
}

module.exports = AccessStatusVerificationOperations;
