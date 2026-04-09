const BasePage = require('../../basePage');
const helper = require('../../../utils/helper');
const LOCATORS = require('../../constants/administrationUserPage.constants');
const SaveOperations = require('./modules/SaveOperations');
const UserNavigationOperations = require('./modules/UserNavigationOperations');
const NotificationOperations = require('./modules/NotificationOperations');
const UserFilterOperations = require('./modules/UserFilterOperations');
const GroupAccessOperations = require('./modules/GroupAccessOperations');
const CalendarOperations = require('./modules/CalendarOperations');
const AccessExpirationDateOperations = require('./modules/AccessExpirationDateOperations');
const SiteAccessOperations = require('./modules/SiteAccessOperations');
const AccessStatusVerificationOperations = require('./modules/AccessStatusVerificationOperations');
const GridWaitOperations = require('./modules/GridWaitOperations');

// Import test-specific constants
const { testTimeouts: TIMEOUTS, datePatterns: DATE_PATTERNS, columnHeaders: COLUMN_HEADERS } = LOCATORS;

/**
 * Administration User Page class extending BasePage
 * Handles all interactions with the Administration User functionality
 */
class AdministrationUserPage extends BasePage {
  constructor(page) {
    super(page);
    // Initialize modules
    this.saveOperations = new SaveOperations(page);
    this.navigation = new UserNavigationOperations(page);
    this.notificationOps = new NotificationOperations(page);
    this.filterOps = new UserFilterOperations(page);
    this.groupOps = new GroupAccessOperations(page);
    this.calendarOps = new CalendarOperations(page);
    this.expirationDateOps = new AccessExpirationDateOperations(page);
    this.siteAccessOps = new SiteAccessOperations(page);
    this.statusVerificationOps = new AccessStatusVerificationOperations(page);
    this.gridWaitOps = new GridWaitOperations(page);
  }
  /**
   * Navigate to Administration tab
   * @returns {Promise<void>}
   */
  async navigateToAdministrationTab() {
    return this.navigation.navigateToAdministrationTab();
  }

  /**
   * Verify SITE LIST is visible
   * @returns {Promise<void>}
   */
  async verifySiteListVisible() {
    return this.navigation.verifySiteListVisible();
  }

  /**
   * Navigate to Users → List
   * @returns {Promise<void>}
   */
  async navigateToUsersList() {
    return this.navigation.navigateToUsersList();
  }

  /**
   * Filter user list by first name
   * @param {string} firstName - First name to filter by
   * @returns {Promise<void>}
   */
  async filterByFirstName(firstName) {
    return this.filterOps.filterByFirstName(firstName);
  }

  /**
   * Click Edit button for user
   * @returns {Promise<void>}
   */
  async clickEditButton() {
    return this.navigation.clickEditButton();
  }

  /**
   * Wait for page to be ready using domcontentloaded instead of networkidle
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForPageReady(timeout = 30000) {
    return this.gridWaitOps.waitForPageReady(timeout);
  }

  /**
   * Wait for user grid to fully load with data
   * @returns {Promise<void>}
   */
  async waitForUserGridToLoad() {
    return this.gridWaitOps.waitForUserGridToLoad();
  }

  /**
   * Wait for user grid filter to be ready
   * @returns {Promise<void>}
   */
  async waitForUserGridFilterReady() {
    return this.gridWaitOps.waitForUserGridFilterReady();
  }

  /**
   * Wait for site access grid to fully load
   * @returns {Promise<void>}
   */
  async waitForSiteAccessGridToLoad() {
    return this.gridWaitOps.waitForSiteAccessGridToLoad();
  }

  /**
   * Wait for specific sites to appear in the Site Access grid
   * @param {string[]} siteNames - Array of site names to wait for
   * @param {number} timeout - Timeout in milliseconds (default: 15000)
   * @returns {Promise<void>}
   */
  async waitForSitesInGrid(siteNames, timeout = 15000) {
    return this.gridWaitOps.waitForSitesInGrid(siteNames, timeout);
  }

  /**
   * Generic wait for grid content to be visible
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForGridContent(timeout = 30000) {
    return this.gridWaitOps.waitForGridContent(timeout);
  }

  /**
   * Generic wait for grid rows to be visible
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForGridRows(timeout = 30000) {
    return this.gridWaitOps.waitForGridRows(timeout);
  }

  /**
   * Wait for a specific site cell to be visible in the grid
   * @param {string} siteName - Name of the site
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForSiteCellVisible(siteName, timeout = 30000) {
    return this.gridWaitOps.waitForSiteCellVisible(siteName, timeout);
  }

  /**
   * Generic wait/timeout wrapper (use sparingly, prefer explicit waits)
   * @param {number} milliseconds - Time to wait in milliseconds
   * @returns {Promise<void>}
   */
  async wait(milliseconds) {
    return this.gridWaitOps.wait(milliseconds);
  }

  /**
   * Wait for a specific group cell to be visible in the grid
   * @param {string} groupName - Name of the group
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForGroupCellVisible(groupName, timeout = 30000) {
    return this.gridWaitOps.waitForGroupCellVisible(groupName, timeout);
  }

  /**
   * Click on a group cell in the grid and wait for selection
   * @param {string} groupName - Name of the group to click
   * @returns {Promise<void>}
   */
  async clickGroupCell(groupName) {
    return this.groupOps.clickGroupCell(groupName);
  }

  /**
   * Wait for Access Status column header to be visible in grid
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForAccessStatusColumn(timeout = 30000) {
    return this.gridWaitOps.waitForAccessStatusColumn(timeout);
  }

  /**
   * Wait for grid rows to be visible and stabilize
   * @param {number} initialWait - Initial wait for rows (default: 30000ms)
   * @param {number} stabilizationWait - Additional stabilization wait (default: 3000ms)
   * @returns {Promise<void>}
   */
  async waitForGridRowsWithStabilization(initialWait = 30000, stabilizationWait = 3000) {
    return this.gridWaitOps.waitForGridRowsWithStabilization(initialWait, stabilizationWait);
  }

  /**
   * Wait for grid to be fully stabilized and ready for interaction
   * Combines multiple wait strategies for maximum reliability
   * @param {number} timeout - Maximum wait time (default: 30000ms)
   * @returns {Promise<void>}
   */
  async waitForGridStabilization(timeout = 30000) {
    return this.gridWaitOps.waitForGridStabilization(timeout, this.waitForGridRows.bind(this));
  }

  /**
   * Press Escape key to close dialogs/popups
   * @param {number} waitAfter - Wait time after pressing key (default: 1000ms)
   * @returns {Promise<void>}
   */
  async pressEscape(waitAfter = 1000) {
    return this.gridWaitOps.pressEscape(waitAfter);
  }

  /**
   * Wait for DOM content to be loaded
   * @returns {Promise<void>}
   */
  async waitForDOMContentLoaded() {
    return this.gridWaitOps.waitForDOMContentLoaded();
  }

  /**
   * Dismiss all open EJ2 dialogs and overlays via DOM manipulation
   * @returns {Promise<void>}
   */
  async dismissAllDialogs() {
    return this.gridWaitOps.dismissAllDialogs();
  }

  /**
   * Wait for permission column headers to load (Report View, Document View)
   * @returns {Promise<void>}
   */
  async waitForPermissionColumnHeaders() {
    return this.gridWaitOps.waitForPermissionColumnHeaders();
  }

