const logger = require('../../../../utils/logger');

/** RGB color values for green Access Status backgrounds */
const GREEN_COLORS = [
  'rgb(0, 128, 0)', 'rgb(40, 167, 69)', 'rgb(76, 175, 80)',
  'rgb(46, 125, 50)', 'rgb(67, 160, 71)', 'rgb(56, 142, 60)',
  'rgb(34, 139, 34)', 'rgb(0, 150, 0)',
];
const GREEN_PATTERNS = [
  /rgb\([0-9]{1,2},\s*1[2-6][0-9],\s*[0-9]{1,2}\)/,
  /rgb\([3-7][0-9],\s*1[4-7][0-9],\s*[5-8][0-9]\)/,
];

/** RGB color values for red Access Status backgrounds */
const RED_COLORS = [
  'rgb(255, 0, 0)', 'rgb(220, 53, 69)', 'rgb(255, 99, 71)',
  'rgb(244, 67, 54)', 'rgb(213, 0, 0)', 'rgb(198, 40, 40)',
];
const RED_PATTERNS = [
  /rgb\(2[2-5][0-9],\s*[0-9]{1,2},\s*[0-9]{1,2}\)/,
];

/** RGB color values for orange Access Status backgrounds */
const ORANGE_COLORS = [
  'rgb(255, 165, 0)', 'rgb(255, 140, 0)', 'rgb(255, 152, 0)',
  'rgb(243, 156, 18)', 'rgb(230, 126, 34)', 'rgb(235, 115, 0)',
  'rgb(251, 140, 0)',
];
const ORANGE_PATTERNS = [
  /rgb\(2[3-5][0-9],\s*1[0-6][0-9],\s*[0-4][0-9]\)/,
];

/** RGB color values for light/white text */
const LIGHT_COLORS = [
  'rgb(255, 255, 255)', 'rgb(248, 249, 250)', 'white',
];
const LIGHT_PATTERNS = [
  /rgb\(2[4-5][0-9],\s*2[4-5][0-9],\s*2[4-5][0-9]\)/,
];

/**
 * Check if a color string matches any of the given values or patterns
 * @param {string} color - CSS color string to test
 * @param {string[]} colorValues - Exact color strings to match
 * @param {RegExp[]} patterns - Regex patterns to test
 * @returns {boolean}
 */
const isColorMatch = (color, colorValues, patterns = []) => {
  if (colorValues.some((c) => color.includes(c))) {
    return true;
  }
  return patterns.some((p) => p.test(color));
};

/**
 * Access Status Verification Operations Module
 * Handles all access status verification operations
 * including color validation
 */
class AccessStatusVerificationOperations {
  constructor(page) {
    this.page = page;
    this.logger = logger;
  }

