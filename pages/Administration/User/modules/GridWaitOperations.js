const logger = require('../../../../utils/logger');

/**
 * Grid Wait Operations Module
 * Handles all grid wait and stabilization operations
 */
class GridWaitOperations {
  constructor(page) {
    this.page = page;
    this.logger = logger;
  }

  /**
   * Wait for page to be ready using domcontentloaded instead of networkidle
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForPageReady(timeout = 30000) {
    await this.page.waitForLoadState('domcontentloaded', { timeout }).catch(() => {
      this.logger.info('DOM content not loaded, continuing...');
    });
  }

  /**
   * Wait for user grid to fully load with data
   * @returns {Promise<void>}
   */
  async waitForUserGridToLoad() {
    this.logger.action('Waiting for user grid to fully load');

    // Wait for grid structure to be visible
    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 50000 });

    // Wait for actual data rows to populate
    await this.page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout: 30000 });

    // Wait for spinner to disappear (indicates grid finished loading)
    await this.page.locator('.e-spinner-pane').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      this.logger.info('No spinner found or already hidden');
    });

    this.logger.info('✓ User grid fully loaded with data');
  }

  /**
   * Wait for user grid filter to be ready
   * @returns {Promise<void>}
   */
  async waitForUserGridFilterReady() {
    this.logger.action('Waiting for grid filters to be ready');

    // Wait for First name filter icon to be visible and interactive
    await this.page.locator('.e-headercelldiv:has-text("First name")').first()
      .locator('..')
      .locator('.e-filtermenudiv.e-icon-filter')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    this.logger.info('✓ Grid filters ready');
  }

  /**
   * Wait for site access grid to fully load
   * @returns {Promise<void>}
   */
  async waitForSiteAccessGridToLoad() {
    this.logger.action('Waiting for Site Access grid to fully load');

    // Wait for Access Status header to be visible (indicates site access grid is loaded)
    await this.page.locator('.e-gridheader').filter({ hasText: 'Access Status' })
      .waitFor({ state: 'visible', timeout: 30000 });

    // Wait for grid rows to be present
    await this.page.locator('.e-gridcontent .e-row').first().waitFor({ state: 'attached', timeout: 30000 }).catch(() => {
      this.logger.info('No rows found in site access grid');
    });

    this.logger.info('✓ Site Access grid fully loaded');
  }

  /**
   * Wait for specific sites to appear in the Site Access grid
   * @param {string[]} siteNames - Array of site names to wait for
   * @param {number} timeout - Timeout in milliseconds (default: 15000)
   * @returns {Promise<void>}
   */
  async waitForSitesInGrid(siteNames, timeout = 15000) {
    this.logger.action(`Waiting for sites to appear in grid: ${siteNames.join(', ')}`);

    // Wait for document to be fully loaded
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    this.logger.info('✓ Document loaded');

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      this.logger.info('Network did not go idle, continuing...');
    });

    // Wait for grid content to be visible
    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 30000 });
    this.logger.info('✓ Grid content is visible');

    // Wait for the first site to appear as an indicator that grid has loaded
    const firstSite = siteNames[0];

    try {
      await this.page.locator('.e-gridcontent .e-row').filter({ hasText: firstSite })
        .first()
        .waitFor({ state: 'visible', timeout });
      this.logger.info(`✓ Site "${firstSite}" found in grid`);
    } catch (error) {
      this.logger.warn(`Site "${firstSite}" not found in grid after ${timeout}ms`);
      throw new Error(`Site "${firstSite}" not found in grid. Grid may not have loaded correctly.`);
    }
  }

  /**
   * Generic wait for grid content to be visible
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForGridContent(timeout = 30000) {
    this.logger.action('Waiting for grid content to be visible');
    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout });
    this.logger.info('✓ Grid content is visible');
  }

  /**
   * Generic wait for grid rows to be visible
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForGridRows(timeout = 30000) {
    this.logger.action('Waiting for grid rows to be visible');
    await this.page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout });
    this.logger.info('✓ Grid rows are visible');
  }

  /**
   * Wait for a specific site cell to be visible in the grid
   * @param {string} siteName - Name of the site
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForSiteCellVisible(siteName, timeout = 30000) {
    this.logger.action(`Waiting for site cell "${siteName}" to be visible`);
    await this.page.getByRole('gridcell', { name: siteName }).waitFor({ state: 'visible', timeout });
    this.logger.info(`✓ Site cell "${siteName}" is visible`);
  }

  /**
   * Generic wait/timeout wrapper (use sparingly, prefer explicit waits)
   * @param {number} milliseconds - Time to wait in milliseconds
   * @returns {Promise<void>}
   */
  async wait(milliseconds) {
    this.logger.info(`Waiting for ${milliseconds}ms`);
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * Wait for a specific group cell to be visible in the grid
   * @param {string} groupName - Name of the group
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForGroupCellVisible(groupName, timeout = 30000) {
    this.logger.action(`Waiting for group cell "${groupName}" to be visible`);
    await this.page.getByRole('gridcell', { name: groupName }).waitFor({ state: 'visible', timeout });
    this.logger.info(`✓ Group cell "${groupName}" is visible`);
  }

  /**
   * Wait for Access Status column header to be visible in grid
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForAccessStatusColumn(timeout = 30000) {
    this.logger.action('Waiting for Access Status column to be visible');
    await this.page.locator('.e-gridheader').filter({ hasText: 'Access Status' }).waitFor({ state: 'visible', timeout });
    this.logger.info('✓ Access Status column is visible');
  }

  /**
   * Wait for grid rows to be visible and stabilize
   * @param {number} initialWait - Initial wait for rows (default: 30000ms)
   * @param {number} stabilizationWait - Additional stabilization wait (default: 3000ms)
   * @returns {Promise<void>}
   */
  async waitForGridRowsWithStabilization(initialWait = 30000, stabilizationWait = 3000) {
    this.logger.action('Waiting for grid rows to be visible and stabilize');
    await this.page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout: initialWait });
    await this.page.waitForTimeout(stabilizationWait);
    this.logger.info('✓ Grid rows are visible and stabilized');
  }

  /**
   * Wait for grid to be fully stabilized and ready for interaction
   * Combines multiple wait strategies for maximum reliability
   * @param {number} timeout - Maximum wait time (default: 30000ms)
   * @param {Function} waitForGridRowsFn - Callback to wait for grid rows from facade
   * @returns {Promise<void>}
   */
  async waitForGridStabilization(timeout = 30000, waitForGridRowsFn) {
    this.logger.action('Waiting for grid to be fully stabilized');

    // Wait for grid to be visible
    await this.page.locator('.e-grid').first().waitFor({
      state: 'visible',
      timeout,
    });

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', {
      timeout: 10000,
    }).catch(() => {
      this.logger.debug('Network did not go idle, continuing');
    });

    // Wait for any spinners/loaders to disappear
    await this.page.locator('.e-spinner-pane').waitFor({
      state: 'hidden',
      timeout: 5000,
    }).catch(() => {
      this.logger.debug('No spinner found or already hidden');
    });

    // Wait for grid rows to be present
    await waitForGridRowsFn().catch(() => {
      this.logger.debug('Grid rows not immediately visible');
    });

    // Add small buffer for UI rendering
    await this.page.waitForTimeout(1000);

    this.logger.info('✓ Grid fully stabilized');
  }

  /**
   * Press Escape key to close dialogs/popups
   * @param {number} waitAfter - Wait time after pressing key (default: 1000ms)
   * @returns {Promise<void>}
   */
  async pressEscape(waitAfter = 1000) {
    this.logger.action('Pressing Escape key');
    await this.page.keyboard.press('Escape');
    if (waitAfter > 0) {
      await this.page.waitForTimeout(waitAfter);
    }
    this.logger.info('✓ Escape key pressed');
  }

  /**
   * Wait for DOM content to be loaded
   * @returns {Promise<void>}
   */
  async waitForDOMContentLoaded() {
    this.logger.action('Waiting for DOM content to be loaded');
    await this.page.waitForLoadState('domcontentloaded');
    this.logger.info('✓ DOM content loaded');
  }

  /**
   * Wait for permission column headers to load (Report View, Document View)
   * @returns {Promise<void>}
   */
  async waitForPermissionColumnHeaders() {
    this.logger.action('Waiting for permission column headers to load');
    // Target specific header cells, not the container, so visible/hidden state is accurate
    await this.page.locator('.e-gridheader .e-headercell').filter({ hasText: 'Report View' }).first().waitFor({ state: 'visible', timeout: 30000 });
    await this.page.locator('.e-gridheader .e-headercell').filter({ hasText: 'Document View' }).first().waitFor({ state: 'visible', timeout: 30000 });
    this.logger.info('✓ Permission column headers loaded');
  }

  /**
   * Wait for permission columns to be hidden
   * @returns {Promise<void>}
   */
  async waitForPermissionColumnsHidden() {
    this.logger.action('Waiting for permission columns to be hidden');
    // Target the specific Report View header cell (not the container which is always visible).
    // When Syncfusion hides a column it applies display:none to the .e-headercell, so
    // isVisible() returns false immediately - allowing us to skip the 30s wait.
    const reportViewCell = this.page.locator('.e-gridheader .e-headercell').filter({ hasText: 'Report View' }).first();
    const isAlreadyHidden = !(await reportViewCell.isVisible().catch(() => false));
    if (isAlreadyHidden) {
      this.logger.info('✓ Permission columns already hidden');
      return;
    }
    await reportViewCell.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
      this.logger.info('Report View column hidden or not found');
    });
    this.logger.info('✓ Permission columns hidden');
  }
}

module.exports = GridWaitOperations;
