const logger = require('../../../../utils/logger');
const LOCATORS = require('../../../constants/administrationUserPage.constants');

/**
 * Site Access Operations Module
 * Handles all site access grant/remove operations in the Administration User page
 */
class SiteAccessOperations {
  constructor(page) {
    this.page = page;
    this.logger = logger;
  }

  /**
   * Grant access to a site by checking its checkbox
   * @param {string} siteName - Site name to grant access to
   * @returns {Promise<void>}
   */
  async grantAccessToSite(siteName) {
    this.logger.action(`Granting access to site: ${siteName}`);

    // Check the checkbox in the row (row should already be selected/clicked before calling this)
    const siteRow = this.page.locator('.e-row').filter({ hasText: siteName }).first();
    await siteRow.waitFor({ state: 'visible', timeout: 10000 });

    const checkbox = siteRow.locator('input[type="checkbox"]').first();
    await checkbox.check();

    this.logger.info(`✓ Access granted to site: ${siteName}`);
  }

  /**
   * Remove access for a site (cleanup)
   * @param {string} siteName - Site name to remove access for
   * @returns {Promise<void>}
   */
  async removeAccessForSite(siteName) {
    this.logger.action(`Removing access for site: ${siteName}`);

    // Find the correct grid with Access Status column
    const allGrids = this.page.locator(LOCATORS.grid);
    const gridCount = await allGrids.count();
    let correctGrid = null;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator(`${LOCATORS.gridHeader} ${LOCATORS.headerCell}`);
      const headerCount = await headers.count();

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes(LOCATORS.columns.accessStatus)) {
          correctGrid = grid;
          break;
        }
      }

      if (correctGrid) break;
    }

    if (correctGrid) {
      const maxAttempts = 3;
      let attempt = 1;

      while (attempt <= maxAttempts) {
        this.logger.info(`Removal attempt ${attempt}/${maxAttempts}`);

        // Find the row with the site name
        const siteRow = correctGrid.locator(LOCATORS.gridRow).filter({ hasText: siteName }).first();
        const rowExists = await siteRow.count() > 0;

        if (!rowExists) {
          this.logger.info('Row no longer visible after previous save - removal already complete');
          break;
        }

        await siteRow.waitFor({ state: 'visible', timeout: 5000 });

        // Click to select the row (it will turn orange/yellow)
        // Use evaluate to bypass mdl-cell div intercepting pointer events
        const siteCell = siteRow.locator('td').first();
        await siteCell.evaluate((el) => el.click());
        this.logger.info('✓ Row selected (highlighted)');

        // Right-click on the row to open context menu
        await siteRow.evaluate((el) => {
          el.dispatchEvent(new MouseEvent('contextmenu', {
            bubbles: true, cancelable: true, view: window,
          }));
        });
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
            siteName,
            { timeout: 5000 },
          );
          this.logger.info(`✓ Row marked for deletion (background #bd8585) — call Save to persist`);
          break;
        } catch (error) {
          this.logger.info('Row colour not yet updated, will retry...');
          attempt++;
        }
      }

      this.logger.info(`✓ Site "${siteName}" marked for removal — caller must click Save`);
    } else {
      throw new Error(`Could not find grid with Access Status column for site: ${siteName}`);
    }
  }

  /**
   * Get the first site name from the current grid view
   * @returns {Promise<string>} First site name
   */
  async getFirstSiteNameFromGrid() {
    this.logger.action('Getting first site name from grid');

    // Find the correct grid with site access data
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let siteListColumnIndex = -1;
    let correctGridIndex = -1;

    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();

      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && (headerText.includes('Accessible Sites') || headerText.includes('Site List'))) {
          siteListColumnIndex = i;
          correctGridIndex = gridIndex;
          break;
        }
      }

      if (siteListColumnIndex !== -1) {
        break;
      }
    }

    if (siteListColumnIndex === -1 || correctGridIndex === -1) {
      throw new Error('Site access grid not found');
    }

    // Get the first row in the correct grid
    const correctGrid = allGrids.nth(correctGridIndex);
    const firstRow = correctGrid.locator('.e-row').first();
    await firstRow.waitFor({ state: 'visible', timeout: 10000 });

    // Get the site name from the appropriate column
    const cells = firstRow.locator('td');
    const siteNameCell = cells.nth(siteListColumnIndex);
    const siteName = await siteNameCell.textContent();
    const trimmedSiteName = siteName.trim();

    this.logger.info(`✓ First site name: ${trimmedSiteName}`);
    return trimmedSiteName;
  }

  /**
   * Grant access to multiple sites in sequence
   * @param {Array<string>} siteNames - Array of site names to grant access to
   * @param {Function} grantAccessFn - Callback to grant access to a single site
   * @returns {Promise<void>}
   */
  async grantAccessToMultipleSites(siteNames, grantAccessFn) {
    this.logger.info(`Granting access to ${siteNames.length} sites`);

    for (const siteName of siteNames) {
      this.logger.info(`Granting access to ${siteName}`);

      // First click the site cell to select the row (turns orange/yellow)
      await this.page.getByRole('gridcell', { name: siteName }).click();

      // Then grant access (checks the checkbox)
      await grantAccessFn(siteName);
    }

    this.logger.info(`✓ Granted access to all ${siteNames.length} sites`);
  }

  /**
   * Select multiple sites using Ctrl+click
   * @param {Array<string>} siteNames - Array of site names
   * @returns {Promise<void>}
   */
  async selectMultipleSites(siteNames) {
    this.logger.info(`Selecting ${siteNames.length} sites`);

    for (const siteName of siteNames) {
      await this.page.getByRole('gridcell', { name: siteName }).click({ modifiers: ['Control'] });
      this.logger.info(`✓ Selected ${siteName}`);
    }

    this.logger.info(`✓ Selected all ${siteNames.length} sites`);
  }

  /**
   * Bulk remove selected sites using context menu
   * @param {string} firstSiteName - Name of first site to right-click
   * @returns {Promise<void>}
   */
  async bulkRemoveSelectedSites(firstSiteName) {
    this.logger.info('Opening context menu to remove selected sites');
    await this.page.getByRole('gridcell', { name: firstSiteName }).click({ button: 'right' });

    this.logger.info('Clicking Remove from context menu');
    await this.page.getByText('Remove', { exact: true }).click();
    this.logger.info('✓ Bulk removed selected sites');
  }
}

module.exports = SiteAccessOperations;