  /**
   * Find the Access Status cell for a given site in the grid
   * @param {string} siteName - Site name to locate
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async findAccessStatusCell(siteName) {
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      // Find the Access Status column index
      let statusColumnIndex = -1;
      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText?.includes('Access Status')) {
          statusColumnIndex = i;
          break;
        }
      }

      if (statusColumnIndex === -1) {
        continue;
      }

      // Find the row containing the site name
      const rows = grid.locator('.e-row');
      const rowCount = await rows.count();

      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row = rows.nth(rowIndex);
        const cells = row.locator('td');
        const cellCount = await cells.count();

        const isSiteRow = await this.rowContainsSite(
          cells, cellCount, siteName,
        );

        if (isSiteRow && statusColumnIndex < cellCount) {
          return cells.nth(statusColumnIndex);
        }
      }
    }

    throw new Error(
      `Could not find Access Status cell for site: ${siteName}`,
    );
  }

  /**
   * Check if a grid row contains the given site name
   * @param {import('@playwright/test').Locator} cells - Row cells
   * @param {number} cellCount - Number of cells in the row
   * @param {string} siteName - Site name to search for
   * @returns {Promise<boolean>}
   */
  async rowContainsSite(cells, cellCount, siteName) {
    for (let i = 0; i < cellCount; i++) {
      const cellText = await cells.nth(i).textContent();
      if (cellText?.trim() === siteName) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get background and text color from an Access Status cell
   * @param {import('@playwright/test').Locator} statusCell - The cell
   * @param {string} statusText - Text to look for (e.g. "Active")
   * @returns {Promise<{backgroundColor: string, textColor: string}>}
   */
  async getStatusCellColors(statusCell, statusText) {
    const statusDiv = statusCell
      .locator(`div:has-text("${statusText}")`);
    const hasDivElement = await statusDiv.count() > 0;

    if (hasDivElement) {
      const backgroundColor = await statusDiv.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );
      const textColor = await statusDiv.evaluate(
        (el) => window.getComputedStyle(el).color,
      );
      return { backgroundColor, textColor };
    }

    // Fallback: check inner element or the cell itself
    const innerElement = statusCell.locator('*').first();
    const hasInnerElement = await innerElement.count() > 0;
    const target = hasInnerElement ? innerElement : statusCell;

    const backgroundColor = await target.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    const textColor = await target.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    return { backgroundColor, textColor };
  }

  /**
   * Log text color readability check
   * @param {string} textColor - CSS color string
   * @returns {void}
   */
  verifyTextColorReadability(textColor) {
    this.logger.info(`Access Status text color: ${textColor}`);

    const isLightColor = isColorMatch(
      textColor, LIGHT_COLORS, LIGHT_PATTERNS,
    );

    if (!isLightColor) {
      this.logger.warn(
        'Access Status text color may not be optimal '
        + `for readability. Color: ${textColor}`,
      );
    } else {
      this.logger.info(
        '✓ Access Status has light text color (white or near-white)',
      );
    }
  }

  /**
   * Verify Access Status text and background color for a site
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get status text
   * @param {string} expectedStatus - Expected status text
   * @param {string} colorName - Color name for logging
   * @param {string[]} colorValues - Valid background color values
   * @param {RegExp[]} colorPatterns - Valid background color patterns
   * @returns {Promise<void>}
   */
  async verifyAccessStatusWithColor(
    siteName, getAccessStatusFn, expectedStatus,
    colorName, colorValues, colorPatterns,
  ) {
    this.logger.action(
      `Verifying Access Status is "${expectedStatus}" `
      + `with ${colorName} background`,
    );

    const accessStatus = await getAccessStatusFn(siteName);
    if (accessStatus !== expectedStatus) {
      throw new Error(
        `Access Status is not "${expectedStatus}". `
        + `Actual: ${accessStatus}`,
      );
    }
    this.logger.info(
      `✓ Access Status text is "${expectedStatus}"`,
    );

    const statusCell = await this.findAccessStatusCell(siteName);
    const { backgroundColor, textColor } =
      await this.getStatusCellColors(statusCell, expectedStatus);

    this.logger.info(
      `Access Status background color: ${backgroundColor}`,
    );

    if (!isColorMatch(backgroundColor, colorValues, colorPatterns)) {
      throw new Error(
        `Access Status background color is not ${colorName}. `
        + `Actual: ${backgroundColor}`,
      );
    }
    this.logger.info(
      `✓ Access Status has ${colorName} background color`,
    );

    this.verifyTextColorReadability(textColor);
    this.logger.info(
      `✓ Access Status is "${expectedStatus}" `
      + `with ${colorName} background and visible text`,
    );
  }

  /**
   * Verify Access Status is Active (simple text check)
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsActive(siteName, getAccessStatusFn) {
    this.logger.action('Verifying Access Status is Active');

    const accessStatus = await getAccessStatusFn(siteName);

    if (accessStatus !== 'Active') {
      throw new Error(
        `Access Status is not Active. Actual: ${accessStatus}`,
      );
    }

    this.logger.info('✓ Access Status is Active');
  }

  /**
   * Verify Access Status is Active with green background
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsActiveWithColor(
    siteName, getAccessStatusFn,
  ) {
    await this.verifyAccessStatusWithColor(
      siteName, getAccessStatusFn, 'Active',
      'green', GREEN_COLORS, GREEN_PATTERNS,
    );
  }

  /**
   * Verify Access Status is Expired with red background
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsExpired(siteName, getAccessStatusFn) {
    await this.verifyAccessStatusWithColor(
      siteName, getAccessStatusFn, 'Expired',
      'red', RED_COLORS, RED_PATTERNS,
    );
  }

  /**
   * Verify Access Status is Expiring Soon with orange background
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsExpiringSoon(siteName, getAccessStatusFn) {
    await this.verifyAccessStatusWithColor(
      siteName, getAccessStatusFn, 'Expiring Soon',
      'orange', ORANGE_COLORS, ORANGE_PATTERNS,
    );
  }

  /**
   * Verify Access Status is empty (no status displayed)
   * @param {string} siteName - Site name to verify
   * @param {Function} getAccessStatusFn - Callback to get access status
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsEmpty(siteName, getAccessStatusFn) {
    this.logger.action(
      'Verifying Access Status is empty (no status displayed)',
    );

    const accessStatus = await getAccessStatusFn(siteName);
    const cleanedStatus =
      accessStatus.replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim();

    if (cleanedStatus !== '') {
      throw new Error(
        'Expected Access Status to be empty, '
        + `but found: "${accessStatus}"`,
      );
    }

    this.logger.info(
      '✓ Access Status is empty (no status displayed)',
    );
  }

  /**
   * Verify "No records to display" message is visible
   * @returns {Promise<void>}
   */
  async verifyNoRecordsToDisplay() {
    this.logger.action(
      'Verifying "No records to display" message is visible',
    );

    const noRecordsLocator = this.page.locator(
      '.e-emptyrecord, '
      + '.e-grid .e-gridcontent:has-text("No records to display")',
    );
    await noRecordsLocator.waitFor(
      { state: 'visible', timeout: 10000 },
    );

    if (!await noRecordsLocator.isVisible()) {
      throw new Error(
        '"No records to display" message is not visible',
      );
    }

    this.logger.info(
      '✓ "No records to display" message is visible',
    );
  }

  /**
   * Get visible column headers from Site Access grid
   * @returns {Promise<string[]>}
   */
  async getSiteAccessGridHeaders() {
    this.logger.action(
      'Getting visible column headers from Site Access grid',
    );

    // Wait for grid to be visible and fully loaded
    await this.page.locator('.e-grid').first()
      .waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator('.e-grid .e-row').first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {});
    await this.page.locator('.e-spinner-pane')
      .waitFor({ state: 'hidden', timeout: 5000 })
      .catch(() => {});
    await this.page
      .waitForLoadState('networkidle', { timeout: 10000 })
      .catch(() => {});

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
        if (headerText?.includes('Access Status')) {
          hasAccessStatus = true;
        }
        if (headerText?.includes('Access Expiration')) {
          hasAccessExpiration = true;
        }
      }

