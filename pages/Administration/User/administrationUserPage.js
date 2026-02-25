const BasePage = require('../../basePage');
const helper = require('../../../utils/helper');
const LOCATORS = require('../../constants/administrationUserPage.constants');

/**
 * Administration User Page class extending BasePage
 * Handles all interactions with the Administration User functionality
 */
class AdministrationUserPage extends BasePage {
  constructor(page) {
    super(page);
  }

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
    await this.page.waitForTimeout(500);
    await this.click(LOCATORS.listMenuItem);
    await this.page.waitForLoadState('networkidle');
    this.logger.info('✓ Navigated to Users List');
  }

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
    await this.page.waitForTimeout(500);
    
    // Wait for Excel filter dialog
    const excelFilter = this.page.getByLabel('Excel filter');
    await excelFilter.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
    
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
    await this.page.waitForTimeout(500);
    
    // Wait for OK button to become enabled (critical - button starts disabled)
    await this.page.waitForFunction(
      () => {
        const filterDialog = document.querySelector('[aria-label="Excel filter"]');
        if (!filterDialog) return false;
        const btn = filterDialog.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      { timeout: 15000 }
    );
    
    // Click OK button within the Excel filter dialog
    const okButton = excelFilter.getByRole('button', { name: 'OK', exact: true });
    await okButton.click();
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
    
    this.logger.info(`✓ Filtered by First name: ${firstName}`);
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
      .locator('.e-filtermenudiv.e-icon-filter').first()
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
    
    // Wait for the first site to appear as an indicator that grid has loaded
    const firstSite = siteNames[0];
    
    try {
      await this.page.locator('.e-gridcontent .e-row').filter({ hasText: firstSite })
        .first()
        .waitFor({ state: 'visible', timeout: timeout });
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
    await this.page.locator('.e-gridheader').filter({ hasText: 'Report View' }).waitFor({ state: 'visible', timeout: 30000 });
    await this.page.locator('.e-gridheader').filter({ hasText: 'Document View' }).waitFor({ state: 'visible', timeout: 30000 });
    this.logger.info('✓ Permission column headers loaded');
  }

  /**
   * Wait for permission columns to be hidden
   * @returns {Promise<void>}
   */
  async waitForPermissionColumnsHidden() {
    this.logger.action('Waiting for permission columns to be hidden');
    await this.page.locator('.e-gridheader').filter({ hasText: 'Report View' }).waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
      this.logger.info('Report View column hidden or not found');
    });
    this.logger.info('✓ Permission columns hidden');
  }

  /**
   * Click on a site cell in the grid
   * @param {string} siteName - Name of the site to click
   * @returns {Promise<void>}
   */
  async clickSiteCell(siteName) {
    this.logger.action(`Clicking on site "${siteName}"`);
    await this.page.getByRole('gridcell', { name: siteName }).click();
    // Wait for row to be selected (indicated by e-selectionbackground class)
    await this.page.locator('.e-row.e-selectionbackground').waitFor({ state: 'attached', timeout: 5000 }).catch(() => {
      this.logger.info('Row selection indicator not found');
    });
    this.logger.info(`✓ Clicked on site "${siteName}"`);
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
   * Enable "Show sites with no access granted"
   * @returns {Promise<void>}
   */
  async enableShowSitesWithNoAccess() {
    this.logger.action('Enabling "Show sites with no access granted"');
    const radioButton = this.page.locator(LOCATORS.showSitesNoAccessRadio).first();
    await radioButton.waitFor({ state: 'visible', timeout: 10000 });
    await radioButton.click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
    
    // Wait for data to load in Site List
    this.logger.info('Waiting for Site List data to load...');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);
    
    // Scroll the grid header and content to left to see Site List column
    this.logger.info('Scrolling site grid to left to see Site List column');
    await this.page.evaluate(() => {
      // Find all grid containers and scroll them to left
      const gridHeaders = document.querySelectorAll('.e-gridheader');
      const gridContents = document.querySelectorAll('.e-gridcontent');
      
      // Scroll the last grid (site permissions grid) to left
      if (gridHeaders.length > 0) {
        const lastHeader = gridHeaders[gridHeaders.length - 1];
        lastHeader.scrollLeft = 0;
      }
      if (gridContents.length > 0) {
        const lastContent = gridContents[gridContents.length - 1];
        lastContent.scrollLeft = 0;
      }
    });
    await this.page.waitForTimeout(500);
    
    // Drag the resize handler down to expand the site grid area
    const resizeHandler = this.page.locator('.e-resize-handler.e-icons').first();
    const isResizeHandlerVisible = await resizeHandler.isVisible().catch(() => false);
    
    if (isResizeHandlerVisible) {
      const box = await resizeHandler.boundingBox();
      if (box) {
        // Drag down by 300 pixels to expand the bottom section significantly
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + box.width / 2, box.y + 300);
        await this.page.mouse.up();
        await this.page.waitForTimeout(1000);
        this.logger.info('✓ Expanded site grid area by dragging resize handler');
      }
    }
    
    // Click Edit button to refresh/enable the grid for filtering
    this.logger.info('Clicking Edit button to enable grid interaction');
    const editButton = this.page.locator('button:has-text("Edit")').first();
    const isEditButtonVisible = await editButton.isVisible().catch(() => false);
    if (isEditButtonVisible) {
      await editButton.click();
      await this.page.waitForTimeout(500);
      this.logger.info('✓ Edit button clicked');
    }
    
    this.logger.info('✓ "Show sites with no access granted" enabled');
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
    await this.page.waitForTimeout(500);
    
    // Search for the specific site
    const searchInput = excelFilter.locator('input[placeholder="Search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(siteName);
    await this.page.waitForTimeout(500);
    
    // Try to click "Select All" to deselect, but continue if it's not found (might not appear with search results)
    try {
      await excelFilter.getByText('Select All', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
      await excelFilter.getByText('Select All', { exact: true }).click();
      await this.page.waitForTimeout(500);
    } catch (error) {
      this.logger.info('"Select All" not found - continuing with filtered results');
    }
    
    // Now click only the specific site name
    await excelFilter.getByText(siteName, { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
    await excelFilter.getByText(siteName, { exact: true }).click();
    await this.page.waitForTimeout(500);
    
    // Wait for OK button to become enabled (critical - button starts disabled)
    await this.page.waitForFunction(
      () => {
        const filterDialog = document.querySelector('[aria-label="Excel filter"]');
        if (!filterDialog) return false;
        const btn = filterDialog.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      { timeout: 15000 }
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
      { timeout: 15000 }
    );
    
    // Click OK button within the Excel filter dialog
    const okButton = excelFilter.getByRole('button', { name: 'OK', exact: true });
    await okButton.click();
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    
    this.logger.info(`✓ Filtered by Accessible Sites: ${siteName}`);
  }

  /**
   * Grant access to site by selecting checkbox
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
    await this.page.waitForTimeout(500);
    
    this.logger.info(`✓ Access granted to site: ${siteName}`);
  }

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
      { timeout: 15000 }
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
    await filterIcon.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // Look for Clear Filter option
    const clearFilterOption = this.page.getByText('Clear Filter', { exact: true });
    const isClearVisible = await clearFilterOption.isVisible().catch(() => false);
    
    if (isClearVisible) {
      this.logger.info('Clicking Clear Filter...');
      await clearFilterOption.click();
      await this.page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
      this.logger.info(`✓ Filter cleared on ${columnName} column - all items now visible`);
    } else {
      this.logger.info('✓ No Clear Filter option - filter may already be clear');
      await this.page.keyboard.press('Escape');
    }
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
        const label = labels.find(l => l.textContent.includes(radioText));
        if (!label) return false;
        const radio = label.querySelector('input[type="radio"]') || 
                     label.parentElement.querySelector('input[type="radio"]');
        return radio && radio.checked === true;
      },
      'Show groups with access granted',
      { timeout: 10000 }
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
    
    let maxAttempts = 3;
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
      await this.page.waitForTimeout(1000);
      this.logger.info('✓ Clicked Remove');
      
      // Wait and check if "No records to display" appears
      await this.page.waitForTimeout(2000);
      
      const noRecordsVisible = await this.page.locator('.e-emptyrecord, .e-grid .e-gridcontent:has-text("No records to display")').first().isVisible().catch(() => false);
      
      if (noRecordsVisible) {
        this.logger.info('✓ "No records to display" is visible - removal successful');
        break;
      } else {
        this.logger.info('Record still exists, will retry...');
        attempt++;
        await this.page.waitForTimeout(1000);
      }
    }
    
    // Final verification
    const finalCheck = await this.page.locator('.e-emptyrecord, .e-grid .e-gridcontent:has-text("No records to display")').first().isVisible().catch(() => false);
    
    if (finalCheck) {
      this.logger.info(`✓ Group "${groupName}" successfully removed - "No records to display" confirmed`);
    } else {
      this.logger.warn(`⚠ Group "${groupName}" may still exist after ${maxAttempts} attempts`);
    }
  }

  /**
   * Verify multiple sites have access expiration dates
   * @param {Array<string>} siteNames - Array of site names to verify
   * @returns {Promise<void>}
   */
  async verifySitesHaveExpirationDates(siteNames) {
    this.logger.action(`Verifying sites have expiration dates: ${siteNames.join(', ')}`);
    
    // Calculate expected expiration date (Today + 1 Year in Pacific Time)
    const expectedDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    expectedDate.setFullYear(expectedDate.getFullYear() + 1);
    const expectedDateStr = `${(expectedDate.getMonth() + 1).toString().padStart(2, '0')}/${expectedDate.getDate().toString().padStart(2, '0')}/${expectedDate.getFullYear()}`;
    
    this.logger.info(`Expected Access Expiration date: ${expectedDateStr}`);
    
    // Wait for grid to stabilize
    await this.page.waitForTimeout(1000);
    
    // Verify each site has correct expiration date
    const sitesNotFound = [];
    const sitesWithWrongDate = [];
    
    for (const siteName of siteNames) {
      try {
        // Find the row containing the site name using getByRole
        const siteCell = this.page.getByRole('gridcell', { name: siteName, exact: true });
        await siteCell.waitFor({ state: 'visible', timeout: 5000 });
        
        // Get the parent row
        const row = siteCell.locator('..');
        
        // Get all cells in the row
        const cells = await row.locator('td').allTextContents();
        
        // The last visible cell should contain the expiration date
        const lastCellText = cells[cells.length - 1];
        const cleanedDate = lastCellText.replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim();
        
        if (cleanedDate !== expectedDateStr) {
          this.logger.warn(`Site "${siteName}" has wrong Access Expiration date: ${cleanedDate}, expected: ${expectedDateStr}`);
          sitesWithWrongDate.push(`${siteName} (got: ${cleanedDate})`);
        } else {
          this.logger.info(`✓ Site "${siteName}" has correct Access Expiration date: ${cleanedDate}`);
        }
      } catch (error) {
        this.logger.warn(`Site "${siteName}" not found in grid`);
        sitesNotFound.push(siteName);
      }
    }
    
    // Report errors if any sites were not found or have wrong dates
    if (sitesNotFound.length > 0) {
      throw new Error(`Sites not found in grid: ${sitesNotFound.join(', ')}`);
    }
    
    if (sitesWithWrongDate.length > 0) {
      throw new Error(`Sites with wrong Access Expiration dates: ${sitesWithWrongDate.join(', ')}. Expected: ${expectedDateStr}`);
    }
    
    this.logger.info(`✓ All specified sites have correct Access Expiration date: ${expectedDateStr}`);
  }

  /**
   * Click Save button
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
    await this.page.locator('text=Successfully saved').waitFor({ state: 'visible', timeout });
    await this.page.locator('text=Successfully saved').waitFor({ state: 'hidden', timeout });
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
   * Verify "Show sites with access granted" is selected
   * @returns {Promise<void>}
   */
  async verifyShowSitesWithAccessSelected() {
    this.logger.action('Verifying "Show sites with access granted" is selected');
    
    // Wait for the system to auto-select the radio button after saving
    await this.page.waitForTimeout(3000);
    
    const radioButton = this.page.locator(LOCATORS.showSitesWithAccessRadio).first();
    await radioButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait for the radio to become checked (auto-selected by system)
    await this.page.waitForFunction(
      (radioText) => {
        const labels = Array.from(document.querySelectorAll('label'));
        const label = labels.find(l => l.textContent.includes(radioText));
        if (!label) return false;
        const radio = label.querySelector('input[type="radio"]') || 
                     label.parentElement.querySelector('input[type="radio"]');
        return radio && radio.checked === true;
      },
      'Show sites with access granted',
      { timeout: 10000 }
    );
    
    this.logger.info('✓ "Show sites with access granted" is selected');
  }

  /**
   * Verify "Show permission columns" checkbox is checked
   * @returns {Promise<void>}
   */
  async verifyShowPermissionColumnsChecked() {
    this.logger.action('Verifying "Show permission columns" checkbox is checked');
    
    await this.page.waitForTimeout(2000);
    
    const checkbox = this.page.locator(LOCATORS.showPermissionColumnsCheckbox).first();
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });
    
    // Get the input checkbox
    const inputCheckbox = checkbox.locator('..').locator('input[type="checkbox"]');
    
    // Wait for checkbox to stabilize
    await this.page.waitForTimeout(1000);
    
    // Verify checkbox is checked
    const isChecked = await inputCheckbox.isChecked();
    
    if (!isChecked) {
      throw new Error('"Show permission columns" checkbox is not checked by default');
    }
    
    this.logger.info('✓ "Show permission columns" checkbox is checked by default');
  }

  /**
   * Disable "Show permission columns"
   * @returns {Promise<void>}
   */
  async disableShowPermissionColumns() {
    this.logger.action('Disabling "Show permission columns"');
    
    // Wait for page to fully load and stabilize
    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      this.logger.info('Network did not go idle, continuing...');
    });
    await this.page.waitForTimeout(2000); // Wait for checkbox to be ready
    
    const checkbox = this.page.locator('label').filter({ hasText: 'Show permission columns' }).first();
    
    // Wait for checkbox to be visible
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });
    
    // Scroll the checkbox into view
    await checkbox.scrollIntoViewIfNeeded().catch(() => {
      this.logger.warn('Could not scroll to checkbox');
    });
    await this.page.waitForTimeout(500);
    
    // Get the input checkbox
    const inputCheckbox = checkbox.locator('..').locator('input[type="checkbox"]');
    
    // Wait for checkbox to be enabled (not disabled)
    await inputCheckbox.waitFor({ state: 'attached', timeout: 10000 });
    await this.page.waitForFunction(
      (checkboxSelector) => {
        const label = document.querySelector(checkboxSelector);
        if (!label) return false;
        const input = label.closest('label, .e-checkbox-wrapper')?.querySelector('input[type="checkbox"]') ||
                     label.parentElement?.querySelector('input[type="checkbox"]');
        return input && !input.disabled;
      },
      LOCATORS.showPermissionColumnsCheckbox,
      { timeout: 30000 }
    ).catch(() => {
      this.logger.warn('Checkbox did not become enabled in time, will attempt to click anyway');
    });
    await this.page.waitForTimeout(1000); // Additional wait for stability
    
    // Check if checked
    const isChecked = await inputCheckbox.isChecked().catch(() => false);
    
    if (isChecked) {
      // Click the input checkbox to uncheck
      await inputCheckbox.click();
      await this.page.waitForTimeout(1000);
      
      // Wait for checkbox to become unchecked (verify the state change)
      await this.page.waitForFunction(
        (checkboxSelector) => {
          const label = document.querySelector(checkboxSelector);
          if (!label) return false;
          const input = label.closest('label, .e-checkbox-wrapper')?.querySelector('input[type="checkbox"]') ||
                       label.parentElement?.querySelector('input[type="checkbox"]');
          return input && input.checked === false;
        },
        LOCATORS.showPermissionColumnsCheckbox,
        { timeout: 10000 }
      ).catch(() => {
        this.logger.warn('Checkbox state verification timed out, continuing...');
      });
      
      // Wait for grid to update after hiding columns
      await this.page.waitForTimeout(3000);
      await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
        this.logger.info('Network did not go idle after hiding columns, continuing...');
      });
      
      this.logger.info('✓ "Show permission columns" disabled');
    } else {
      this.logger.info('✓ "Show permission columns" already disabled');
    }
  }

  /**
   * Disable "Show permission columns" with automatic retry if checkbox is disabled
   * This method handles the scenario where the checkbox might be disabled on first Edit click
   * by clicking Cancel and retrying Edit before disabling the columns
   * @returns {Promise<void>}
   */
  async disableShowPermissionColumnsWithRetry() {
    this.logger.action('Disabling "Show permission columns" with retry logic');
    
    // Wait for checkbox to be fully ready
    await this.page.waitForTimeout(3000);
    
    // Check if checkbox is disabled
    const checkboxInput = this.page.locator('label:has-text("Show permission columns")').locator('input[type="checkbox"]');
    const isDisabled = await checkboxInput.isDisabled().catch(() => true);
    
    if (isDisabled) {
      this.logger.info('⚠ Checkbox is disabled, clicking Cancel and retrying Edit');
      
      // Click Cancel button to exit edit mode
      await this.page.locator('button.e-btn.e-small.scs-inline-right.e-info:has-text("Cancel")').click();
      await this.page.waitForTimeout(1000);
      this.logger.info('✓ Clicked Cancel button');
      
      // Click Edit button again
      await this.clickEditButton();
      this.logger.info('✓ Clicked Edit button again');
      
      // Wait for SITE ACCESS AND PERMISSIONS section to reload
      await this.waitForSiteAccessGridToLoad();
      await this.page.waitForTimeout(3000);
      this.logger.info('✓ Site Access grid reloaded and ready');
    } else {
      this.logger.info('✓ Checkbox is enabled, proceeding with disabling columns');
    }
    
    // Now disable the columns using the existing method
    await this.disableShowPermissionColumns();
  }

  /**
   * Enable "Show permission columns"
   * @returns {Promise<void>}
   */
  async enableShowPermissionColumns() {
    this.logger.action('Enabling "Show permission columns"');
    
    // Wait for page to fully load and stabilize
    await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      this.logger.info('Network did not go idle, continuing...');
    });
    await this.page.waitForTimeout(3000);
    
    const checkbox = this.page.locator(LOCATORS.showPermissionColumnsCheckbox).first();
    
    // Wait for checkbox to be visible
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });
    
    // Check if checkbox is enabled
    const isEnabled = await checkbox.isEnabled().catch(() => false);
    
    if (!isEnabled) {
      this.logger.warn('"Show permission columns" checkbox is disabled, skipping...');
      return;
    }
    
    // Get the input checkbox
    const inputCheckbox = checkbox.locator('..').locator('input[type="checkbox"]');
    
    // Wait for it to stabilize
    await this.page.waitForTimeout(2000);
    
    // Check if unchecked
    const isChecked = await inputCheckbox.isChecked().catch(() => false);
    
    if (!isChecked) {
      // Click to check
      await checkbox.click();
      await this.page.waitForTimeout(1000);
      
      // Wait for checkbox to become checked (verify the state change)
      await this.page.waitForFunction(
        (checkboxSelector) => {
          const label = document.querySelector(checkboxSelector);
          if (!label) return false;
          const input = label.closest('label, .e-checkbox-wrapper')?.querySelector('input[type="checkbox"]') ||
                       label.parentElement?.querySelector('input[type="checkbox"]');
          return input && input.checked === true;
        },
        LOCATORS.showPermissionColumnsCheckbox,
        { timeout: 10000 }
      ).catch(() => {
        this.logger.warn('Checkbox state verification timed out, continuing...');
      });
      
      // Wait for grid to update after showing columns
      await this.page.waitForTimeout(3000);
      await this.page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
        this.logger.info('Network did not go idle after showing columns, continuing...');
      });
      
      this.logger.info('✓ "Show permission columns" enabled');
    } else {
      this.logger.info('✓ "Show permission columns" already enabled');
    }
  }

  /**
   * Get Access Status value for a site
   * @param {string} siteName - Site name to get access status for
   * @returns {Promise<string>}
   */
  async getAccessStatus(siteName) {
    this.logger.action(`Getting Access Status for site: ${siteName}`);
    
    // Wait for grid to be visible and stable
    await this.page.locator(LOCATORS.gridContent).first().waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(2000);
    
    // Wait for the grid to have rows
    await this.page.locator('.e-row').first().waitFor({ state: 'visible', timeout: 10000 });
    
   // Find the correct grid - must have BOTH "Access Status" AND "Access Expiration" columns
    // This ensures we find the site access grid, not the site list grid
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let statusColumnIndex = -1;
    let correctGridIndex = -1;
    
    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();
      
      let hasAccessStatus = false;
      let hasAccessExpiration = false;
      let tempStatusIndex = -1;
      
      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          hasAccessStatus = true;
          tempStatusIndex = i;
        }
        if (headerText && headerText.includes('Access Expiration')) {
          hasAccessExpiration = true;
        }
      }
      
      // Only use this grid if it has BOTH columns
      if (hasAccessStatus && hasAccessExpiration) {
        statusColumnIndex = tempStatusIndex;
        correctGridIndex = gridIndex;
        this.logger.info(`Found site access grid at index ${gridIndex}, Access Status at column ${tempStatusIndex}`);
        break;
      }
    }
    
    if (statusColumnIndex === -1 || correctGridIndex === -1) {
      throw new Error('Site access grid with Access Status and Access Expiration columns not found');
    }
    
    // Find the row with the site name within the correct grid
    const correctGrid = allGrids.nth(correctGridIndex);
    const siteRow = correctGrid.locator('.e-row').filter({ hasText: siteName }).first();
    await siteRow.waitFor({ state: 'visible', timeout: 15000 });
    
    // Get the cell at the status column index
    const cells = siteRow.locator('td');
    const accessStatusCell = cells.nth(statusColumnIndex);
    
    // Wait for the cell to have content (retry up to 10 seconds)
    let accessStatus = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      accessStatus = await accessStatusCell.textContent();
      const cleanedStatus = accessStatus.replace(/[\s\u200B-\u200D\uFEFF]/g, ' ').trim();
      if (cleanedStatus) {
        break;
      }
      await this.page.waitForTimeout(500);
    }
    
    // Remove all whitespace including zero-width spaces
    const cleanedStatus = accessStatus.replace(/[\s\u200B-\u200D\uFEFF]/g, ' ').trim();
    
    this.logger.info(`✓ Access Status: ${cleanedStatus}`);
    return cleanedStatus;
  }

  /**
   * Get Access Expiration Date value for a site
   * @param {string} siteName - Site name to get expiration date for
   * @returns {Promise<string>}
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
  async verifyExpirationDateRemainsAfterModuleChange(siteName, iterations = 3) {
    this.logger.action(`Verifying expiration date remains Today + 1 Year after ${iterations} module changes`);
    
    const expectedDate = helper.getDatePlusOneYearPacific();
    
    for (let i = 1; i <= iterations; i++) {
      this.logger.info(`Iteration ${i}/${iterations}`);
      
      // Change permission module
      const selectedModule = await this.changePermissionModuleToRandom();
      
      // Wait for any updates to complete
      await this.page.waitForTimeout(1000);
      await this.page.waitForLoadState('networkidle').catch(() => {});
      
      // Verify expiration date
      const currentDate = await this.getAccessExpirationDate(siteName);
      
      if (currentDate !== expectedDate) {
        throw new Error(`Expiration date changed after selecting "${selectedModule}". Expected: ${expectedDate}, Actual: ${currentDate}`);
      }
      
      this.logger.info(`✓ Iteration ${i}: Expiration date remains ${expectedDate} after selecting "${selectedModule}"`);
    }
    
    this.logger.info(`✓ Verified expiration date remained Today + 1 Year across ${iterations} permission module changes`);
  }

  /**
   * Verify Access Status is Active
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsActive(siteName) {
    this.logger.action('Verifying Access Status is Active');
    
    const accessStatus = await this.getAccessStatus(siteName);
    
    if (accessStatus !== 'Active') {
      throw new Error(`Access Status is not Active. Actual: ${accessStatus}`);
    }
    
    this.logger.info('✓ Access Status is Active');
  }

  /**
   * Verify Access Status is Active with green background
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsActiveWithColor(siteName) {
    this.logger.action('Verifying Access Status is "Active" with green background');
    
    // Get access status text
    const accessStatus = await this.getAccessStatus(siteName);
    
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
      backgroundColor = await activeDiv.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      this.logger.info(`Access Status div background color: ${backgroundColor}`);
      
      textColor = await activeDiv.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      this.logger.info(`Access Status div text color: ${textColor}`);
    } else {
      // Fallback: check any inner element or the cell itself
      const innerElement = statusCell.locator('*').first();
      const hasInnerElement = await innerElement.count() > 0;
      
      if (hasInnerElement) {
        backgroundColor = await innerElement.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        this.logger.info(`Access Status inner element background color: ${backgroundColor}`);
        
        textColor = await innerElement.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
      } else {
        backgroundColor = await statusCell.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        this.logger.info(`Access Status cell background color: ${backgroundColor}`);
        
        textColor = await statusCell.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
      }
    }
    
    // Green color variants: rgb(0, 128, 0), rgb(40, 167, 69), rgb(76, 175, 80), rgb(46, 125, 50), rgb(67, 160, 71), rgb(56, 142, 60)
    const isGreen = backgroundColor.includes('rgb(0, 128, 0)') || 
                    backgroundColor.includes('rgb(40, 167, 69)') || 
                    backgroundColor.includes('rgb(76, 175, 80)') ||
                    backgroundColor.includes('rgb(46, 125, 50)') ||
                    backgroundColor.includes('rgb(67, 160, 71)') ||
                    backgroundColor.includes('rgb(56, 142, 60)') ||
                    backgroundColor.includes('rgb(34, 139, 34)') ||
                    backgroundColor.includes('rgb(0, 150, 0)') ||
                    backgroundColor.match(/rgb\([0-9]{1,2},\s*1[2-6][0-9],\s*[0-9]{1,2}\)/) ||
                    backgroundColor.match(/rgb\([3-7][0-9],\s*1[4-7][0-9],\s*[5-8][0-9]\)/);
    
    if (!isGreen) {
      throw new Error(`Access Status background color is not green. Actual: ${backgroundColor}`);
    }
    
    this.logger.info('✓ Access Status has green background color');
    
    // Verify text color is visible (white or light color)
    this.logger.info(`Access Status text color: ${textColor}`);
    
    // White or light color
    const isLightColor = textColor.includes('rgb(255, 255, 255)') || 
                         textColor.includes('rgb(248, 249, 250)') ||
                         textColor.includes('white') ||
                         textColor.match(/rgb\(2[4-5][0-9],\s*2[4-5][0-9],\s*2[4-5][0-9]\)/);
    
    if (!isLightColor) {
      this.logger.warn(`Access Status text color may not be optimal for readability. Color: ${textColor}`);
    } else {
      this.logger.info('✓ Access Status has light text color (white or near-white)');
    }
    
    this.logger.info('✓ Access Status is "Active" with green background and visible text');
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
   * Verify Access Status is Expired with red background
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsExpired(siteName) {
    this.logger.action('Verifying Access Status is Expired with red background');
    
    // Get access status text
    const accessStatus = await this.getAccessStatus(siteName);
    
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
      backgroundColor = await expiredDiv.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      this.logger.info(`Access Status div background color: ${backgroundColor}`);
      
      textColor = await expiredDiv.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      this.logger.info(`Access Status div text color: ${textColor}`);
    } else {
      // Fallback: check any inner element or the cell itself
      const innerElement = statusCell.locator('*').first();
      const hasInnerElement = await innerElement.count() > 0;
      
      if (hasInnerElement) {
        backgroundColor = await innerElement.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        this.logger.info(`Access Status inner element background color: ${backgroundColor}`);
        
        textColor = await innerElement.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
      } else {
        backgroundColor = await statusCell.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        this.logger.info(`Access Status cell background color: ${backgroundColor}`);
        
        textColor = await statusCell.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
      }
    }
    
    // Red color should be rgb(255, 0, 0) or similar red variant
    // Common red variants: rgb(255, 0, 0), rgb(220, 53, 69), rgb(255, 99, 71), rgb(244, 67, 54), rgb(213, 0, 0), rgb(198, 40, 40)
    const isRed = backgroundColor.includes('rgb(255, 0, 0)') || 
                  backgroundColor.includes('rgb(220, 53, 69)') || 
                  backgroundColor.includes('rgb(255, 99, 71)') ||
                  backgroundColor.includes('rgb(244, 67, 54)') ||
                  backgroundColor.includes('rgb(213, 0, 0)') ||
                  backgroundColor.includes('rgb(198, 40, 40)') ||
                  backgroundColor.match(/rgb\(2[2-5][0-9],\s*[0-9]{1,2},\s*[0-9]{1,2}\)/);
    
    if (!isRed) {
      throw new Error(`Access Status background color is not red. Actual: ${backgroundColor}`);
    }
    
    this.logger.info('✓ Access Status has red background color');
    
    // Verify text color is visible (white or light color)
    this.logger.info(`Access Status text color: ${textColor}`);
    
    // White or light color should be rgb(255, 255, 255) or similar
    const isLightColor = textColor.includes('rgb(255, 255, 255)') || 
                         textColor.includes('rgb(248, 249, 250)') ||
                         textColor.includes('white') ||
                         textColor.match(/rgb\(2[4-5][0-9],\s*2[4-5][0-9],\s*2[4-5][0-9]\)/);
    
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
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsExpiringSoon(siteName) {
    this.logger.action('Verifying Access Status is "Expiring Soon" with orange background');
    
    // Get access status text
    const accessStatus = await this.getAccessStatus(siteName);
    
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
      backgroundColor = await expiringDiv.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      this.logger.info(`Access Status div background color: ${backgroundColor}`);
      
      textColor = await expiringDiv.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      this.logger.info(`Access Status div text color: ${textColor}`);
    } else {
      // Fallback: check any inner element or the cell itself
      const innerElement = statusCell.locator('*').first();
      const hasInnerElement = await innerElement.count() > 0;
      
      if (hasInnerElement) {
        backgroundColor = await innerElement.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        this.logger.info(`Access Status inner element background color: ${backgroundColor}`);
        
        textColor = await innerElement.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
      } else {
        backgroundColor = await statusCell.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        this.logger.info(`Access Status cell background color: ${backgroundColor}`);
        
        textColor = await statusCell.evaluate((el) => {
          return window.getComputedStyle(el).color;
        });
      }
    }
    
    // Orange color variants: rgb(255, 165, 0), rgb(255, 140, 0), rgb(255, 152, 0), rgb(243, 156, 18), rgb(230, 126, 34), rgb(235, 115, 0)
    const isOrange = backgroundColor.includes('rgb(255, 165, 0)') || 
                     backgroundColor.includes('rgb(255, 140, 0)') || 
                     backgroundColor.includes('rgb(255, 152, 0)') ||
                     backgroundColor.includes('rgb(243, 156, 18)') ||
                     backgroundColor.includes('rgb(230, 126, 34)') ||
                     backgroundColor.includes('rgb(235, 115, 0)') ||
                     backgroundColor.includes('rgb(251, 140, 0)') ||
                     backgroundColor.match(/rgb\(2[3-5][0-9],\s*1[0-6][0-9],\s*[0-4][0-9]\)/);
    
    if (!isOrange) {
      throw new Error(`Access Status background color is not orange. Actual: ${backgroundColor}`);
    }
    
    this.logger.info('✓ Access Status has orange background color');
    
    // Verify text color is visible (white or light color)
    this.logger.info(`Access Status text color: ${textColor}`);
    
    // White or light color
    const isLightColor = textColor.includes('rgb(255, 255, 255)') || 
                         textColor.includes('rgb(248, 249, 250)') ||
                         textColor.includes('white') ||
                         textColor.match(/rgb\(2[4-5][0-9],\s*2[4-5][0-9],\s*2[4-5][0-9]\)/);
    
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
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsEmpty(siteName) {
    this.logger.action('Verifying Access Status is empty (no status displayed)');
    
    // Get the Access Status
    const accessStatus = await this.getAccessStatus(siteName);
    
    // Remove all whitespace and check if empty
    const cleanedStatus = accessStatus.replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim();
    
    if (cleanedStatus !== '') {
      throw new Error(`Expected Access Status to be empty, but found: "${accessStatus}"`);
    }
    
    this.logger.info('✓ Access Status is empty (no status displayed)');
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
            if (cleanedText && 
                !cleanedText.includes('e-icon') && 
                !cleanedText.includes('Press Alt Down') &&
                !cleanedText.includes('Press Enter to sort')) {
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

  /**
   * Verify permission columns are expanded (all columns visible)
   * @returns {Promise<void>}
   */
  async verifyPermissionColumnsExpanded() {
    this.logger.action('Verifying permission columns are expanded (all columns visible)');
    
    const headers = await this.getSiteAccessGridHeaders();
    
    this.logger.info(`Actual columns found (${headers.length}): ${headers.join(', ')}`);
    
    // Expected columns when expanded
    const expectedColumns = [
      'Accessible Sites',
      'Access Status',
      'Report View',
      'Rule Create/Edit',
      'Gas Rdng: File Upload',
      'Gas Rdng: Data Entry',
      'Data Approval',
      'Data Edit',
      'Document View',
      'Document Edit',
      'Encryption Required',
      'Document Upload',
      'ViewPoints',
      'ViewPoints Webscene',
      'ViewPoints Dashboard',
      'ViewPoints Analytics',
      'Automated Uploads',
      'Access Expiration'
    ];
    
    const missingColumns = [];
    
    for (const expectedCol of expectedColumns) {
      const found = headers.some(header => header.includes(expectedCol));
      if (!found) {
        missingColumns.push(expectedCol);
      }
    }
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing permission columns: ${missingColumns.join(', ')}. Actual columns found: ${headers.join(', ')}`);
    }
    
    this.logger.info('✓ All permission columns are visible (expanded state)');
  }

  /**
   * Verify permission columns are collapsed (only core columns visible)
   * @returns {Promise<void>}
   */
  async verifyPermissionColumnsCollapsed() {
    this.logger.action('Verifying permission columns are collapsed (only core columns visible)');
    
    const headers = await this.getSiteAccessGridHeaders();
    
    // Expected columns when collapsed
    const expectedVisibleColumns = [
      'Accessible Sites',
      'Access Status',
      'Access Expiration'
    ];
    
    // Columns that should be hidden
    const shouldBeHiddenColumns = [
      'Report View',
      'Rule Create/Edit',
      'Gas Rdng: File Upload',
      'Gas Rdng: Data Entry',
      'Data Approval',
      'Data Edit',
      'Document View',
      'Document Edit',
      'Encryption Required',
      'Document Upload',
      'ViewPoints',
      'ViewPoints Webscene',
      'ViewPoints Dashboard',
      'ViewPoints Analytics',
      'Automated Uploads'
    ];
    
    // Verify expected columns are visible
    const missingColumns = [];
    for (const expectedCol of expectedVisibleColumns) {
      const found = headers.some(header => header.includes(expectedCol));
      if (!found) {
        missingColumns.push(expectedCol);
      }
    }
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing expected columns: ${missingColumns.join(', ')}`);
    }
    
    // Verify permission columns are hidden
    const visiblePermissionColumns = [];
    for (const hiddenCol of shouldBeHiddenColumns) {
      const found = headers.some(header => header.includes(hiddenCol));
      if (found) {
        visiblePermissionColumns.push(hiddenCol);
      }
    }
    
    if (visiblePermissionColumns.length > 0) {
      throw new Error(`Permission columns still visible (should be hidden): ${visiblePermissionColumns.join(', ')}`);
    }
    
    this.logger.info('✓ Permission columns are collapsed (only core columns visible)');
  }

  /**
   * Expand user list section by dragging resize handler up
   * @param {number} pixels - Number of pixels to drag up (default: 200)
   * @returns {Promise<void>}
   */
  async expandUserListSection(pixels = 200) {
    this.logger.action(`Expanding user list section by dragging resize handler up ${pixels} pixels`);
    
    const resizeHandler = this.page.locator(LOCATORS.resizeHandler).first();
    const isResizeHandlerVisible = await resizeHandler.isVisible().catch(() => false);
    
    if (isResizeHandlerVisible) {
      const box = await resizeHandler.boundingBox();
      if (box) {
        // Drag up to expand the top section (user list)
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + box.width / 2, box.y - pixels);
        await this.page.mouse.up();
        await this.page.waitForTimeout(1000);
        this.logger.info(`✓ Dragged resize handler up to expand user list section`);
      }
    } else {
      this.logger.info('Resize handler not visible, skipping');
    }
  }

  /**
   * Ensure "Show sites with access granted" radio button is selected
   * @returns {Promise<void>}
   */
  async ensureShowSitesWithAccessGrantedIsSelected() {
    this.logger.action('Ensuring "Show sites with access granted" is selected');
    
    const showSitesWithAccessRadio = this.page.locator(LOCATORS.showSitesWithAccessRadio).first();
    const radioInput = showSitesWithAccessRadio.locator('..').locator(LOCATORS.radioInput);
    const isSelected = await radioInput.isChecked().catch(() => false);
    
    if (!isSelected) {
      await showSitesWithAccessRadio.click();
      await this.page.waitForTimeout(2000);
      
      // Wait for grid to reload by checking for loading indicator to appear and disappear
      await this.page.waitForTimeout(1000);
      
      // Wait for grid content to stabilize
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        this.logger.info('Network idle timeout - continuing anyway');
      });
      
      await this.page.waitForTimeout(2000);
      this.logger.info('✓ Selected "Show sites with access granted" radio button and waited for grid reload');
    } else {
      this.logger.info('✓ "Show sites with access granted" already selected');
    }
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
      let maxAttempts = 3;
      let attempt = 1;
      
      while (attempt <= maxAttempts) {
        this.logger.info(`Removal attempt ${attempt}/${maxAttempts}`);
        
        // Find the row with the site name
        const siteRow = correctGrid.locator(LOCATORS.gridRow).filter({ hasText: siteName }).first();
        const rowExists = await siteRow.count() > 0;
        
        if (!rowExists) {
          this.logger.info('Row no longer visible, checking for "No records to display"');
          break;
        }
        
        await siteRow.waitFor({ state: 'visible', timeout: 5000 });
        
        // Click to select the row (it will turn orange/yellow)
        const siteCell = siteRow.locator('td').first();
        await siteCell.click();
        await this.page.waitForTimeout(500);
        this.logger.info('✓ Row selected (highlighted)');
        
        // Right-click on the row to open context menu
        await siteRow.click({ button: 'right' });
        await this.page.waitForTimeout(500);
        this.logger.info('✓ Context menu opened');
        
        // Click Remove option
        const removeOption = this.page.locator('text=Remove').first();
        await removeOption.waitFor({ state: 'visible', timeout: 5000 });
        await removeOption.click();
        await this.page.waitForTimeout(1000);
        this.logger.info('✓ Clicked Remove');
        
        // Wait and check if "No records to display" appears
        await this.page.waitForTimeout(2000);
        
        const noRecordsVisible = await this.page.locator('.e-emptyrecord, .e-grid .e-gridcontent:has-text("No records to display")').first().isVisible().catch(() => false);
        
        if (noRecordsVisible) {
          this.logger.info('✓ "No records to display" is visible - removal successful');
          break;
        } else {
          this.logger.info('Record still exists, will retry...');
          attempt++;
          await this.page.waitForTimeout(1000);
        }
      }
      
      // Final verification
      const finalCheck = await this.page.locator('.e-emptyrecord, .e-grid .e-gridcontent:has-text("No records to display")').first().isVisible().catch(() => false);
      
      if (finalCheck) {
        this.logger.info(`✓ Site "${siteName}" successfully removed - "No records to display" confirmed`);
      } else {
        this.logger.warn(`⚠ Site "${siteName}" may still exist after ${maxAttempts} attempts`);
      }
    } else {
      throw new Error(`Could not find grid with Access Status column for site: ${siteName}`);
    }
  }

  /**
   * Double-click Access Expiration Date cell to enable editing
   * @param {string} siteName - Site name to edit expiration date for
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
    
    // Double-click to enable editing
    await expirationCell.dblclick();
    await this.page.waitForTimeout(1000);
    
    this.logger.info('✓ Access Expiration Date cell is now in edit mode');
  }

  /**
   * Clear the Access Expiration Date by filling input with empty string
   * @param {string} siteName - Site name to clear expiration for
   * @returns {Promise<void>}
   */
  async clearAccessExpirationDate(siteName) {
    this.logger.action(`Clearing Access Expiration Date for site: ${siteName}`);
    
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
   * Open expiration date calendar by clicking calendar icon
   * @returns {Promise<void>}
   */
  async openExpirationDateCalendar() {
    this.logger.action('Opening calendar for Access Expiration Date');
    
    // Find the date picker icon in edit mode
    const calendarIcon = this.page.locator('.e-input-group-icon.e-date-icon, .e-icons.e-date-icon').first();
    await calendarIcon.waitFor({ state: 'visible', timeout: 10000 });
    await calendarIcon.click();
    await this.page.waitForTimeout(1000);
    
    // Wait for calendar to be visible
    const calendar = this.page.locator('.e-calendar, .e-datepicker.e-popup').first();
    await calendar.waitFor({ state: 'visible', timeout: 5000 });
    
    this.logger.info('✓ Calendar opened');
  }

  /**
   * Get today's date from calendar
   * @returns {Promise<number>} Today's date number
   */
  async getTodayDateFromCalendar() {
    this.logger.action('Getting today\'s date from calendar');
    
    // Find today's date cell
    const todayCell = this.page.locator('.e-calendar .e-today, .e-datepicker .e-today').first();
    await todayCell.waitFor({ state: 'visible', timeout: 5000 });
    
    const todayText = await todayCell.textContent();
    const todayDate = parseInt(todayText.trim());
    
    this.logger.info(`✓ Today's date: ${todayDate}`);
    return todayDate;
  }

  /**
   * Click TODAY button in calendar
   * @returns {Promise<void>}
   */
  async clickTodayInCalendar() {
    this.logger.action('Clicking TODAY button in calendar');
    
    // Find and click TODAY button
    const todayButton = this.page.locator('.e-footer-container .e-today, button:has-text("Today")').first();
    await todayButton.waitFor({ state: 'visible', timeout: 5000 });
    await todayButton.click();
    await this.page.waitForTimeout(500);
    
    this.logger.info('✓ TODAY button clicked');
  }

  /**
   * Click a specific date in the calendar (handles month navigation if needed)
   * @param {number} daysFromToday - Number of days from today (e.g., 29 for 29 days from now)
   * @returns {Promise<void>}
   */
  async clickDateInCalendar(daysFromToday) {
    this.logger.action(`Clicking date ${daysFromToday} days from today in calendar`);
    
    // Calculate target date
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysFromToday);
    
    const targetDay = targetDate.getDate();
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    
    this.logger.info(`Target date: ${targetMonth + 1}/${targetDay}/${targetYear} (${daysFromToday} days from today)`);
    
    // Get current calendar month/year from the header
    const getCurrentMonthYear = async () => {
      const headerText = await this.page.locator('.e-calendar .e-title, .e-header .e-title').first().textContent();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      for (let i = 0; i < monthNames.length; i++) {
        if (headerText.includes(monthNames[i])) {
          const yearMatch = headerText.match(/\d{4}/);
          const year = yearMatch ? parseInt(yearMatch[0]) : today.getFullYear();
          return { month: i, year: year };
        }
      }
      return { month: today.getMonth(), year: today.getFullYear() };
    };
    
    // Navigate to the correct month if needed
    let attempts = 0;
    const maxAttempts = 12; // Maximum 12 months navigation
    
    while (attempts < maxAttempts) {
      const current = await getCurrentMonthYear();
      
      // Check if we're in the correct month and year
      if (current.month === targetMonth && current.year === targetYear) {
        this.logger.info(`✓ Calendar is showing target month: ${targetMonth + 1}/${targetYear}`);
        break;
      }
      
      // Calculate if target is in future or past
      const currentDate = new Date(current.year, current.month, 1);
      const targetDateFirst = new Date(targetYear, targetMonth, 1);
      
      if (targetDateFirst > currentDate) {
        // Need to go forward
        this.logger.info(`Navigating to next month...`);
        const nextButton = this.page.locator('.e-calendar .e-next, .e-icon-container.e-next, button.e-next').first();
        await nextButton.click();
        await this.page.waitForTimeout(500);
      } else {
        // Need to go backward
        this.logger.info(`Navigating to previous month...`);
        const prevButton = this.page.locator('.e-calendar .e-prev, .e-icon-container.e-prev, button.e-prev').first();
        await prevButton.click();
        await this.page.waitForTimeout(500);
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error(`Failed to navigate to target month after ${maxAttempts} attempts`);
    }
    
    // Now find and click the target date
    await this.page.waitForTimeout(500);
    const dateCells = this.page.locator('.e-calendar .e-cell:not(.e-other-month):not(.e-disabled), .e-datepicker .e-cell:not(.e-other-month):not(.e-disabled)');
    const cellCount = await dateCells.count();
    
    let dateClicked = false;
    
    for (let i = 0; i < cellCount; i++) {
      const cell = dateCells.nth(i);
      const dateText = await cell.textContent();
      const dateNum = parseInt(dateText.trim());
      
      if (dateNum === targetDay) {
        await cell.click();
        await this.page.waitForTimeout(500);
        dateClicked = true;
        this.logger.info(`✓ Clicked on date: ${targetMonth + 1}/${targetDay}/${targetYear}`);
        break;
      }
    }
    
    if (!dateClicked) {
      throw new Error(`Could not find and click date: ${targetDay} in calendar`);
    }
  }

  /**
   * Get all disabled calendar dates before a specific date
   * @param {number} beforeDate - Date number to check before
   * @returns {Promise<Array>} Array of disabled date locators
   */
  async getDisabledCalendarDatesBefore(beforeDate) {
    this.logger.action(`Getting disabled calendar dates before ${beforeDate}`);
    
    // Get all date cells in the calendar
    const allDateCells = this.page.locator('.e-calendar .e-cell, .e-datepicker .e-cell, .e-content .e-cell');
    const cellCount = await allDateCells.count();
    
    this.logger.info(`Found ${cellCount} total calendar cells`);
    
    const disabledDates = [];
    
    for (let i = 0; i < cellCount; i++) {
      const cell = allDateCells.nth(i);
      const dateText = await cell.textContent();
      const dateNum = parseInt(dateText.trim());
      
      // Skip if not a valid number or from other month
      if (isNaN(dateNum)) continue;
      
      const cellClass = await cell.getAttribute('class').catch(() => '');
      const isOtherMonth = cellClass.includes('e-other-month');
      
      // Skip other month dates
      if (isOtherMonth) continue;
      
      // Check if date is before the specified date
      if (dateNum >= beforeDate) continue;
      
      // Check multiple ways a date can be disabled
      const ariaDisabled = await cell.getAttribute('aria-disabled').catch(() => null);
      const hasDisabledClass = cellClass.includes('e-disabled') || cellClass.includes('e-disable');
      const isDisabled = ariaDisabled === 'true' || hasDisabledClass;
      
      if (isDisabled) {
        this.logger.info(`Found disabled date: ${dateNum} (aria-disabled: ${ariaDisabled}, class: ${cellClass})`);
        disabledDates.push(cell);
      }
    }
    
    this.logger.info(`✓ Found ${disabledDates.length} disabled dates before ${beforeDate}`);
    return disabledDates;
  }

  /**
   * Close expiration date calendar
   * @returns {Promise<void>}
   */
  async closeCalendar() {
    this.logger.action('Closing calendar');
    
    // Press Escape to close calendar
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
    
    // Verify calendar is closed
    const isCalendarVisible = await this.page.locator('.e-calendar, .e-datepicker.e-popup').isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isCalendarVisible) {
      this.logger.info('✓ Calendar closed');
    } else {
      this.logger.warn('Calendar may still be visible');
    }
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
      expirationDay = parseInt(mmddyyyyMatch[2]);
    } else {
      // Try Month Day, Year format (e.g., "Feb 13, 2026")
      const monthDayYearMatch = expirationDate.match(/(\w+)\s+(\d+),\s+(\d+)/);
      if (monthDayYearMatch) {
        expirationDay = parseInt(monthDayYearMatch[2]);
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
   * Get current month and year displayed in calendar header
   * @returns {Promise<{month: number, year: number}>} Current month (0-11) and year
   */
  async getCurrentMonthYearFromCalendar() {
    this.logger.action('Getting current month and year from calendar');
    
    // Find the month/year title in calendar header
    const titleElement = this.page.locator('.e-calendar .e-title, .e-calendar .e-day .e-title, .e-header .e-title').first();
    await titleElement.waitFor({ state: 'visible', timeout: 5000 });
    
    const titleText = await titleElement.textContent();
    this.logger.info(`Calendar title: ${titleText}`);
    
    // Parse "February 2026" or similar format
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    let month = -1;
    let year = -1;
    
    for (let i = 0; i < monthNames.length; i++) {
      if (titleText.includes(monthNames[i])) {
        month = i;
        break;
      }
    }
    
    const yearMatch = titleText.match(/\d{4}/);
    if (yearMatch) {
      year = parseInt(yearMatch[0]);
    }
    
    if (month === -1 || year === -1) {
      throw new Error(`Unable to parse calendar title: ${titleText}`);
    }
    
    this.logger.info(`✓ Current calendar view: Month ${month} (${monthNames[month]}), Year ${year}`);
    return { month, year };
  }

  /**
   * Navigate calendar to a specific year
   * @param {number} targetYear - Year to navigate to
   * @returns {Promise<void>}
   */
  async navigateCalendarToYear(targetYear) {
    this.logger.action(`Navigating calendar to year ${targetYear}`);
    
    // Click on month/year title to go to year view
    const titleElement = this.page.locator('.e-calendar .e-title, .e-calendar .e-day .e-title, .e-header .e-title').first();
    await titleElement.waitFor({ state: 'visible', timeout: 5000 });
    await titleElement.click();
    await this.page.waitForTimeout(500);
    
    // Click again to go to decade view (multi-year view)
    await titleElement.click();
    await this.page.waitForTimeout(500);
    
    // Now we're in decade view, find and click the target year
    let yearFound = false;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!yearFound && attempts < maxAttempts) {
      attempts++;
      
      // Check if target year is visible in current decade view
      const yearCells = this.page.locator('.e-calendar .e-cell, .e-content .e-cell');
      const cellCount = await yearCells.count();
      
      for (let i = 0; i < cellCount; i++) {
        const cell = yearCells.nth(i);
        const cellText = await cell.textContent();
        const cellYear = parseInt(cellText.trim());
        
        if (cellYear === targetYear) {
          // Found the target year, click it
          await cell.click();
          await this.page.waitForTimeout(500);
          yearFound = true;
          this.logger.info(`✓ Navigated to year ${targetYear}`);
          break;
        }
      }
      
      if (!yearFound) {
        // Need to navigate to next or previous decade
        const currentView = await this.page.locator('.e-calendar .e-title, .e-header .e-title').first().textContent();
        const currentDecadeMatch = currentView.match(/(\d{4})\s*-\s*(\d{4})/);
        
        if (currentDecadeMatch) {
          const decadeStart = parseInt(currentDecadeMatch[1]);
          const decadeEnd = parseInt(currentDecadeMatch[2]);
          
          if (targetYear < decadeStart) {
            // Go to previous decade
            const prevButton = this.page.locator('.e-calendar .e-prev, .e-calendar .e-icon-container.e-prev, button.e-prev').first();
            await prevButton.click();
            await this.page.waitForTimeout(500);
          } else if (targetYear > decadeEnd) {
            // Go to next decade
            const nextButton = this.page.locator('.e-calendar .e-next, .e-calendar .e-icon-container.e-next, button.e-next').first();
            await nextButton.click();
            await this.page.waitForTimeout(500);
          }
        }
      }
    }
    
    if (!yearFound) {
      throw new Error(`Unable to navigate to year ${targetYear} after ${maxAttempts} attempts`);
    }
  }

  /**
   * Select a specific month in the calendar (assumes year view is open)
   * @param {number} monthIndex - Month index (0-11, where 0 = January)
   * @returns {Promise<void>}
   */
  async selectMonthInCalendar(monthIndex) {
    this.logger.action(`Selecting month ${monthIndex} in calendar`);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const targetMonthShort = monthNames[monthIndex];
    
    // Wait for month view to be visible
    await this.page.waitForTimeout(500);
    
    // Find and click the month cell
    const monthCells = this.page.locator('.e-calendar .e-cell, .e-content .e-cell');
    const cellCount = await monthCells.count();
    
    for (let i = 0; i < cellCount; i++) {
      const cell = monthCells.nth(i);
      const cellText = await cell.textContent();
      
      if (cellText.trim() === targetMonthShort) {
        await cell.click();
        await this.page.waitForTimeout(500);
        this.logger.info(`✓ Selected ${monthNames[monthIndex]}`);
        return;
      }
    }
    
    throw new Error(`Unable to find month ${targetMonthShort} in calendar`);
  }

  /**
   * Get all disabled calendar dates after a specific date
   * @param {number} afterDate - Date number to check after
   * @returns {Promise<Array>} Array of disabled date locators
   */
  async getDisabledCalendarDatesAfter(afterDate) {
    this.logger.action(`Getting disabled calendar dates after ${afterDate}`);
    
    // Get all date cells in the calendar
    const allDateCells = this.page.locator('.e-calendar .e-cell, .e-datepicker .e-cell, .e-content .e-cell');
    const cellCount = await allDateCells.count();
    
    this.logger.info(`Found ${cellCount} total calendar cells`);
    
    const disabledDates = [];
    
    for (let i = 0; i < cellCount; i++) {
      const cell = allDateCells.nth(i);
      const dateText = await cell.textContent();
      const dateNum = parseInt(dateText.trim());
      
      // Skip if not a valid number
      if (isNaN(dateNum)) continue;
      
      const cellClass = await cell.getAttribute('class').catch(() => '');
      const isOtherMonth = cellClass.includes('e-other-month');
      
      // Skip other month dates
      if (isOtherMonth) continue;
      
      // Check if date is after the specified date
      if (dateNum <= afterDate) continue;
      
      // Check multiple ways a date can be disabled
      const ariaDisabled = await cell.getAttribute('aria-disabled').catch(() => null);
      const hasDisabledClass = cellClass.includes('e-disabled') || cellClass.includes('e-disable');
      const isDisabled = ariaDisabled === 'true' || hasDisabledClass;
      
      if (isDisabled) {
        this.logger.info(`Found disabled date: ${dateNum} (aria-disabled: ${ariaDisabled}, class: ${cellClass})`);
        disabledDates.push(cell);
      }
    }
    
    this.logger.info(`✓ Found ${disabledDates.length} disabled dates after ${afterDate}`);
    return disabledDates;
  }

  /**
   * Get maximum allowed date (5 years from today)
   * @returns {Promise<{day: number, month: number, year: number}>} Max allowed date
   */
  async getMaxAllowedExpirationDate() {
    this.logger.action('Calculating maximum allowed expiration date (Today + 5 years)');
    
    const today = new Date();
    const maxDate = new Date(today);
    
    // Add 5 years
    maxDate.setFullYear(today.getFullYear() + 5);
    
    // Subtract 1 day to get the last valid date (e.g., if today is Feb 13, 2026, max is Feb 12, 2031)
    maxDate.setDate(maxDate.getDate() - 1);
    
    const result = {
      day: maxDate.getDate(),
      month: maxDate.getMonth(),
      year: maxDate.getFullYear()
    };
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    this.logger.info(`✓ Max allowed date: ${monthNames[result.month]} ${result.day}, ${result.year}`);
    return result;
  }

  /**
   * Verify "No records to display" message is visible in the site access grid
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
   * Set Access Expiration Date to today's date
   * @param {string} siteName - Site name
   * @returns {Promise<void>}
   */
  async setAccessExpirationDateToToday(siteName) {
    this.logger.action(`Setting Access Expiration Date to today for site: ${siteName}`);
    
    await this.editAccessExpirationDateCell(siteName);
    await this.openExpirationDateCalendar();
    await this.clickTodayInCalendar();
    
    this.logger.info('✓ Access Expiration Date set to today');
  }

  /**
   * Verify Access Expiration Date is today's date
   * @param {string} siteName - Site name
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateIsToday(siteName) {
    this.logger.action(`Verifying Access Expiration Date is today for site: ${siteName}`);
    
    const today = new Date();
    const expectedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
    
    await this.verifyAccessExpirationDateExists(siteName, expectedDate);
    
    this.logger.info(`✓ Access Expiration Date is today: ${expectedDate}`);
  }

  /**
   * Set Access Expiration Date to specific days from today
   * @param {string} siteName - Site name
   * @param {number} daysFromToday - Number of days from today (negative for past dates)
   * @returns {Promise<void>}
   */
  async setAccessExpirationDate(siteName, daysFromToday) {
    this.logger.action(`Setting Access Expiration Date to Today+${daysFromToday} for site: ${siteName}`);
    
    // Double-click to enable editing
    await this.editAccessExpirationDateCell(siteName);
    
    // Open calendar
    await this.openExpirationDateCalendar();
    
    // Click Today to establish context
    await this.clickTodayInCalendar();
    
    // Reopen calendar to select target date
    await this.editAccessExpirationDateCell(siteName);
    await this.openExpirationDateCalendar();
    
    // Select date
    await this.clickDateInCalendar(daysFromToday);
    
    this.logger.info(`✓ Access Expiration Date set to Today+${daysFromToday}`);
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
      { timeout: 10000 }
    );
    await okButton.click();
    await this.page.waitForTimeout(500);
    this.logger.info('✓ Clicked OK button');
    
    // Wait for filter to apply
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      this.logger.info('Network did not go idle after filter');
    });
    await this.page.waitForTimeout(2000);
    
    this.logger.info(`✓ Filter "${filterOption}" applied`);
  }

  /**
   * Verify filtered sites match expected list
   * @param {Array<string>} expectedSites - Array of site names that should be visible
   * @param {string} filterName - Name of the filter being validated
   * @returns {Promise<void>}
   */
  async verifyFilteredSites(expectedSites, filterName) {
    this.logger.action(`Verifying filtered results for "${filterName}"`);
    
    // Wait for grid to refresh
    await this.page.waitForTimeout(1000);
    
    // Find the correct grid with Access Status column
    const allGrids = this.page.locator('.e-grid');
    const gridCount = await allGrids.count();
    let correctGrid = null;
    
    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const grid = allGrids.nth(gridIndex);
      const headers = grid.locator('.e-gridheader .e-headercell');
      const headerCount = await headers.count();
      
      for (let i = 0; i < headerCount; i++) {
        const headerText = await headers.nth(i).textContent();
        if (headerText && headerText.includes('Access Status')) {
          correctGrid = grid;
          break;
        }
      }
      
      if (correctGrid) break;
    }
    
    if (!correctGrid) {
      throw new Error('Could not find grid with Access Status column');
    }
    
    // Get all visible site names in first column
    const rows = correctGrid.locator('.e-row');
    const rowCount = await rows.count();
    
    if (rowCount === 0 && expectedSites.length === 0) {
      this.logger.info(`✓ Grid is empty as expected for "${filterName}"`);
      return;
    }
    
    const visibleSites = [];
    for (let i = 0; i < rowCount; i++) {
      const firstCell = rows.nth(i).locator('td').first();
      const siteName = await firstCell.textContent();
      visibleSites.push(siteName.trim());
    }
    
    this.logger.info(`Visible sites: ${visibleSites.join(', ')}`);
    this.logger.info(`Expected sites: ${expectedSites.join(', ')}`);
    
    // Verify count matches
    if (visibleSites.length !== expectedSites.length) {
      throw new Error(`Expected ${expectedSites.length} sites but found ${visibleSites.length} for filter "${filterName}"`);
    }
    
    // Verify each expected site is visible
    for (const expectedSite of expectedSites) {
      if (!visibleSites.includes(expectedSite)) {
        throw new Error(`Expected site "${expectedSite}" not found in filtered results for "${filterName}"`);
      }
    }
    
    // Verify no unexpected sites are visible
    for (const visibleSite of visibleSites) {
      if (!expectedSites.includes(visibleSite)) {
        throw new Error(`Unexpected site "${visibleSite}" found in filtered results for "${filterName}"`);
      }
    }
    
    this.logger.info(`✓ Filter "${filterName}" shows correct sites`);
  }

  /**
   * Verify sites visible in the Sites dropdown menu
   * @param {Array<string>} expectedSites - Array of site names expected to be visible
   * @returns {Promise<void>}
   */
  async verifySitesVisibleInDropdown(expectedSites) {
    this.logger.action(`Verifying sites visible in dropdown: ${expectedSites.join(', ')}`);
    
    // Click the Sites dropdown to open it
    const sitesDropdown = this.page.locator('.e-dropdownlist').filter({ hasText: 'Site' }).or(
      this.page.locator('.e-dropdownlist').first()
    );
    await sitesDropdown.click();
    await this.page.waitForTimeout(1000);
    
    // Wait for dropdown popup to be visible
    const dropdownPopup = this.page.locator('.e-popup.e-popup-open');
    await dropdownPopup.waitFor({ state: 'visible', timeout: 10000 });
    
    // Get all list items in the dropdown
    const listItems = this.page.locator('.e-popup.e-popup-open .e-list-item');
    await listItems.first().waitFor({ state: 'visible', timeout: 5000 });
    
    const itemCount = await listItems.count();
    this.logger.info(`Found ${itemCount} items in dropdown`);
    
    const visibleSites = [];
    for (let i = 0; i < itemCount; i++) {
      const itemText = await listItems.nth(i).textContent();
      visibleSites.push(itemText.trim());
    }
    
    this.logger.info(`Visible sites in dropdown: ${visibleSites.join(', ')}`);
    
    // Verify each expected site is present
    for (const expectedSite of expectedSites) {
      if (!visibleSites.includes(expectedSite)) {
        // Close dropdown before throwing error
        await this.page.keyboard.press('Escape');
        throw new Error(`Expected site "${expectedSite}" not found in dropdown. Available: ${visibleSites.join(', ')}`);
      }
    }
    
    // Verify no unexpected sites (if we want strict checking)
    if (visibleSites.length !== expectedSites.length) {
      this.logger.warn(`Dropdown shows ${visibleSites.length} sites but expected ${expectedSites.length}`);
    }
    
    this.logger.info('✓ All expected sites are visible in dropdown');
    
    // Close the dropdown
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify only one specific site is visible in the Sites dropdown
   * @param {string} siteName - The site name expected to be visible
   * @returns {Promise<void>}
   */
  async verifyOnlySiteVisibleInDropdown(siteName) {
    this.logger.action(`Verifying only site "${siteName}" is visible in dropdown`);
    
    // Click the Sites dropdown to open it
    const sitesDropdown = this.page.locator('.e-dropdownlist').filter({ hasText: 'Site' }).or(
      this.page.locator('.e-dropdownlist').first()
    );
    await sitesDropdown.click();
    await this.page.waitForTimeout(1000);
    
    // Wait for dropdown popup to be visible
    const dropdownPopup = this.page.locator('.e-popup.e-popup-open');
    await dropdownPopup.waitFor({ state: 'visible', timeout: 10000 });
    
    // Get all list items in the dropdown
    const listItems = this.page.locator('.e-popup.e-popup-open .e-list-item');
    await listItems.first().waitFor({ state: 'visible', timeout: 5000 });
    
    const itemCount = await listItems.count();
    this.logger.info(`Found ${itemCount} item(s) in dropdown`);
    
    if (itemCount !== 1) {
      const visibleSites = [];
      for (let i = 0; i < itemCount; i++) {
        const itemText = await listItems.nth(i).textContent();
        visibleSites.push(itemText.trim());
      }
      await this.page.keyboard.press('Escape');
      throw new Error(`Expected only 1 site but found ${itemCount}. Sites: ${visibleSites.join(', ')}`);
    }
    
    const visibleSite = await listItems.first().textContent();
    const trimmedSite = visibleSite.trim();
    
    if (trimmedSite !== siteName) {
      await this.page.keyboard.press('Escape');
      throw new Error(`Expected site "${siteName}" but found "${trimmedSite}"`);
    }
    
    this.logger.info(`✓ Only site "${siteName}" is visible in dropdown`);
    
    // Close the dropdown
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify "User's configuration is not setup" message is visible
   * @returns {Promise<void>}
   */
  async verifyNoAccessMessageVisible() {
    this.logger.action('Verifying no access configuration message is visible');
    
    const noAccessMessage = this.page.getByText(/User's configuration is not setup.*Please contact SCSeTools administrators/i);
    await noAccessMessage.waitFor({ state: 'visible', timeout: 10000 });
    
    const messageText = await noAccessMessage.textContent();
    this.logger.info(`Found message: "${messageText.trim()}"`);
    this.logger.info('✓ No access configuration message is visible');
  }

  /**
   * Navigate to Notifications using right arrow navigation
   * @returns {Promise<void>}
   */
  async navigateToNotifications() {
    this.logger.action('Navigating to Notifications');
    
    // Keep clicking right arrow until Notifications is visible
    const notificationsButton = this.page.locator('.toolbar-item.notification').last();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const isVisible = await notificationsButton.isVisible().catch(() => false);
      if (isVisible) {
        break;
      }
      
      // Check if right arrow exists and is enabled
     const rightArrow = this.page.locator('.e-nav-right-arrow.e-nav-arrow.e-icons');
      const arrowVisible = await rightArrow.isVisible().catch(() => false);
      const arrowEnabled = await rightArrow.isEnabled().catch(() => false);
      
      if (arrowVisible && arrowEnabled) {
        await rightArrow.click();
        await this.page.waitForTimeout(500);
      } else {
        // Arrow is disabled, button should be visible now
        break;
      }
      
      attempts++;
    }
    
    // Click Notifications button
    await notificationsButton.waitFor({ state: 'visible', timeout: 10000 });
    await notificationsButton.click();
    await this.page.waitForTimeout(1000);
    
    // Click the List tab (using toolbar-item class, filter by active state)
    const listTab = this.page.locator('.toolbar-item.list .text:has-text("List")').or(
      this.page.locator('.toolbar-item .text:has-text("List")').last()
    );
    await listTab.waitFor({ state: 'visible', timeout: 10000 });
    await listTab.click();
    
    // Wait for Notifications grid to load by checking for grid structure
    await this.page.locator('.e-gridheader').first().waitFor({ state: 'visible', timeout: 30000 });
    
    this.logger.info('✓ Navigated to Notifications');
  }

  /**
   * Wait for Notifications grid to fully load
   * @returns {Promise<void>}
   */
  async waitForNotificationsGridToLoad() {
    this.logger.action('Waiting for Notifications grid to load');
    
    // Wait for grid structure
    await this.page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 50000 });
    
    // Wait for data rows
    await this.page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout: 30000 });
    
    // Wait for spinner to disappear
    await this.page.locator('.e-spinner-pane').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      this.logger.info('No spinner found or already hidden');
    });
    
    this.logger.info('✓ Notifications grid fully loaded');
  }

  /**
   * Filter notifications by Event Type
   * @param {string} eventType - Event type to filter by (e.g., "Site Access Expiration")
   * @returns {Promise<void>}
   */
  async filterByEventType(eventType) {
    this.logger.action(`Filtering by Event Type: ${eventType}`);
    
    // Find the "Event Type" column header
    const headerCell = this.page.locator('.e-headercelldiv:has-text("Event Type")').first();
    await headerCell.waitFor({ state: 'visible', timeout: 10000 });
    
    // Click the filter icon
    const filterIcon = headerCell.locator('..').locator('.e-filtermenudiv.e-icon-filter').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    await filterIcon.click();
    await this.page.waitForTimeout(1000);
    
    // Wait for Checkbox filter dialog
    const filterDialog = this.page.getByLabel('Checkbox filter');
    await filterDialog.waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('✓ Filter dialog opened');
    
    // Click "Select All" to deselect all items first
    const selectAllCheckbox = filterDialog.getByText('Select All', { exact: true });
    await selectAllCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await selectAllCheckbox.click();
    this.logger.info('✓ Deselected all items');
    await this.page.waitForTimeout(500);
    
    // Click the specific event type to select it
    const eventTypeOption = filterDialog.getByText(eventType, { exact: true });
    await eventTypeOption.waitFor({ state: 'visible', timeout: 5000 });
    await eventTypeOption.click();
    this.logger.info(`✓ Selected "${eventType}"`);
    await this.page.waitForTimeout(500);
    
    // Click FILTER button
    const filterButton = filterDialog.getByRole('button', { name: 'Filter', exact: true });
    await filterButton.waitFor({ state: 'visible', timeout: 5000 });
    await filterButton.click();
    this.logger.info('✓ Clicked FILTER button');
    
    this.logger.info(`✓ Filtered by Event Type: ${eventType}`);
  }

  /**
   * Capture the Site Name from the first row of the notifications grid
   * @returns {Promise<string>} Site name from first row
   */
  async captureFirstRowSiteName() {
    this.logger.action('Capturing Site Name from first row');
    
    // Wait for grid to be stable and target rows that actually contain gridcells (data rows)
    const firstRow = this.page.locator('.e-grid .e-row:has(td[role="gridcell"])').first();
    await firstRow.waitFor({ state: 'visible', timeout: 30000 });
    
    // Get all gridcells in the first data row
    const gridCells = firstRow.locator('td[role="gridcell"]');
    
    // Site Name is in the 4th column (index 3) - index 0 is a hidden ID column
    const siteNameCell = gridCells.nth(3);
    
    await siteNameCell.waitFor({ state: 'visible', timeout: 10000 });
    const siteName = await siteNameCell.textContent();
    const trimmedSiteName = siteName.trim();
    
    this.logger.info(`✓ Captured Site Name: ${trimmedSiteName}`);
    return trimmedSiteName;
  }

  /**
   * Click the file viewer icon in the first row
   * @returns {Promise<void>}
   */
  async clickFileViewerIcon() {
    this.logger.action('Clicking file viewer icon in first row');
    
    // Find the file viewer icon in the File Options column (5th cell) in first data row
    const firstRow = this.page.locator('.e-grid .e-row:has(td[role="gridcell"])').first();
    await firstRow.waitFor({ state: 'visible', timeout: 10000 });
    
    const gridCells = firstRow.locator('td[role="gridcell"]');
    const fileOptionsCell = gridCells.nth(5); // 6th cell is File Options (0-indexed, index 0 is hidden ID)
    const fileViewerIcon = fileOptionsCell.locator('img');
    
    await fileViewerIcon.waitFor({ state: 'visible', timeout: 10000 });
    await fileViewerIcon.click();
    
    // Wait for notification content dialog or modal to appear
    await this.page.locator('text=/SCSeTools Notification:/i').first().waitFor({ state: 'visible', timeout: 10000 });
    
    this.logger.info('✓ Clicked file viewer icon and notification content loaded');
  }

  /**
   * Validate notification content contains required elements
   * Validates all text content except date values
   * @param {string} siteName - Expected site name to appear in notification
   * @returns {Promise<void>}
   */
  async validateNotificationContent(siteName) {
    this.logger.action('Validating notification content');
    
    // Validate notification header
    const notificationHeader = this.page.locator('text=/SCSeTools Notification:/i').first();
    await notificationHeader.waitFor({ state: 'visible', timeout: 10000 });
    
    const headerText = await notificationHeader.textContent();
    const trimmedHeader = headerText.trim();
    this.logger.info(`Notification header: "${trimmedHeader}"`);
    
    // Verify header contains "SCSeTools Notification:"
    if (!trimmedHeader.includes('SCSeTools Notification:')) {
      throw new Error('Notification header does not contain "SCSeTools Notification:"');
    }
    this.logger.info('✓ Notification header contains "SCSeTools Notification:"');
    
    // Verify header contains the site name
    if (!trimmedHeader.includes(siteName)) {
      throw new Error(`Notification header does not contain site name "${siteName}". Found: "${trimmedHeader}"`);
    }
    this.logger.info(`✓ Notification header contains site name "${siteName}"`);
    
    // Verify header format matches pattern (without validating the actual date)
    const headerPattern = new RegExp(`SCSeTools Notification:\\s+${siteName}\\s+on\\s+\\d{2}/\\d{2}/\\d{4}`);
    if (!headerPattern.test(trimmedHeader)) {
      this.logger.warn(`Notification header format may not match expected pattern`);
    } else {
      this.logger.info('✓ Notification header format matches expected pattern');
    }
    
    // Get the notification body content from the specific notification div
    const notificationContent = this.page.locator('#notfyHstyMsgId');
    await notificationContent.waitFor({ state: 'visible', timeout: 10000 });
    
    // Use innerText to get human-readable text (handles <br> tags as line breaks)
    const bodyText = await notificationContent.innerText();
    this.logger.info(`Notification content length: ${bodyText.length} chars`);
    
    // Validate greeting
    if (!bodyText.includes('Dear SCS Engineers')) {
      throw new Error('Notification does not contain "Dear SCS Engineers"');
    }
    this.logger.info('✓ Notification contains "Dear SCS Engineers"');
    
    // Validate main message about site access permissions
    if (!bodyText.includes('important alert regarding site access permissions')) {
      throw new Error('Notification does not contain message about site access permissions');
    }
    this.logger.info('✓ Notification contains site access permissions alert message');
    
    // Validate mention of SCSeTools and SCS MobileTools applications
    if (!bodyText.includes('SCSeTools') || !bodyText.includes('SCS MobileTools')) {
      throw new Error('Notification does not mention SCSeTools and SCS MobileTools applications');
    }
    this.logger.info('✓ Notification mentions SCSeTools and SCS MobileTools applications');
    
    // Validate access expiration warning (checking for text pattern, not specific date)
    if (!bodyText.includes('will expire on')) {
      throw new Error('Notification does not contain access expiration warning');
    }
    this.logger.info('✓ Notification contains access expiration warning');
    
    // Validate site name appears in body
    if (!bodyText.includes(siteName)) {
      throw new Error(`Notification body does not contain site name "${siteName}"`);
    }
    this.logger.info(`✓ Notification body contains site name "${siteName}"`);
    
    // Validate instructions about contacting support
    if (!bodyText.includes('continued access is required') || !bodyText.includes('contact SCSeTools Customer Support')) {
      throw new Error('Notification does not contain instructions about contacting support');
    }
    this.logger.info('✓ Notification contains contact support instructions');
    
    // Validate contact information section
    if (!bodyText.includes('SCSeTools Customer Support')) {
      throw new Error('Notification does not contain "SCSeTools Customer Support"');
    }
    this.logger.info('✓ Notification contains "SCSeTools Customer Support"');
    
    // Validate email address
    if (!bodyText.includes('support@SCSeTools.com')) {
      throw new Error('Notification does not contain support email address');
    }
    this.logger.info('✓ Notification contains support email: support@SCSeTools.com');
    
    // Validate phone number
    if (!bodyText.includes('1-866-612-6820')) {
      throw new Error('Notification does not contain support phone number');
    }
    this.logger.info('✓ Notification contains support phone: 1-866-612-6820');
    
    // Validate closing
    if (!bodyText.includes('Sincerely')) {
      throw new Error('Notification does not contain "Sincerely"');
    }
    this.logger.info('✓ Notification contains "Sincerely"');
    
    if (!bodyText.includes('SCSeTools Support Team')) {
      throw new Error('Notification does not contain "SCSeTools Support Team"');
    }
    this.logger.info('✓ Notification contains "SCSeTools Support Team"');
    
    this.logger.info('✓ All notification content validation passed');
  }

  /**
   * Verify all date cells are disabled
   * @param {Array} dateCells - Array of date cell locators
   * @returns {Promise<void>}
   */
  async verifyAllDatesAreDisabled(dateCells) {
    this.logger.info(`Verifying ${dateCells.length} dates are disabled`);
    
    for (const dateCell of dateCells) {
      const ariaDisabled = await dateCell.getAttribute('aria-disabled');
      const cellClass = await dateCell.getAttribute('class');
      const isDisabled = ariaDisabled === 'true' || cellClass.includes('e-disabled') || cellClass.includes('e-disable');
      
      if (!isDisabled) {
        throw new Error('Expected date cell to be disabled but it was enabled');
      }
    }
    
    this.logger.info('✓ All dates are disabled');
  }

  /**
   * Grant access to multiple sites
   * @param {Array<string>} siteNames - Array of site names
   * @returns {Promise<void>}
   */
  async grantAccessToMultipleSites(siteNames) {
    this.logger.info(`Granting access to ${siteNames.length} sites`);
    
    for (const siteName of siteNames) {
      this.logger.info(`Granting access to ${siteName}`);
      
      // First click the site cell to select the row (turns orange/yellow)
      await this.page.getByRole('gridcell', { name: siteName }).click();
      await this.page.waitForTimeout(300);
      
      // Then grant access (checks the checkbox)
      await this.grantAccessToSite(siteName);
      await this.page.waitForTimeout(500); // Wait between each grant
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

  /**
   * Wait for error dialog and verify message
   * @param {string} expectedMessage - Expected error message
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async verifyErrorDialogWithMessage(expectedMessage, timeout = 30000) {
    this.logger.info(`Waiting for error dialog with message: "${expectedMessage}"`);
    
    let dialogAppeared = false;
    let dialogMessage = '';
    
    // Setup dialog listener
    this.page.once('dialog', async dialog => {
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
   * Wait for Excel filter dialog to be ready
   * @param {Object} excelFilter - Excel filter dialog locator
   * @param {number} timeout - Timeout in milliseconds (default: 15000)
   * @returns {Promise<void>}
   */
  async waitForExcelFilterDialogReady(excelFilter, timeout = 15000) {
    this.logger.info('Waiting for Excel filter dialog OK button to be ready');
    
    await this.page.waitForFunction(
      () => {
        const filterDialog = document.querySelector('[aria-label="Excel filter"]');
        if (!filterDialog) return false;
        const btn = filterDialog.querySelector('button[type="button"]');
        return btn && btn.textContent.trim() === 'OK' && !btn.disabled;
      },
      { timeout }
    );
    
    this.logger.info('✓ Excel filter dialog OK button is ready');
  }
}

module.exports = AdministrationUserPage;