  /**
   * Wait for permission columns to be hidden
   * @returns {Promise<void>}
   */
  async waitForPermissionColumnsHidden() {
    return this.gridWaitOps.waitForPermissionColumnsHidden();
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
    return this.navigation.openSiteAccessPermissions();
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
    // Wait for grid to render after radio button change
    await this.page.locator('.e-grid .e-row').first()
      .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    // Wait for data to load in Site List
    this.logger.info('Waiting for Site List data to load...');
    await this.page.waitForLoadState('networkidle');
    // Wait for spinner to disappear
    await this.page.locator('.e-spinner-pane').waitFor(
      { state: 'hidden', timeout: 5000 },
    ).catch(() => {});

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
    // Wait for scroll to take effect
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});

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
        // Wait for layout to settle after resize
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
        this.logger.info('✓ Expanded site grid area by dragging resize handler');
      }
    }

    // Click Edit button to refresh/enable the grid for filtering
    this.logger.info('Clicking Edit button to enable grid interaction');
    const editButton = this.page.locator('button:has-text("Edit")').first();
    const isEditButtonVisible = await editButton.isVisible().catch(() => false);
    if (isEditButtonVisible) {
      await editButton.click();
      // Wait for edit mode to activate
      await this.page.locator(LOCATORS.saveButton).first()
        .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
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
    return this.filterOps.filterBySiteName(siteName);
  }

  /**
   * Filter by Accessible Sites (site access grid)
   * @param {string} siteName - Site name to filter by
   * @returns {Promise<void>}
   */
  async filterByAccessibleSites(siteName) {
    return this.filterOps.filterByAccessibleSites(siteName);
  }

  /**
   * Grant access to site by selecting checkbox
   * @param {string} siteName - Site name to grant access to
   * @returns {Promise<void>}
   */
  async grantAccessToSite(siteName) {
    return this.siteAccessOps.grantAccessToSite(siteName);
  }

  /**
   * Enable "Show groups with no access granted"
   * @returns {Promise<void>}
   */
  async enableShowGroupsWithNoAccess() {
    return this.groupOps.enableShowGroupsWithNoAccess();
  }

  /**
   * Enable "Show groups with access granted"
   * @returns {Promise<void>}
   */
  async enableShowGroupsWithAccessGranted() {
    return this.groupOps.enableShowGroupsWithAccessGranted();
  }

  /**
   * Filter group list by group name
   * @param {string} groupName - Group name to filter by
   * @returns {Promise<void>}
   */
  async filterByGroupName(groupName) {
    return this.filterOps.filterByGroupName(groupName);
  }

  /**
   * Clear filter on a specific column
   * @param {string} columnName - Name of the column to clear filter
   * @returns {Promise<void>}
   */
  async clearColumnFilter(columnName) {
    return this.filterOps.clearColumnFilter(columnName);
  }

  /**
   * Grant access to group by selecting checkbox
   * @param {string} groupName - Group name to grant access to
   * @returns {Promise<void>}
   */
  async grantAccessToGroup(groupName) {
    return this.groupOps.grantAccessToGroup(groupName);
  }

  /**
   * Verify "Show groups with access granted" is selected
   * @returns {Promise<void>}
   */
  async verifyShowGroupsWithAccessSelected() {
    return this.groupOps.verifyShowGroupsWithAccessSelected();
  }

  /**
   * Remove access for group using context menu (same pattern as removeAccessForSite)
   * @param {string} groupName - Group name to remove access from
   * @returns {Promise<void>}
   */
  async removeAccessForGroup(groupName) {
    return this.groupOps.removeAccessForGroup(groupName);
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
    await this.page.waitForTimeout(TIMEOUTS.FILTER_DELAY);

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
    return this.saveOperations.clickSaveButton();
  }

  /**
   * Click the Cancel button to exit edit mode.
   * Delegates to _exitEditMode — safe to call even if already in view mode.
   * @returns {Promise<void>}
   */
  async clickCancelButton() {
    this.logger.action('Clicking Cancel button to exit edit mode');
    await this._exitEditMode();
  }

  /**
   * Wait for success message to appear and disappear
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async waitForSuccessMessage(timeout = 30000) {
    return this.saveOperations.waitForSuccessMessage(timeout);
  }

  /**
   * Verify success toast message appears after save
   * @returns {Promise<void>}
   */
  async verifySaveSuccessMessage() {
    return this.saveOperations.verifySaveSuccessMessage();
  }

  /**
   * Verify "Show sites with access granted" is selected
   * @returns {Promise<void>}
   */
  async verifyShowSitesWithAccessSelected() {
    this.logger.action('Verifying "Show sites with access granted" is selected');

    // Wait for the system to auto-select the radio button after saving
    const radioButton = this.page.locator(LOCATORS.showSitesWithAccessRadio).first();
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
      'Show sites with access granted',
      { timeout: 10000 },
    );

    this.logger.info('✓ "Show sites with access granted" is selected');
  }

  /**
   * Verify "Show permission columns" checkbox is checked
   * @returns {Promise<void>}
   */
  async verifyShowPermissionColumnsChecked() {
    this.logger.action('Verifying "Show permission columns" checkbox is checked');

    await this.page.waitForTimeout(TIMEOUTS.CHECKBOX_READY);

    const checkbox = this.page.locator(LOCATORS.showPermissionColumnsCheckbox).first();
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });

    // Get the input checkbox
    const inputCheckbox = checkbox.locator('..').locator('input[type="checkbox"]');

    // Wait for checkbox to stabilize
    await this.page.waitForTimeout(TIMEOUTS.FILTER_DELAY);

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

    const checkbox = this.page.locator('label').filter({ hasText: 'Show permission columns' }).first();

    // Wait for checkbox to be visible
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });

    // Scroll the checkbox into view
    await checkbox.scrollIntoViewIfNeeded().catch(() => {
      this.logger.warn('Could not scroll to checkbox');
    });

    // Get the input checkbox
    const inputCheckbox = checkbox.locator('..').locator('input[type="checkbox"]');

    // Wait for checkbox to be enabled (not disabled)
    await inputCheckbox.waitFor({ state: 'attached', timeout: 10000 });
    await this.page.waitForFunction(
      (checkboxSelector) => {
        const label = document.querySelector(checkboxSelector);
        if (!label) return false;
        const input = label.closest('label, .e-checkbox-wrapper')?.querySelector('input[type="checkbox"]')
                     || label.parentElement?.querySelector('input[type="checkbox"]');
        return input && !input.disabled;
      },
      LOCATORS.showPermissionColumnsCheckbox,
      { timeout: 5000 },
    ).catch(() => {
      this.logger.warn('Checkbox did not become enabled in time, will attempt to click anyway');
    });

    // Check if checked
    const isChecked = await inputCheckbox.isChecked().catch(() => false);

    if (isChecked) {
      // Click the input checkbox to uncheck
      await inputCheckbox.click();
      // Wait for checkbox state change
      await this.page.waitForFunction(
        (checkboxSelector) => {
          const label = document.querySelector(checkboxSelector);
          if (!label) return false;
          const input = label.closest('label, .e-checkbox-wrapper')?.querySelector('input[type="checkbox"]')
                       || label.parentElement?.querySelector('input[type="checkbox"]');
          return input && input.checked === false;
        },
        LOCATORS.showPermissionColumnsCheckbox,
        { timeout: 10000 },
      ).catch(() => {
        this.logger.warn('Checkbox state verification timed out, continuing...');
      });

      // Wait for permission columns to be visually hidden
      await this.waitForPermissionColumnsHidden();

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
    await this.page.locator('label:has-text("Show permission columns")').first()
      .waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Check if checkbox is disabled
    const checkboxInput = this.page.locator('label:has-text("Show permission columns")').locator('input[type="checkbox"]');
    const isDisabled = await checkboxInput.isDisabled().catch(() => true);

    if (isDisabled) {
      this.logger.info('⚠ Checkbox is disabled, clicking Cancel and retrying Edit');

      // Click Cancel button to exit edit mode
      await this.page.locator('button.e-btn.e-small.scs-inline-right.e-info:has-text("Cancel")').click();
      // Wait for cancel to take effect
      await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      this.logger.info('✓ Clicked Cancel button');

      // Click Edit button again
      await this.clickEditButton();
      this.logger.info('✓ Clicked Edit button again');

      // Wait for SITE ACCESS AND PERMISSIONS section to reload
      await this.waitForSiteAccessGridToLoad();
      // Wait for spinner to disappear
      await this.page.locator('.e-spinner-pane').waitFor(
        { state: 'hidden', timeout: 5000 },
      ).catch(() => {});
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
    await this.page.waitForTimeout(TIMEOUTS.GRID_STABILIZATION);

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
    await this.page.waitForTimeout(TIMEOUTS.CHECKBOX_READY);

    // Check if unchecked
    const isChecked = await inputCheckbox.isChecked().catch(() => false);

    if (!isChecked) {
      // Click to check
      await checkbox.click();
      await this.page.waitForTimeout(TIMEOUTS.FILTER_DELAY);

      // Wait for checkbox to become checked (verify the state change)
      await this.page.waitForFunction(
        (checkboxSelector) => {
          const label = document.querySelector(checkboxSelector);
          if (!label) return false;
          const input = label.closest('label, .e-checkbox-wrapper')?.querySelector('input[type="checkbox"]')
                       || label.parentElement?.querySelector('input[type="checkbox"]');
          return input && input.checked === true;
        },
        LOCATORS.showPermissionColumnsCheckbox,
        { timeout: 10000 },
      ).catch(() => {
        this.logger.warn('Checkbox state verification timed out, continuing...');
      });

      // Wait for grid to update after showing columns
      await this.page.waitForTimeout(TIMEOUTS.GRID_STABILIZATION);
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
    await this.page.waitForTimeout(TIMEOUTS.CHECKBOX_READY);

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
      await this.page.waitForTimeout(TIMEOUTS.SHORT_POLL_INTERVAL);
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
    return this.expirationDateOps.getAccessExpirationDate(siteName);
  }

  /**
   * Verify Access Expiration Date is Today + 1 Year (Pacific Time)
   * @param {string} siteName - Site name to verify expiration date for
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateIsOneYearFromToday(siteName) {
    return this.expirationDateOps.verifyAccessExpirationDateIsOneYearFromToday(siteName);
  }

  /**
   * Change permission module to a random value
   * @returns {Promise<string>} - Selected module name
   */
  async changePermissionModuleToRandom() {
    return this.expirationDateOps.changePermissionModuleToRandom();
  }

  /**
   * Verify expiration date remains Today + 1 Year after changing permission module
   * @param {string} siteName - Site name to verify
   * @param {number} iterations - Number of times to change and verify (default: 3)
   * @returns {Promise<void>}
   */
  async verifyExpirationDateRemainsAfterModuleChange(siteName, iterations = 3) {
    return this.expirationDateOps.verifyExpirationDateRemainsAfterModuleChange(
      siteName,
      iterations,
      this.changePermissionModuleToRandom.bind(this),
      this.getAccessExpirationDate.bind(this)
    );
  }

  /**
   * Verify Access Status is Active
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsActive(siteName) {
    return this.statusVerificationOps.verifyAccessStatusIsActive(siteName, this.getAccessStatus.bind(this));
  }

  /**
   * Verify Access Status is Active with green background
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsActiveWithColor(siteName) {
    return this.statusVerificationOps.verifyAccessStatusIsActiveWithColor(siteName, this.getAccessStatus.bind(this));
  }

  /**
   * Set Access Expiration Date to yesterday (to create expired status)
   * @param {string} siteName - Site name to set expiration for
   * @returns {Promise<void>}
   */
  async setAccessExpirationDateToYesterday(siteName) {
    return this.expirationDateOps.setAccessExpirationDateToYesterday(siteName);
  }

  /**
   * Verify Access Status is Expired with red background
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsExpired(siteName) {
    return this.statusVerificationOps.verifyAccessStatusIsExpired(siteName, this.getAccessStatus.bind(this));
  }

  /**
   * Verify Access Status is Expiring Soon with orange background
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsExpiringSoon(siteName) {
    return this.statusVerificationOps.verifyAccessStatusIsExpiringSoon(siteName, this.getAccessStatus.bind(this));
  }

  /**
   * Verify Access Status is empty (no status displayed)
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessStatusIsEmpty(siteName) {
    return this.statusVerificationOps.verifyAccessStatusIsEmpty(siteName, this.getAccessStatus.bind(this));
  }

  /**
   * Verify Access Status is not empty (has any value)
   * @param {string} siteName - Site name to verify
   * @returns {Promise<string>} The non-empty Access Status value
   */
  async verifyAccessStatusIsNotEmpty(siteName) {
    const status = await this.getAccessStatus(siteName);
    if (!status || status.trim() === '') {
      throw new Error(
        `Access Status is empty for "${siteName}" — expected a value`,
      );
    }
    this.logger.info(`✓ Access Status is not empty: ${status}`);
    return status;
  }

  /**
   * Get visible column headers from Site Access grid
   * @returns {Promise<string[]>}
   */
  async getSiteAccessGridHeaders() {
    return this.statusVerificationOps.getSiteAccessGridHeaders();
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
      'Access Expiration',
    ];

    const missingColumns = [];

    for (const expectedCol of expectedColumns) {
      const found = headers.some((header) => header.includes(expectedCol));
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
      'Access Expiration',
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
      'Automated Uploads',
    ];

    // Verify expected columns are visible
    const missingColumns = [];
    for (const expectedCol of expectedVisibleColumns) {
      const found = headers.some((header) => header.includes(expectedCol));
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
      const found = headers.some((header) => header.includes(hiddenCol));
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
    return this.navigation.expandUserListSection(pixels);
  }

  /**
   * Ensure "Show sites with access granted" radio button is selected
   * @returns {Promise<void>}
   */
  async ensureShowSitesWithAccessGrantedIsSelected() {
    this.logger.action('Ensuring "Show sites with access granted" is selected');

    // Use getByRole for a reliable check - the locator chain (..) was fragile
    // and caused isChecked() to fail, triggering an unnecessary grid reload
    const radioInput = this.page.getByRole('radio', { name: 'Show sites with access granted' });
    const isSelected = await radioInput.isChecked().catch(() => false);

    if (!isSelected) {
      await this.page.locator(LOCATORS.showSitesWithAccessRadio).first().click();
      // Wait for grid to reload after radio change
      await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        this.logger.info('Network idle timeout - continuing anyway');
      });

      // Wait for grid rows to appear
      await this.page.locator('.e-grid .e-row').first()
        .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      // Wait for spinner to disappear
      await this.page.locator('.e-spinner-pane').waitFor(
        { state: 'hidden', timeout: 5000 },
      ).catch(() => {});
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
    return this.siteAccessOps.removeAccessForSite(siteName);
  }

  /**
   * Double-click Access Expiration Date cell to enable editing
   * @param {string} siteName - Site name to edit expiration date for
   * @returns {Promise<void>}
   */
  async editAccessExpirationDateCell(siteName) {
    return this.expirationDateOps.editAccessExpirationDateCell(siteName);
  }

  /**
   * Clear the Access Expiration Date by filling input with empty string
   * @param {string} siteName - Site name to clear expiration for
   * @returns {Promise<void>}
   */
  async clearAccessExpirationDate(siteName) {
    return this.expirationDateOps.clearAccessExpirationDate(
      siteName,
      this.waitForGridStabilization.bind(this)
    );
  }

  /**
   * Clear access expiration date with retry logic for reliability
   * @param {string} siteName - Site name
   * @param {number} maxRetries - Maximum retry attempts (default: 3)
   * @returns {Promise<void>}
   */
  async clearAccessExpirationDateWithRetry(siteName, maxRetries = 3) {
    return this.expirationDateOps.clearAccessExpirationDateWithRetry(
      siteName,
      maxRetries,
      this.waitForGridStabilization.bind(this),
      this.clearAccessExpirationDate.bind(this)
    );
  }

  /**
   * Verify that Access Expiration Date is empty/cleared for a site
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateIsEmpty(siteName) {
    return this.expirationDateOps.verifyAccessExpirationDateIsEmpty(siteName);
  }

  /**
   * Verify that Access Expiration Date is not empty for a site
   * @param {string} siteName - Site name to verify
   * @returns {Promise<string>} The non-empty expiration date value
   */
  async verifyAccessExpirationDateIsNotEmpty(siteName) {
    const date = await this.getAccessExpirationDate(siteName);
    if (!date || date.trim() === '') {
      throw new Error(
        `Access Expiration is empty for "${siteName}" — expected a date`,
      );
    }
    this.logger.info(
      `✓ Access Expiration is not empty: ${date}`,
    );
    return date;
  }

  /**
   * Open expiration date calendar by clicking calendar icon
   * @returns {Promise<void>}
   */
  /**
   * Open the expiration date calendar
   * @returns {Promise<void>}
   */
  async openExpirationDateCalendar() {
    return this.calendarOps.openExpirationDateCalendar();
  }

  /**
   * Get today's date from calendar
   * @returns {Promise<number>} Today's date number
   */
  async getTodayDateFromCalendar() {
    return this.calendarOps.getTodayDateFromCalendar();
  }

  /**
   * Click TODAY button in calendar
   * @returns {Promise<void>}
   */
  async clickTodayInCalendar() {
    return this.calendarOps.clickTodayInCalendar();
  }

  /**
   * Click a specific date in the calendar (handles month navigation if needed)
   * @param {number} daysFromToday - Number of days from today (e.g., 29 for 29 days from now)
   * @returns {Promise<void>}
   */
  async clickDateInCalendar(daysFromToday) {
    return this.calendarOps.clickDateInCalendar(daysFromToday);
  }

  /**
   * Get all disabled calendar dates before a specific date
   * @param {number} beforeDate - Date number to check before
   * @returns {Promise<Array>} Array of disabled date locators
   */
  async getDisabledCalendarDatesBefore(beforeDate) {
    return this.calendarOps.getDisabledCalendarDatesBefore(beforeDate);
  }

  /**
   * Close expiration date calendar
   * @returns {Promise<void>}
   */
  async closeCalendar() {
    return this.calendarOps.closeCalendar();
  }

  /**
   * Verify expiration date is not before today
   * @param {string} siteName - Site name to verify
   * @param {number} todayDate - Today's date number
   * @returns {Promise<void>}
   */
  async verifyExpirationDateIsNotBeforeToday(siteName, todayDate) {
    return this.expirationDateOps.verifyExpirationDateIsNotBeforeToday(
      siteName,
      todayDate,
      this.getAccessExpirationDate.bind(this)
    );
  }

  /**
   * Get current month and year displayed in calendar header
   * @returns {Promise<{month: number, year: number}>} Current month (0-11) and year
   */
  async getCurrentMonthYearFromCalendar() {
    return this.calendarOps.getCurrentMonthYearFromCalendar();
  }

  /**
   * Navigate calendar to a specific year
   * @param {number} targetYear - Year to navigate to
   * @returns {Promise<void>}
   */
  async navigateCalendarToYear(targetYear) {
    return this.calendarOps.navigateCalendarToYear(targetYear);
  }

  /**
   * Select a specific month in the calendar (assumes year view is open)
   * @param {number} monthIndex - Month index (0-11, where 0 = January)
   * @returns {Promise<void>}
   */
  async selectMonthInCalendar(monthIndex) {
    return this.calendarOps.selectMonthInCalendar(monthIndex);
  }

  /**
   * Get all disabled calendar dates after a specific date
   * @param {number} afterDate - Date number to check after
   * @returns {Promise<Array>} Array of disabled date locators
   */
  async getDisabledCalendarDatesAfter(afterDate) {
    return this.calendarOps.getDisabledCalendarDatesAfter(afterDate);
  }

  /**
   * Get maximum allowed date (5 years from today)
   * @returns {Promise<{day: number, month: number, year: number}>} Max allowed date
   */
  async getMaxAllowedExpirationDate() {
    return this.calendarOps.getMaxAllowedExpirationDate();
  }

  /**
   * Verify "No records to display" message is visible in the site access grid
   * @returns {Promise<void>}
   */
  async verifyNoRecordsToDisplay() {
    return this.statusVerificationOps.verifyNoRecordsToDisplay();
  }

  /**
   * Set Access Expiration Date to today's date
   * @param {string} siteName - Site name
   * @returns {Promise<void>}
   */
  async setAccessExpirationDateToToday(siteName) {
    return this.expirationDateOps.setAccessExpirationDateToToday(
      siteName,
      this.openExpirationDateCalendar.bind(this),
      this.clickTodayInCalendar.bind(this)
    );
  }

  /**
   * Verify Access Expiration Date is today's date
   * @param {string} siteName - Site name
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateIsToday(siteName) {
    return this.expirationDateOps.verifyAccessExpirationDateIsToday(
      siteName,
      this.verifyAccessExpirationDateExists.bind(this)
    );
  }

  /**
   * Set Access Expiration Date to specific days from today
   * @param {string} siteName - Site name
   * @param {number} daysFromToday - Number of days from today (negative for past dates)
   * @returns {Promise<void>}
   */
  async setAccessExpirationDate(siteName, daysFromToday) {
    return this.expirationDateOps.setAccessExpirationDate(
      siteName,
      daysFromToday,
      this.openExpirationDateCalendar.bind(this),
      this.clickTodayInCalendar.bind(this),
      this.clickDateInCalendar.bind(this)
    );
  }

  /**
   * Get the first site name from the current grid view
   * @returns {Promise<string>} First site name
   */
  async getFirstSiteNameFromGrid() {
    return this.siteAccessOps.getFirstSiteNameFromGrid();
  }

  /**
   * Verify that Access Expiration Date cell contains a date value
   * @param {string} siteName - Site name
   * @param {string} expectedDate - Expected date text (e.g., "02/18/2026" or "Feb 18, 2026")
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationDateExists(siteName, expectedDate) {
    return this.expirationDateOps.verifyAccessExpirationDateExists(siteName, expectedDate);
  }

  /**
   * Verify Access Expiration Date field is disabled (not editable) for a site
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationFieldDisabled(siteName) {
    return this.expirationDateOps.verifyAccessExpirationFieldDisabled(siteName);
  }

  /**
   * Verify Access Expiration Date field is editable for a site
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationFieldEditable(siteName) {
    return this.expirationDateOps.verifyAccessExpirationFieldEditable(siteName);
  }

  /**
   * Double-click Access Expiration Date cell and verify the
   * "not allowed to edit" toast appears because site is in a group
   * @param {string} siteName - Site name to attempt editing
   * @returns {Promise<void>}
   */
  async verifyExpirationEditBlockedByGroupMessage(siteName) {
    return this.expirationDateOps
      .verifyExpirationEditBlockedByGroupMessage(siteName);
  }

  /**
   * Click filter icon on Access Status column
   * @returns {Promise<void>}
   */
  async clickAccessStatusFilterIcon() {
    return this.filterOps.clickAccessStatusFilterIcon();
  }

  /**
   * Click filter icon on any column by column name
   * @param {string} columnName - Name of the column to click filter icon
   * @returns {Promise<void>}
   */
  async clickColumnFilterIcon(columnName) {
    return this.filterOps.clickColumnFilterIcon(columnName);
  }

  /**
   * Get Excel filter dialog element
   * @returns {Promise<Locator>} Excel filter dialog locator
   */
  async getExcelFilterDialog() {
    return this.filterOps.getExcelFilterDialog();
  }

  /**
   * Filter column by text using Excel filter
   * @param {string} columnName - Name of the column to filter
   * @param {string} searchText - Text to search for
   * @returns {Promise<void>}
   */
  async filterColumnByText(columnName, searchText) {
    return this.filterOps.filterColumnByText(columnName, searchText);
  }

  /**
   * Get count of visible rows in grid
   * @returns {Promise<number>} Count of visible rows
   */
  async getVisibleRowCount() {
    return this.filterOps.getVisibleRowCount();
  }

  /**
   * Get Clear Filter option from Excel filter dialog
   * @returns {Promise<Locator>} Clear Filter option locator
   */
  async getClearFilterOption() {
    return this.filterOps.getClearFilterOption();
  }

  /**
   * Verify Access Status filter options are available
   * @returns {Promise<void>}
   */
  async verifyAccessStatusFilterOptions() {
    return this.filterOps.verifyAccessStatusFilterOptions();
  }

  /**
   * Select a specific Access Status filter option
   * @param {string} filterOption - Filter option to select (All, Expiring Soon, Expired, Blanks, Active)
   * @returns {Promise<void>}
   */
  async selectAccessStatusFilter(filterOption) {
    return this.filterOps.selectAccessStatusFilter(filterOption);
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
    await this.page.waitForTimeout(TIMEOUTS.FILTER_DELAY);

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
      this.page.locator('.e-dropdownlist').first(),
    );
    await sitesDropdown.click();
    await this.page.waitForTimeout(TIMEOUTS.FILTER_DELAY);

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
    await this.page.waitForTimeout(TIMEOUTS.SHORT_POLL_INTERVAL);
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
      this.page.locator('.e-dropdownlist').first(),
    );
    await sitesDropdown.click();
    await this.page.waitForTimeout(TIMEOUTS.FILTER_DELAY);

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
    await this.page.waitForTimeout(TIMEOUTS.SHORT_POLL_INTERVAL);
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
    return this.notificationOps.navigateToNotifications();
  }

  /**
   * Wait for Notifications grid to fully load
   * @returns {Promise<void>}
   */
  async waitForNotificationsGridToLoad() {
    return this.notificationOps.waitForNotificationsGridToLoad();
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
    await this.page.waitForTimeout(TIMEOUTS.FILTER_DELAY);

    // Wait for Checkbox filter dialog
    const filterDialog = this.page.getByLabel('Checkbox filter');
    await filterDialog.waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('✓ Filter dialog opened');

    // Click "Select All" to deselect all items first
    const selectAllCheckbox = filterDialog.getByText('Select All', { exact: true });
    await selectAllCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await selectAllCheckbox.click();
    this.logger.info('✓ Deselected all items');
    await this.page.waitForTimeout(TIMEOUTS.SHORT_POLL_INTERVAL);

    // Click the specific event type to select it
    const eventTypeOption = filterDialog.getByText(eventType, { exact: true });
    await eventTypeOption.waitFor({ state: 'visible', timeout: 5000 });
    await eventTypeOption.click();
    this.logger.info(`✓ Selected "${eventType}"`);
    await this.page.waitForTimeout(TIMEOUTS.SHORT_POLL_INTERVAL);

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
    return this.notificationOps.captureFirstRowSiteName();
  }

  /**
   * Click the file viewer icon in the first row
   * @returns {Promise<void>}
   */
  async clickFileViewerIcon() {
    return this.notificationOps.clickFileViewerIcon();
  }

  /**
   * Validate notification content contains required elements
   * Validates all text content except date values
   * @param {string} siteName - Expected site name to appear in notification
   * @returns {Promise<void>}
   */
  async validateNotificationContent(siteName) {
    return this.notificationOps.validateNotificationContent(siteName);
  }

  /**
   * Verify all date cells are disabled
   * @param {Array} dateCells - Array of date cell locators
   * @returns {Promise<void>}
   */
  async verifyAllDatesAreDisabled(dateCells) {
    return this.calendarOps.verifyAllDatesAreDisabled(dateCells);
  }

  /**
   * Grant access to multiple sites
   * @param {Array<string>} siteNames - Array of site names
   * @returns {Promise<void>}
   */
  async grantAccessToMultipleSites(siteNames) {
    return this.siteAccessOps.grantAccessToMultipleSites(
      siteNames,
      this.grantAccessToSite.bind(this)
    );
  }

  /**
   * Select multiple sites using Ctrl+click
   * @param {Array<string>} siteNames - Array of site names
   * @returns {Promise<void>}
   */
  async selectMultipleSites(siteNames) {
    return this.siteAccessOps.selectMultipleSites(siteNames);
  }

  /**
   * Bulk remove selected sites using context menu
   * @param {string} firstSiteName - Name of first site to right-click
   * @returns {Promise<void>}
   */
  async bulkRemoveSelectedSites(firstSiteName) {
    return this.siteAccessOps.bulkRemoveSelectedSites(firstSiteName);
  }

  /**
   * Wait for error dialog and verify message
   * @param {string} expectedMessage - Expected error message
   * @param {number} timeout - Timeout in milliseconds (default: 30000)
   * @returns {Promise<void>}
   */
  async verifyErrorDialogWithMessage(expectedMessage, timeout = 30000) {
    return this.saveOperations.verifyErrorDialogWithMessage(expectedMessage, timeout);
  }

  /**
   * Filter by first name with retry logic
   * @param {string} userName - User first name to filter
   * @param {number} maxAttempts - Maximum retry attempts (default: 3)
   * @returns {Promise<void>}
   */
  async filterByFirstNameWithRetry(userName, maxAttempts = 3) {
    return this.filterOps.filterByFirstNameWithRetry(userName, maxAttempts);
  }

  /**
   * Verify site name in dropdown
   * @param {string} siteName - Expected site name
   * @param {string} dropdownId - Dropdown element ID (optional)
   * @returns {Promise<void>}
   */
  async verifySiteInDropdown(siteName, dropdownId = null) {
    this.logger.action(`Verifying site "${siteName}" in dropdown`);

    // If dropdown ID is provided, use it; otherwise use a generic locator
    const dropdown = dropdownId
      ? this.page.locator(`#${dropdownId}`)
      : this.page.locator('input[role="combobox"]').first();

    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    const dropdownValue = await dropdown.inputValue();

    if (!dropdownValue.includes(siteName)) {
      throw new Error(`Expected site "${siteName}" not found in dropdown. Found: "${dropdownValue}"`);
    }

    this.logger.info(`✓ Site "${siteName}" is visible in dropdown`);
  }

  /**
   * Click Admin from toolbar
   * @returns {Promise<void>}
   * @throws {Error} If Admin toolbar item is not found
   */
  async clickAdminToolbar() {
    this.logger.action('Clicking Admin toolbar item');

    try {
      await this.page.waitForLoadState('domcontentloaded');

      const adminToolbar = this.page.locator('.toolbar-item.admin-reports');
      await adminToolbar.waitFor({
        state: 'visible',
        timeout: TIMEOUTS.ELEMENT_VISIBILITY,
      });
      await adminToolbar.click();
      await this.page.waitForLoadState('networkidle');

      this.logger.info('✓ Clicked Admin toolbar item');
    } catch (error) {
      this.logger.error(`Failed to click Admin toolbar: ${error.message}`);
      throw new Error(`Admin toolbar click failed: ${error.message}`);
    }
  }

  /**
   * Click User Status tree item from report tree
   * @returns {Promise<void>}
   * @throws {Error} If User Status item is disabled or not found
   */
  async clickUserStatus() {
    this.logger.action('Clicking User Status in report tree');

    try {
      const treeView = this.page.locator('.e-treeview');
      await treeView.waitFor({
        state: 'visible',
        timeout: TIMEOUTS.TREE_VIEW_LOAD,
      });
      this.logger.info('✓ Tree view is visible');

      await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);

      const userStatusTreeItem = this.page.locator(
        '.e-list-item.e-level-2:has(.scs-report-title:has-text("User Status"))',
      );
      await userStatusTreeItem.waitFor({
        state: 'visible',
        timeout: TIMEOUTS.ELEMENT_VISIBILITY,
      });

      await this._verifyTreeItemEnabled(userStatusTreeItem);

      await userStatusTreeItem.click();
      await this._waitForPageLoad();

      this.logger.info('✓ Clicked User Status tree item and page loaded');
    } catch (error) {
      this.logger.error(`Failed to click User Status: ${error.message}`);
      throw new Error(`User Status navigation failed: ${error.message}`);
    }
  }

  /**
   * Verify tree item is enabled (not disabled by permissions)
   * @private
   * @param {import('@playwright/test').Locator} treeItem - Tree item locator
   * @returns {Promise<void>}
   * @throws {Error} If tree item is disabled
   */
  async _verifyTreeItemEnabled(treeItem) {
    const isDisabled = await treeItem.getAttribute('aria-disabled');
    if (isDisabled === 'true') {
      throw new Error('User Status tree item is disabled. User may not have permission to access this report.');
    }
  }

  /**
   * Wait for page to load with content stabilization
   * @private
   * @returns {Promise<void>}
   */
  async _waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.SHORT_WAIT);
  }

  /**
   * Verify User Status page loaded
   * @returns {Promise<void>}
   * @throws {Error} If User Status title not found
   */
  async verifyUsersTextVisible() {
    this.logger.action('Verifying User Status page loaded');

    try {
      const userStatusTitle = this.page.locator('div.scs-report-title:has-text("User Status")');
      await userStatusTitle.waitFor({
        state: 'visible',
        timeout: TIMEOUTS.ELEMENT_VISIBILITY,
      });

      this.logger.info('✓ User Status page loaded with title visible');
    } catch (error) {
      this.logger.error(`User Status page verification failed: ${error.message}`);
      throw new Error(`User Status page not loaded: ${error.message}`);
    }
  }

  /**
   * Click Create Report button
   * @returns {Promise<void>}
   * @throws {Error} If Create Report button not found
   */
  async clickCreateReport() {
    this.logger.action('Clicking Create Report button');

    try {
      const createReportButton = this.page.getByRole('button', { name: /create report/i });
      await createReportButton.waitFor({
        state: 'visible',
        timeout: TIMEOUTS.ELEMENT_VISIBILITY,
      });
      await createReportButton.click();

      await this._waitForPageLoad();

      this.logger.info('✓ Clicked Create Report button');
    } catch (error) {
      this.logger.error(`Create Report button click failed: ${error.message}`);
      throw new Error(`Failed to create report: ${error.message}`);
    }
  }

  /**
   * Verify User Status Report page loaded and content rendered
   * @returns {Promise<void>}
   * @throws {Error} If report page doesn't load within timeout
   */
  async verifyUserStatusReportPage() {
    this.logger.action('Verifying User Status Report page loaded');

    try {
      await this.page.waitForTimeout(TIMEOUTS.REPORT_GENERATION);

      const reportTitle = this.page.locator('text=/User Status/i').first();
      await reportTitle.waitFor({
        state: 'visible',
        timeout: TIMEOUTS.TREE_VIEW_LOAD,
      });

      this.logger.info('✓ User Status Report page loaded');
    } catch (error) {
      this.logger.error(`Report page verification failed: ${error.message}`);
      throw new Error(`User Status Report page did not load: ${error.message}`);
    }
  }

  /**
   * Verify Access Expiration column exists (split header: "Access" / "Expiration")
   * @returns {Promise<void>}
   * @throws {Error} If column header not found
   */
  async verifyAccessExpirationColumn() {
    this.logger.action('Verifying Access Expiration column exists');

    try {
      await this.page.waitForTimeout(TIMEOUTS.CONTENT_STABILIZATION);

      await this._scrollToRightMost();

      await this._verifyColumnHeaderText('Access');
      await this._verifyColumnHeaderText('Expiration');

      this.logger.info('✓ Access Expiration column is visible');
    } catch (error) {
      this.logger.error(`Access Expiration column verification failed: ${error.message}`);
      throw new Error(`Access Expiration column not found: ${error.message}`);
    }
  }

  /**
   * Scroll page horizontally to rightmost position
   * @private
   * @returns {Promise<void>}
   */
  async _scrollToRightMost() {
    await this.page.evaluate(() => {
      window.scrollTo({ left: 9999, behavior: 'smooth' });
    });
    await this.page.waitForTimeout(TIMEOUTS.SCROLL_WAIT);
  }

  /**
   * Verify column header text exists
   * @private
   * @param {string} headerText - Text to find in column header
   * @returns {Promise<void>}
   * @throws {Error} If header text not found
   */
  async _verifyColumnHeaderText(headerText) {
    const textLocator = this.page.locator(`text="${headerText}"`);
    await textLocator.first().waitFor({
      state: 'visible',
      timeout: TIMEOUTS.ELEMENT_VISIBILITY,
    });
    this.logger.info(`✓ Found "${headerText}" text in column header`);
  }

  /**
   * Verify Access Expiration column appears after Last Logon Date column
   * @returns {Promise<void>}
   * @throws {Error} If columns not in expected order
   */
  async verifyAccessExpirationAfterLastLogonDate() {
    this.logger.action('Verifying Access Expiration column is after Last Logon Date column');

    try {
      const columnPositions = await this._findColumnPositions();
      this._validateColumnOrder(columnPositions);

      this.logger.info(
        `✓ Access Expiration column (index ${columnPositions.accessExpiration}) is after Last Logon Date column (index ${columnPositions.lastLogon})`,
      );
    } catch (error) {
      this.logger.error(`Column position verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find positions of Last Logon Date and Access Expiration columns
   * @private
   * @returns {Promise<{lastLogon: number, accessExpiration: number}>} Column indices
   * @throws {Error} If either column not found
   */
  async _findColumnPositions() {
    const allDivs = this.page.locator('div').filter({ hasText: /.+/ });
    const divCount = await allDivs.count();

    this.logger.info(`Scanning ${divCount} divs for column headers`);

    const positions = { lastLogon: -1, accessExpiration: -1 };

    for (let i = 0; i < divCount; i++) {
      const divText = await allDivs.nth(i).textContent();
      const normalizedText = divText?.trim() ?? '';

      if (positions.lastLogon === -1 && normalizedText === COLUMN_HEADERS.LAST_LOGON.first) {
        const nextText = await this._getNextDivText(allDivs, i);
        if (nextText === COLUMN_HEADERS.LAST_LOGON.second) {
          positions.lastLogon = i;
          this.logger.info(`Found "Last Logon Date" at index ${i}`);
        }
      }

      if (positions.accessExpiration === -1 && normalizedText === COLUMN_HEADERS.ACCESS_EXPIRATION.first) {
        const nextText = await this._getNextDivText(allDivs, i);
        if (nextText === COLUMN_HEADERS.ACCESS_EXPIRATION.second) {
          positions.accessExpiration = i;
          this.logger.info(`Found "Access Expiration" at index ${i}`);
        }
      }

      if (positions.lastLogon !== -1 && positions.accessExpiration !== -1) {
        break;
      }
    }

    if (positions.lastLogon === -1) {
      throw new Error('Last Logon Date column not found');
    }
    if (positions.accessExpiration === -1) {
      throw new Error('Access Expiration column not found');
    }

    return positions;
  }

  /**
   * Get text content of next div safely
   * @private
   * @param {import('@playwright/test').Locator} allDivs - All div locators
   * @param {number} currentIndex - Current index
   * @returns {Promise<string>} Next div text or empty string
   */
  async _getNextDivText(allDivs, currentIndex) {
    try {
      const nextDiv = allDivs.nth(currentIndex + 1);
      const text = await nextDiv.textContent();
      return text?.trim() ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Validate that Access Expiration comes after Last Logon Date
   * @private
   * @param {{lastLogon: number, accessExpiration: number}} positions - Column positions
   * @returns {void}
   * @throws {Error} If columns are in wrong order
   */
  _validateColumnOrder(positions) {
    if (positions.accessExpiration <= positions.lastLogon) {
      throw new Error(
        `Access Expiration (index ${positions.accessExpiration}) should be after Last Logon Date (index ${positions.lastLogon})`,
      );
    }
  }

  /**
   * Check whether a site row is currently visible in the active grid
   * @param {string} siteName - Site name to look for
   * @returns {Promise<boolean>}
   */
  async isSiteVisibleInGrid(siteName) {
    const row = this.page.locator('.e-row').filter({ hasText: siteName }).first();
    return row.isVisible().catch(() => false);
  }

  /**
   * Verify a site row is visible in the active grid (throws if not)
   * @param {string} siteName - Site name to verify
   * @returns {Promise<void>}
   */
  async verifySiteIsVisibleInGrid(siteName) {
    const isVisible = await this.isSiteVisibleInGrid(siteName);
    if (!isVisible) {
      throw new Error(
        `Site "${siteName}" is not visible in the access grid`,
      );
    }
    this.logger.info(`✓ Site "${siteName}" is visible in access grid`);
  }

  /**
   * Check whether a group row is currently visible in the active grid
   * @param {string} groupName - Group name to look for
   * @returns {Promise<boolean>}
   */
  async isGroupVisibleInGrid(groupName) {
    const row = this.page.locator('.e-row').filter({ hasText: groupName }).first();
    return row.isVisible().catch(() => false);
  }

  /**
   * Open GROUP ACCESS AND PERMISSIONS section
   * @returns {Promise<void>}
   */
  async openGroupAccessPermissions() {
    return this.navigation.openGroupAccessPermissions();
  }

  // ─── Site List Navigation & Editing ─────────────────────────────

  /**
   * Navigate to Sites → List in the Administration section
   * @returns {Promise<void>}
   */
  async navigateToSitesList() {
    return this.navigation.navigateToSitesList();
  }

  /**
   * Click the "List" button under the Sites toolbar
   * @returns {Promise<void>}
   */
  async clickSiteListButton() {
    return this.navigation.clickSiteListButton();
  }

  /**
   * Filter the Site List grid by Site Name
   * @param {string} siteName - Site name to filter by
   * @returns {Promise<void>}
   */
  async filterSiteGridByName(siteName) {
    return this.navigation.filterSiteGridByName(siteName);
  }

  /**
   * Click the Edit button on a site row in the Site List grid
   * @returns {Promise<void>}
   */
  async clickSiteRowEditButton() {
    return this.navigation.clickSiteRowEditButton();
  }

  /**
   * Change a site group dropdown value (e.g., Region, SCS Office, Client)
   * @param {string} label - Dropdown label text
   * @param {string} value - Value to select
   * @returns {Promise<void>}
   */
  async changeSiteGroupDropdown(label, value) {
    return this.navigation.changeSiteGroupDropdown(label, value);
  }

  /**
   * Click the Save button on the site edit form
   * @returns {Promise<void>}
   */
  async clickSiteSaveButton() {
    return this.navigation.clickSiteSaveButton();
  }

  /**
   * Verify the Save button is still visible (e.g., after clicking No)
   * @returns {Promise<void>}
   */
  async verifySaveButtonIsVisible() {
    return this.navigation.verifySaveButtonIsVisible();
  }

  /**
   * Verify the title of the currently visible confirmation popup
   * @param {string} expectedTitle - Expected popup title text
   * @returns {Promise<void>}
   */
  async verifyConfirmationPopupTitle(expectedTitle) {
    return this.navigation.verifyConfirmationPopupTitle(expectedTitle);
  }

  /**
   * Wait for the site success message to appear
   * @param {string} expectedMessage - Expected success message text
   * @returns {Promise<void>}
   */
  async waitForSiteSuccessMessage(expectedMessage) {
    return this.navigation.waitForSiteSuccessMessage(expectedMessage);
  }

  /**
   * Save site changes and verify no confirmation popup appears.
   * @param {string} expectedMessage - Expected success toast text
   * @returns {Promise<void>}
   */
  async saveSiteAndVerifyNoConfirmationPopup(expectedMessage) {
    return this.navigation
      .saveSiteAndVerifyNoConfirmationPopup(expectedMessage);
  }

  /**
   * Grant site access to a user — navigates from user list into user edit,
   * opens SITE ACCESS AND PERMISSIONS, removes any pre-existing access for
   * the same site, grants fresh access, and saves.
   *
   * Assumes the caller is already on the Users List page with the grid ready.
   *
   * @param {string} userName - First name to filter by in the user list
   * @param {string} siteName - Site to grant access to
   * @returns {Promise<void>}
   */
  async grantSiteAccessForUser(userName, siteName) {
    this.logger.action(`Granting site access for user "${userName}" → site "${siteName}"`);

    await this.filterByFirstName(userName);
    await this.expandUserListSection();
    await this.clickEditButton();
    await this.openSiteAccessPermissions();
    await this.waitForSiteAccessGridToLoad();

    // If site already has access, remove it first so the grant is clean
    await this.ensureShowSitesWithAccessGrantedIsSelected();
    await this.waitForSiteAccessGridToLoad();
    const alreadyGranted = await this.isSiteVisibleInGrid(siteName);
    if (alreadyGranted) {
      this.logger.info(`Site "${siteName}" already has access — removing first for clean state`);
      await this.disableShowPermissionColumnsWithRetry();
      await this.waitForAccessStatusColumn();
      await this.removeAccessForSite(siteName);
      await this.clickSaveButton();
      await this.waitForSuccessMessage();
      await this.clickEditButton();
      await this.openSiteAccessPermissions();
      await this.waitForSiteAccessGridToLoad();
    }

    // Grant access
    await this.enableShowSitesWithNoAccess();
    await this.waitForSiteAccessGridToLoad();
    await this.filterBySiteName(siteName);
    await this.waitForGridRows();
    await this.clickSiteCell(siteName);
    await this.grantAccessToSite(siteName);
    await this.clickSaveButton();
    await this.waitForSuccessMessage();

    this.logger.info(`✓ Site access granted for user "${userName}" to site "${siteName}"`);
  }

  /**
   * Grant group access to a user — navigates from user list into user edit,
   * opens GROUP ACCESS AND PERMISSIONS, removes any pre-existing access for
   * the same group, grants fresh access, and saves.
   *
   * Assumes the caller is already on the Users List page with the grid ready.
   *
   * @param {string} userName - First name to filter by in the user list
   * @param {string} groupName - Group to grant access to
   * @returns {Promise<void>}
   */
  async grantGroupAccessForUser(userName, groupName) {
    this.logger.action(`Granting group access for user "${userName}" → group "${groupName}"`);

    await this.filterByFirstName(userName);
    await this.expandUserListSection();
    await this.clickEditButton();
    await this.openGroupAccessPermissions();
    await this.waitForGridRows();

    // If group already has access, remove it first so the grant is clean
    await this.enableShowGroupsWithAccessGranted();
    await this.waitForGridRows();
    const alreadyGranted = await this.isGroupVisibleInGrid(groupName);
    if (alreadyGranted) {
      this.logger.info(`Group "${groupName}" already has access — removing first for clean state`);
      await this.removeAccessForGroup(groupName);
      await this.clickSaveButton();
      await this.waitForSuccessMessage();
      await this.clickEditButton();
      await this.openGroupAccessPermissions();
      await this.waitForGridRows();
    }

    // Grant access
    await this.enableShowGroupsWithNoAccess();
    await this.waitForGridRows();
    await this.filterByGroupName(groupName);
    await this.waitForGroupCellVisible(groupName);
    await this.grantAccessToGroup(groupName);
    await this.clickSaveButton();
    await this.waitForSuccessMessage();

    // Verify grant persisted: click Edit → Show groups with access granted → check group visible
    this.logger.info(`Verifying group access grant persisted for "${groupName}"…`);
    await this.clickEditButton();
    await this.openGroupAccessPermissions();
    await this.waitForGridRows();
    await this.enableShowGroupsWithAccessGranted();
    await this.waitForGridRows();

    const grantConfirmed = await this.isGroupVisibleInGrid(groupName);
    if (!grantConfirmed) {
      throw new Error(
        `Group access grant verification FAILED: "${groupName}" is NOT visible under ` +
        `"Show groups with access granted" after save.`
      );
    }
    this.logger.info(`✓ Verified: "${groupName}" is visible under "Show groups with access granted"`);

    this.logger.info(`✓ Group access granted for user "${userName}" to group "${groupName}"`);
  }

  /**
   * Fully standalone cleanup — removes site access for a user with retry logic.
   *
   * Navigates to the user list on each retry attempt, re-enters edit mode,
   * removes the site access, saves, then verifies the removal. Retries up to
   * 3 times if the site remains visible after saving.
   *
   * Safe to call from test `finally` blocks — swallows errors and logs warnings.
   *
   * @param {string} userName - First name to filter by in the user list
   * @param {string} siteName - Site name to remove access from
   * @returns {Promise<void>}
   */
  async cleanupUserSiteAccess(userName, siteName) {
    this.logger.action(`Cleanup — removing site access "${siteName}" for user "${userName}"`);
    try {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        this.logger.info(`Cleanup attempt ${attempt}/${maxRetries}`);

        await this.navigateToUsersList();
        await this.waitForUserGridToLoad();
        await this.waitForUserGridFilterReady();
        await this.filterByFirstName(userName);
        await this.expandUserListSection();
        await this.clickEditButton();
        await this.openSiteAccessPermissions();
        await this.waitForSiteAccessGridToLoad();
        await this.ensureShowSitesWithAccessGrantedIsSelected();
        await this.waitForSiteAccessGridToLoad();
        await this.disableShowPermissionColumnsWithRetry();
        await this.waitForAccessStatusColumn();

        const siteVisible = await this.isSiteVisibleInGrid(siteName);
        if (!siteVisible) {
          this.logger.info(`✓ Site "${siteName}" not found — already removed`);
          await this._exitEditMode();
          break;
        }

        await this.removeAccessForSite(siteName);
        await this.clickSaveButton();
        await this.waitForSuccessMessage();
        this.logger.info(`✓ Save completed on attempt ${attempt}`);

        // Verify by clicking Edit and re-checking
        await this.clickEditButton();
        await this.waitForSiteAccessGridToLoad();
        await this.disableShowPermissionColumnsWithRetry();
        await this.ensureShowSitesWithAccessGrantedIsSelected();
        await this.waitForSiteAccessGridToLoad();

        const stillVisible = await this.isSiteVisibleInGrid(siteName);
        if (!stillVisible) {
          this.logger.info(`✓ Successfully removed site access: "${siteName}"`);
          await this._exitEditMode();
          break;
        }

        if (attempt === maxRetries) {
          this.logger.warn(`⚠ Site "${siteName}" still visible after ${maxRetries} attempts`);
        } else {
          this.logger.warn(`Site "${siteName}" still visible after save — retrying...`);
        }
      }
    } catch (error) {
      this.logger.warn(`Cleanup warning for site "${siteName}": ${error.message}`);
    }
  }

  /**
   * Fully standalone cleanup — removes group access for a user with retry logic.
   *
   * Navigates to the user list on each retry attempt, re-enters edit mode,
   * removes the group access, saves, then verifies the removal. Retries up to
   * 3 times if the group remains visible after saving.
   *
   * Safe to call from test `finally` blocks — swallows errors and logs warnings.
   *
   * @param {string} userName - First name to filter by in the user list
   * @param {string} groupName - Group name to remove access from
   * @returns {Promise<void>}
   */
  async cleanupUserGroupAccess(userName, groupName) {
    this.logger.action(`Cleanup — removing group access "${groupName}" for user "${userName}"`);
    try {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        this.logger.info(`Cleanup attempt ${attempt}/${maxRetries}`);

        await this.navigateToUsersList();
        await this.waitForUserGridToLoad();
        await this.waitForUserGridFilterReady();
        await this.filterByFirstName(userName);
        await this.expandUserListSection();
        await this.clickEditButton();
        await this.openGroupAccessPermissions();
        await this.waitForGridRows();
        await this.enableShowGroupsWithAccessGranted();
        await this.waitForGridRows();

        const groupVisible = await this.isGroupVisibleInGrid(groupName);
        if (!groupVisible) {
          this.logger.info(`✓ Group "${groupName}" not found — already removed`);
          await this._exitEditMode();
          break;
        }

        await this.removeAccessForGroup(groupName);
        await this.clickSaveButton();
        await this.waitForSuccessMessage();
        this.logger.info(`✓ Save completed on attempt ${attempt}`);

        // Verify by clicking Edit and re-checking
        await this.clickEditButton();
        await this.openGroupAccessPermissions();
        await this.enableShowGroupsWithAccessGranted();
        await this.waitForGridRows();

        const stillVisible = await this.isGroupVisibleInGrid(groupName);
        if (!stillVisible) {
          this.logger.info(`✓ Successfully removed group access: "${groupName}"`);
          await this._exitEditMode();
          break;
        }

        if (attempt === maxRetries) {
          this.logger.warn(`⚠ Group "${groupName}" still visible after ${maxRetries} attempts`);
        } else {
          this.logger.warn(`Group "${groupName}" still visible after save — retrying...`);
        }
      }
    } catch (error) {
      this.logger.warn(`Cleanup warning for group "${groupName}": ${error.message}`);
    }
  }

  /**
   * Click the Cancel button to exit edit mode, if present.
   * Waits for networkidle so the page fully transitions back to view/list state.
   * Safe to call when NOT in edit mode — silently skips if Cancel is not found.
   * @private
   * @returns {Promise<void>}
   */
  async _exitEditMode() {
    try {
      const cancelBtn = this.page.locator(
        'button.e-btn.e-small.scs-inline-right.e-info:has-text("Cancel"), button:has-text("Cancel")',
      ).first();
      const isVisible = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await cancelBtn.click();
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        await this.page.waitForTimeout(1000);
        this.logger.info('✓ Exited edit mode via Cancel button');
      } else {
        this.logger.info('Not in edit mode — no Cancel button found, skipping');
      }
    } catch (error) {
      this.logger.warn(`_exitEditMode: ${error.message}`);
    }
  }

  /**
   * Get a date value from Access Expiration column
   * @returns {Promise<string>} Date value in MM/DD/YYYY format
   * @throws {Error} If no date value found
   */
  async getAccessExpirationDateValue() {
    return this.expirationDateOps.getAccessExpirationDateValue(
      this._findAccessExpirationHeader.bind(this),
      this._findDateValuesAfterIndex.bind(this)
    );
  }

  /**
   * Get first N first names from the user grid "First name" column
   * @param {number} count - Number of first names to retrieve (default: 5)
   * @returns {Promise<string[]>} Array of first name strings
   */
  async getFirstNamesFromUserGrid(count = 5) {
    return this.filterOps.getFirstNamesFromUserGrid(count);
  }

  /**
   * Select a site from an EJ2 dropdown by element ID (type-and-select)
   * @param {string} dropdownId - The element ID of the EJ2 dropdown input
   * @param {string} siteName - The site name to type and select
   * @returns {Promise<void>}
   */
  async selectSiteFromDropdownById(dropdownId, siteName) {
    return this.filterOps.selectSiteFromDropdownById(dropdownId, siteName);
  }

  /**
   * Click the "Assigned to selected site" checkbox label to toggle filter
   * @returns {Promise<void>}
   */
  async clickAssignedToSelectedSiteCheckbox() {
    return this.filterOps.clickAssignedToSelectedSiteCheckbox();
  }

  /**
   * Uncheck "Assigned to selected site" if currently active, restoring the full user grid
   * @returns {Promise<void>}
   */
  async resetAssignedToSiteFilter() {
    return this.filterOps.resetAssignedToSiteFilter();
  }

  /**
   * Verify that all specified first names are visible in the user grid
   * @param {string[]} firstNames - Array of first names to verify as present
   * @returns {Promise<void>}
   */
  async verifyFirstNamesPresent(firstNames) {
    return this.filterOps.verifyFirstNamesPresent(firstNames);
  }

  /**
   * Verify that only the specified first names are visible in the user grid
   * @param {string[]} expectedNames - Array of first names that should be the only ones visible
   * @returns {Promise<void>}
   */
  async verifyOnlyFirstNamesVisible(expectedNames) {
    return this.filterOps.verifyOnlyFirstNamesVisible(expectedNames);
  }

  /**
   * Verify a first name is NOT visible in the user grid
   * @param {string} firstName - First name expected to be absent
   * @returns {Promise<void>}
   */
  async verifyFirstNameNotVisible(firstName) {
    return this.filterOps.verifyFirstNameNotVisible(firstName);
  }

  /**
   * Get all column header texts from the Users list grid
   * @returns {Promise<string[]>} Array of column header strings
   */
  async getUserListGridColumnHeaders() {
    return this.filterOps.getUserListGridColumnHeaders();
  }

  /**
   * Verify Access Expiration column is visible between Last Login and Created On
   * in the Users list grid
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationColumnVisibleInUserGrid() {
    return this.filterOps.verifyAccessExpirationColumnVisibleInUserGrid();
  }

  /**
   * Verify Access Expiration column is NOT visible in the Users list grid
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationColumnNotVisibleInUserGrid() {
    return this.filterOps.verifyAccessExpirationColumnNotVisibleInUserGrid();
  }

  /**
   * Get the Access Expiration cell value for a user in the Users list grid
   * @param {string} userName - First name of the user
   * @returns {Promise<string>} The cell text
   */
  async getAccessExpirationValueForUser(userName) {
    return this.filterOps.getAccessExpirationValueForUser(userName);
  }

  /**
   * Verify Access Expiration date format (MM/DD/YYYY) for a user in the Users list grid
   * @param {string} userName - First name of the user
   * @returns {Promise<string>} The date value
   */
  async verifyAccessExpirationDateFormatInUserGrid(userName) {
    return this.filterOps.verifyAccessExpirationDateFormatInUserGrid(userName);
  }

  /**
   * Verify Access Expiration cell is empty for a user in the Users list grid
   * @param {string} userName - First name of the user
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationCellEmptyForUser(userName) {
    return this.filterOps.verifyAccessExpirationCellEmptyForUser(userName);
  }

  /**
   * Get all visible Access Expiration values from the Users list grid
   * @returns {Promise<string[]>} Array of cell text values
   */
  async getAllAccessExpirationValues() {
    return this.filterOps.getAllAccessExpirationValues();
  }

  /**
   * Sort Access Expiration column in ascending order in Users list grid
   * @returns {Promise<void>}
   */
  async sortAccessExpirationAscending() {
    return this.filterOps.sortAccessExpirationAscending();
  }

  /**
   * Sort Access Expiration column in descending order in Users list grid
   * @returns {Promise<void>}
   */
  async sortAccessExpirationDescending() {
    return this.filterOps.sortAccessExpirationDescending();
  }

  /**
   * Verify Access Expiration values are sorted ascending in Users list grid
   * @returns {Promise<string[]>} The sorted values
   */
  async verifyAccessExpirationSortedAscending() {
    return this.filterOps.verifyAccessExpirationSortedAscending();
  }

  /**
   * Verify Access Expiration values are sorted descending in Users list grid
   * @returns {Promise<string[]>} The sorted values
   */
  async verifyAccessExpirationSortedDescending() {
    return this.filterOps.verifyAccessExpirationSortedDescending();
  }

  /**
   * Filter Access Expiration column by a specific value in Users list grid
   * @param {string} searchText - Value to filter by
   * @returns {Promise<void>}
   */
  async filterAccessExpirationByValue(searchText) {
    return this.filterOps.filterAccessExpirationByValue(searchText);
  }

  /**
   * Filter Access Expiration column to show only blank values in Users list grid
   * @returns {Promise<void>}
   */
  async filterAccessExpirationByBlanks() {
    return this.filterOps.filterAccessExpirationByBlanks();
  }

  /**
   * Clear the filter on the Access Expiration column in Users list grid
   * @returns {Promise<void>}
   */
  async clearAccessExpirationColumnFilter() {
    return this.filterOps.clearAccessExpirationColumnFilter();
  }

  /**
   * Verify all visible Access Expiration values match the expected value
   * @param {string} expectedValue - Expected cell value
   * @returns {Promise<number>} Count of rows verified
   */
  async verifyAllAccessExpirationValuesMatch(expectedValue) {
    return this.filterOps.verifyAllAccessExpirationValuesMatch(expectedValue);
  }

  /**
   * Verify all visible Access Expiration cells are empty
   * @returns {Promise<number>} Count of rows verified
   */
  async verifyAllAccessExpirationValuesEmpty() {
    return this.filterOps.verifyAllAccessExpirationValuesEmpty();
  }

  // ── Access Expiration Context Menu & Popup Delegates ───────────

  /**
   * Click/select a user row in the Users list grid
   * @param {string} userName - First name of the user
   * @returns {Promise<void>}
   */
  async clickUserRowInGrid(userName) {
    return this.filterOps.clickUserRowInGrid(userName);
  }

  /**
   * Verify the user row is highlighted (selected/yellow) in the grid
   * @param {string} userName - First name of the user
   * @returns {Promise<void>}
   */
  async verifyUserRowHighlighted(userName) {
    return this.filterOps.verifyUserRowHighlighted(userName);
  }

  /**
   * Right-click the Access Expiration cell for a user
   * @param {string} userName - First name of the user
   * @returns {Promise<void>}
   */
  async rightClickAccessExpirationCell(userName) {
    return this.filterOps.rightClickAccessExpirationCell(userName);
  }

  /**
   * Verify the context menu item is visible
   * @param {string} menuItemText - Context menu item text
   * @returns {Promise<void>}
   */
  async verifyContextMenuItemVisible(menuItemText) {
    return this.filterOps.verifyContextMenuItemVisible(menuItemText);
  }

  /**
   * Click a context menu item
   * @param {string} menuItemText - Context menu item text
   * @returns {Promise<void>}
   */
  async clickContextMenuItem(menuItemText) {
    return this.filterOps.clickContextMenuItem(menuItemText);
  }

  /**
   * Verify the Access Expiration Dates popup is visible
   * @param {string} popupTitle - Expected popup title
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationPopupVisible(popupTitle) {
    return this.filterOps.verifyAccessExpirationPopupVisible(popupTitle);
  }

  /**
   * Select a future date in the popup calendar
   * @returns {Promise<string>} Selected date in MM/DD/YYYY format
   */
  async selectFutureDateInPopupCalendar() {
    return this.filterOps.selectFutureDateInPopupCalendar();
  }

  /**
   * Clear the date in the popup using the clear icon
   * @returns {Promise<void>}
   */
  async clearDateInPopup() {
    return this.filterOps.clearDateInPopup();
  }

  /**
   * Click the "Apply to all" checkbox in the popup
   * @param {string} labelText - Checkbox label text
   * @returns {Promise<void>}
   */
  async clickApplyToAllFilteredUsersCheckbox(labelText) {
    return this.filterOps.clickApplyToAllFilteredUsersCheckbox(labelText);
  }

  /**
   * Click "Save and Exit" button in the popup
   * @param {string} buttonText - Button text
   * @returns {Promise<void>}
   */
  async clickSaveAndExitInPopup(buttonText) {
    return this.filterOps.clickSaveAndExitInPopup(buttonText);
  }

  /**
   * Verify confirmation popup message
   * @param {string} expectedMessage - Expected message
   * @returns {Promise<void>}
   */
  async verifyConfirmationPopupMessage(expectedMessage) {
    return this.filterOps.verifyConfirmationPopupMessage(expectedMessage);
  }

  /**
   * Click YES on confirmation popup
   * @returns {Promise<void>}
   */
  async clickYesOnConfirmation() {
    return this.filterOps.clickYesOnConfirmation();
  }

  /**
   * Click NO on confirmation popup
   * @returns {Promise<void>}
   */
  async clickNoOnConfirmation() {
    return this.filterOps.clickNoOnConfirmation();
  }

  /**
   * Verify access expiration success message
   * @param {string} expectedMessage - Expected success message
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationSuccessMessage(expectedMessage) {
    return this.filterOps.verifyAccessExpirationSuccessMessage(expectedMessage);
  }

  /**
   * Verify Access Expiration value matches expected date for a user
   * @param {string} userName - User first name
   * @param {string} expectedDate - Expected date string
   * @returns {Promise<void>}
   */
  async verifyAccessExpirationValueForUser(userName, expectedDate) {
    return this.filterOps.verifyAccessExpirationValueForUser(
      userName, expectedDate,
    );
  }

  /**
   * Get the state of a context menu item (visible/disabled)
   * @param {string} menuItemText - Menu item text
   * @returns {Promise<{visible: boolean, disabled: boolean}>}
   */
  async getContextMenuItemState(menuItemText) {
    return this.filterOps.getContextMenuItemState(menuItemText);
  }

  /**
   * Verify a context menu item is visible and disabled
   * @param {string} menuItemText - Text of the menu item
   * @returns {Promise<void>}
   */
  async verifyContextMenuItemDisabled(menuItemText) {
    return this.filterOps.verifyContextMenuItemDisabled(menuItemText);
  }

  /**
   * Read the current value from the datepicker in the Access Expiration popup
   * @returns {Promise<string>} The date value in MM/DD/YYYY format
   */
  async getPopupDatePickerValue() {
    return this.filterOps.getPopupDatePickerValue();
  }

  /**
   * Verify the popup datepicker default date is today + 1 year
   * @returns {Promise<void>}
   */
  async verifyPopupDateIsDefaultOneYearFromToday() {
    return this.filterOps.verifyPopupDateIsDefaultOneYearFromToday();
  }

  /**
   * Verify the popup datepicker shows a specific expected date
   * @param {string} expectedDate - Expected date string (MM/DD/YYYY)
   * @returns {Promise<void>}
   */
  async verifyPopupDateMatchesExpectedDate(expectedDate) {
    return this.filterOps.verifyPopupDateMatchesExpectedDate(expectedDate);
  }

  /**
   * Click Cancel button in the Access Expiration popup
   * @returns {Promise<void>}
   */
  async clickCancelInPopup() {
    return this.filterOps.clickCancelInPopup();
  }

  /**
   * Find Access Expiration column header index
   * @private
   * @returns {Promise<number>} Index of Access Expiration header
   * @throws {Error} If header not found
   */
  async _findAccessExpirationHeader() {
    const allDivs = this.page.locator('div');
    const divCount = await allDivs.count();

    this.logger.info(`Searching ${divCount} divs for Access Expiration header`);

    for (let i = 0; i < divCount; i++) {
      const divText = await allDivs.nth(i).textContent();
      if (divText?.trim() === COLUMN_HEADERS.ACCESS_EXPIRATION.first) {
        const nextText = await this._getNextDivText(allDivs, i);
        if (nextText === COLUMN_HEADERS.ACCESS_EXPIRATION.second) {
          this.logger.info(`Found Access Expiration header at index ${i}`);
          return i;
        }
      }
    }

    throw new Error('Access Expiration column header not found');
  }

  /**
   * Find date values after given index
   * @private
   * @param {number} startIndex - Index to start scanning from
   * @param {number} [maxScan=200] - Maximum elements to scan
   * @returns {Promise<Array<{index: number, value: string}>>} Array of date objects
   */
  async _findDateValuesAfterIndex(startIndex, maxScan = 200) {
    const allDivs = this.page.locator('div');
    const divCount = await allDivs.count();
    const dateDivs = [];

    const endIndex = Math.min(divCount, startIndex + maxScan);

    for (let i = startIndex + 1; i < endIndex; i++) {
      const divText = await allDivs.nth(i).textContent();
      const trimmedText = divText?.trim() ?? '';

      if (DATE_PATTERNS.MM_DD_YYYY.test(trimmedText)) {
        dateDivs.push({ index: i, value: trimmedText });
        this.logger.info(`Found date "${trimmedText}" at index ${i}`);
      }
    }

    return dateDivs;
  }

  /**
   * Verify date format matches other date columns in report
   * @param {string} dateValue - Date value to verify
   * @returns {Promise<void>}
   * @throws {Error} If date format is invalid
   */
  async verifyDateFormatMatches(dateValue) {
    this.logger.action(`Verifying date format for: ${dateValue}`);

    try {
      if (!DATE_PATTERNS.MM_DD_YYYY.test(dateValue)) {
        throw new Error(
          `Access Expiration date format "${dateValue}" does not match expected pattern MM/DD/YYYY`,
        );
      }

      this.logger.info(`✓ Access Expiration date "${dateValue}" matches MM/DD/YYYY format`);

      const referenceDates = await this._findReferenceDates();

      if (referenceDates.length > 0) {
        this.logger.info(`✓ Access Expiration date format "${dateValue}" matches other date column formats`);
      } else {
        this.logger.info(`✓ Access Expiration date format "${dateValue}" matches expected pattern MM/DD/YYYY`);
      }
    } catch (error) {
      this.logger.error(`Date format verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find reference dates from other columns for format comparison
   * @private
   * @returns {Promise<string[]>} Array of reference date values
   */
  async _findReferenceDates() {
    const referenceDates = [];

    const createdDate = await this._findDateForColumn(COLUMN_HEADERS.CREATED_DATE);
    if (createdDate) {
      referenceDates.push(createdDate);
      this.logger.info(`Reference Created Date: ${createdDate}`);
    }

    const lastLogonDate = await this._findDateForSplitColumn(
      COLUMN_HEADERS.LAST_LOGON.first,
      COLUMN_HEADERS.LAST_LOGON.second,
    );
    if (lastLogonDate) {
      referenceDates.push(lastLogonDate);
      this.logger.info(`Reference Last Logon Date: ${lastLogonDate}`);
    }

    return referenceDates;
  }

  /**
   * Find first date value for a single-line column header
   * @private
   * @param {string} headerText - Column header text
   * @param {number} [maxScan=100] - Maximum elements to scan after header
   * @returns {Promise<string|null>} Date value or null if not found
   */
  async _findDateForColumn(headerText, maxScan = 100) {
    const allDivs = this.page.locator('div');
    const divCount = await allDivs.count();

    for (let i = 0; i < divCount; i++) {
      const divText = await allDivs.nth(i).textContent();
      if (divText?.trim() === headerText) {
        const dates = await this._findDateValuesAfterIndex(i, maxScan);
        return dates.length > 0 ? dates[0].value : null;
      }
    }

    return null;
  }

  /**
   * Find first date value for a split column header (two-line header)
   * @private
   * @param {string} firstLine - First line of header
   * @param {string} secondLine - Second line of header
   * @param {number} [maxScan=100] - Maximum elements to scan after header
   * @returns {Promise<string|null>} Date value or null if not found
   */
  async _findDateForSplitColumn(firstLine, secondLine, maxScan = 100) {
    const allDivs = this.page.locator('div');
    const divCount = await allDivs.count();

    for (let i = 0; i < divCount; i++) {
      const divText = await allDivs.nth(i).textContent();
      if (divText?.trim() === firstLine) {
        const nextText = await this._getNextDivText(allDivs, i);
        if (nextText === secondLine) {
          const dates = await this._findDateValuesAfterIndex(i + 1, maxScan);
          return dates.length > 0 ? dates[0].value : null;
        }
      }
    }

    return null;
  }
}

module.exports = AdministrationUserPage;