      if (!hasAccessStatus || !hasAccessExpiration) {
        continue;
      }

      // Found the site access grid — collect visible headers
      const columnHeaders = [];

      for (let i = 0; i < headerCount; i++) {
        const header = headers.nth(i);
        const isVisible =
          await header.isVisible().catch(() => false);

        if (!isVisible) {
          continue;
        }

        let headerText = await header.locator('.e-headertext')
          .first().textContent().catch(() => null);
        if (!headerText) {
          headerText = await header.locator('.e-headercelldiv')
            .first().textContent().catch(() => null);
        }
        if (!headerText) {
          const fullText = await header.textContent();
          headerText = fullText.split('\n')[0];
        }

        const cleanedText =
          headerText.trim().replace(/\s+/g, ' ');

        // Skip empty, icon, or accessibility-hint headers
        if (cleanedText
            && !cleanedText.includes('e-icon')
            && !cleanedText.includes('Press Alt Down')
            && !cleanedText.includes('Press Enter to sort')) {
          columnHeaders.push(cleanedText);
        }
      }

      this.logger.info(
        `Found ${columnHeaders.length} visible columns: `
        + columnHeaders.join(', '),
      );
      return columnHeaders;
    }

    throw new Error('Site Access grid not found');
  }
}

module.exports = AccessStatusVerificationOperations;
