const logger = require('./logger');

/**
 * Shared test helpers for Administration User Management tests.
 * Provides common workflows for navigation, user setup, access grant/removal,
 * grid verification, and cleanup across admin user test suites.
 *
 * Usage:
 *   const AdminUserTestHelpers = require('../../../utils/adminUserTestHelpers');
 *   let helpers;
 *   test.beforeEach(async ({ page }) => {
 *     helpers = new AdminUserTestHelpers(testSetup, administrationUserPage);
 *   });
 */
class AdminUserTestHelpers {
  /** Short timeout for grid row checks that may legitimately be empty */
  static SHORT_GRID_TIMEOUT = 5000;

  /** Max retry attempts for cleanup operations */
  static MAX_CLEANUP_RETRIES = 3;

  /**
   * @param {Object} testSetup - TestSetup instance (initialised for the page)
   * @param {Object} administrationUserPage - AdministrationUserPage POM instance
   */
  constructor(testSetup, administrationUserPage) {
    this.testSetup = testSetup;
    this.adminPage = administrationUserPage;
  }

  // ─── Navigation ─────────────────────────────────────────────────

  /**
   * Navigate to Administration → Users → List and wait for the grid
   * to be fully loaded and filter-ready.
   * @returns {Promise<void>}
   */
  async navigateToUsersList() {
    await this.testSetup.loginAsValidUser();
    await this.adminPage.waitForDOMContentLoaded();
    await this.testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to ADMINISTRATION → Users → List');
    await this.adminPage.navigateToAdministrationTab();
    await this.adminPage.waitForPageReady();
    await this.adminPage.verifySiteListVisible();
    await this.adminPage.navigateToUsersList();
    await this.adminPage.waitForUserGridToLoad();
    await this.adminPage.waitForUserGridFilterReady();
  }

  // ─── User Setup ─────────────────────────────────────────────────

  /**
   * Filter user by first name, expand the user list section,
   * click Edit, and open Site Access & Permissions.
   * Assumes the caller has already navigated to the Users List.
   * @param {string} userName - User first name to filter by
   * @param {number} [expandOffset] - Pixel offset for expandUserListSection.
   *   Pass -200 to shrink the user list (revealing USER INFORMATION).
   *   Omit or pass undefined for the page-object default.
   * @returns {Promise<void>}
   */
  async setupUserForSiteAccess(userName, expandOffset) {
    logger.step(`Filter and edit user: ${userName}`);
    await this.adminPage.filterByFirstName(userName);
    // Forward expandOffset when provided; omit to use page-object default
    await this.adminPage.expandUserListSection(
      ...(expandOffset !== undefined ? [expandOffset] : []),
    );
    await this.adminPage.clickEditButton();
    await this.adminPage.openSiteAccessPermissions();
  }

  /**
   * Convenience: navigate to the Users List, then set up the user
   * for site access editing in one call.
   * @param {string} userName - User first name to filter by
   * @param {number} [expandOffset] - Pixel offset for expandUserListSection
   * @returns {Promise<void>}
   */
  async navigateAndSetupUser(userName, expandOffset) {
    await this.navigateToUsersList();
    await this.setupUserForSiteAccess(userName, expandOffset);
  }

  // ─── Grant Operations ──────────────────────────────────────────

  /**
   * Grant site-level access to a site and save.
   * Cleans up any pre-existing access first to ensure a fresh grant.
   * @param {string} siteName - Site name to grant access to
   * @returns {Promise<void>}
   */
  async grantSiteAccessAndSave(siteName) {
    logger.step(`Check for pre-existing access to "${siteName}"`);
    await this.adminPage.ensureShowSitesWithAccessGrantedIsSelected();
    await this.adminPage.waitForSiteAccessGridToLoad();

    try {
      await this.adminPage.waitForSitesInGrid([siteName], 5000);
      logger.info(
        `Site "${siteName}" has existing access — removing first`,
      );
      await this.adminPage.removeAccessForSite(siteName);
      await this.adminPage.clickSaveButton();
      await this.adminPage.waitForSuccessMessage();
      await this.adminPage.clickEditButton();
      await this.adminPage.openSiteAccessPermissions();
    } catch (error) {
      // Only swallow "not found / timeout" — propagate others
      if (/timeout|not found|not visible/i.test(error.message)) {
        logger.info(
          `Site "${siteName}" has no existing access — proceeding`,
        );
      } else {
        throw error;
      }
    }

    await this.adminPage.enableShowSitesWithNoAccess();
    await this.adminPage.waitForSiteAccessGridToLoad();
    await this.adminPage.filterBySiteName(siteName);
    await this.adminPage.waitForGridRows();
    await this.adminPage.clickSiteCell(siteName);
    await this.adminPage.grantAccessToSite(siteName);
    await this.adminPage.clickSaveButton();
    await this.adminPage.waitForSuccessMessage();
    logger.info(`✓ Site access granted to "${siteName}"`);
  }

  /**
   * Grant group-level access and save.
   * Checks for pre-existing group access and removes it first.
   * @param {string} groupName - Group name to grant access to
   * @returns {Promise<void>}
   */
  async grantGroupAccessAndSave(groupName) {
    logger.step(`Grant group access to "${groupName}"`);
    await this.adminPage.openSiteAccessPermissions();
    await this.adminPage.openGroupAccessPermissions();

    // Check for pre-existing group access
    await this.adminPage.enableShowGroupsWithAccessGranted();
    try {
      await this.adminPage.waitForGridRows(
        AdminUserTestHelpers.SHORT_GRID_TIMEOUT,
      );
      const isAlreadyGranted =
        await this.adminPage.isGroupVisibleInGrid(groupName);
      if (isAlreadyGranted) {
        logger.info(
          `Group "${groupName}" already has access — removing first`,
        );
        await this.adminPage.removeAccessForGroup(groupName);
        await this.adminPage.clickSaveButton();
        await this.adminPage.waitForSuccessMessage();
        await this.adminPage.clickEditButton();
        await this.adminPage.openSiteAccessPermissions();
        await this.adminPage.openGroupAccessPermissions();
      }
    } catch (error) {
      // Only swallow "no rows / timeout" — propagate others
      if (/timeout|not found|not visible/i.test(error.message)) {
        logger.info('No groups with access found — proceeding to grant');
      } else {
        throw error;
      }
    }

    // Grant access
    await this.adminPage.enableShowGroupsWithNoAccess();
    await this.adminPage.waitForGridRows();
    await this.adminPage.filterByGroupName(groupName);
    await this.adminPage.waitForGridRows();
    await this.adminPage.clickGroupCell(groupName);
    await this.adminPage.grantAccessToGroup(groupName);
    logger.info(`✓ Group "${groupName}" selected for access`);
  }

  // ─── Edit-Mode Helpers ─────────────────────────────────────────

  /**
   * Enter edit mode and open the site access grid with
   * Access Status / Expiration columns visible.
   * Reusable for any step that needs to verify site access state.
   * @returns {Promise<void>}
   */
  async openSiteAccessInEditMode() {
    await this.adminPage.clickEditButton();
    await this.adminPage.openSiteAccessPermissions();
    await this.adminPage.ensureShowSitesWithAccessGrantedIsSelected();
    await this.adminPage.waitForSiteAccessGridToLoad();
    await this.adminPage.disableShowPermissionColumnsWithRetry();
    await this.adminPage.waitForGridRows();
  }

  /**
   * Save the current form and wait for the success message +
   * DOM content loaded. Combines three calls made frequently
   * throughout the test suite.
   * @returns {Promise<void>}
   */
  async saveAndWaitForSuccess() {
    await this.adminPage.clickSaveButton();
    await this.adminPage.waitForSuccessMessage();
    await this.adminPage.waitForDOMContentLoaded();
  }

  /**
   * Navigate to Administration → Sites → List page.
   * Combines the ADMINISTRATION tab click and the List button click.
   * @returns {Promise<void>}
   */
  async navigateToSiteList() {
    await this.adminPage.navigateToSitesList();
    await this.adminPage.clickSiteListButton();
  }

  /**
   * Navigate back to the Users List from any Administration sub-page.
   * Clicks ADMINISTRATION tab, waits for page ready, then opens
   * Users → List and waits for the grid and filters.
   * @returns {Promise<void>}
   */
  async navigateBackToUsersList() {
    await this.adminPage.navigateToAdministrationTab();
    await this.adminPage.waitForPageReady();
    await this.adminPage.verifySiteListVisible();
    await this.adminPage.navigateToUsersList();
    await this.adminPage.waitForUserGridToLoad();
    await this.adminPage.waitForUserGridFilterReady();
  }

  /**
   * Navigate back to Users List, filter by user, open edit mode,
   * then open the site access grid with permission columns hidden.
   * Combines the repeated "post-save user verification" pattern.
   * @param {string} userName - User first name to filter by
   * @returns {Promise<void>}
   */
  async navigateBackAndOpenUserSiteAccess(userName) {
    await this.navigateBackToUsersList();
    await this.adminPage.filterByFirstName(userName);
    await this.adminPage.expandUserListSection(-200);
    await this.adminPage.clickEditButton();
    await this.adminPage.openSiteAccessPermissions();
    await this.adminPage.ensureShowSitesWithAccessGrantedIsSelected();
    await this.adminPage.waitForSiteAccessGridToLoad();
    await this.adminPage.disableShowPermissionColumnsWithRetry();
    await this.adminPage.waitForGridRows();
  }

  /**
   * Change site group dropdowns (Region, SCS Office, Client).
   * @param {Object} groups - Object with Region, SCS Office, Client values
   * @param {string} groups.region - Region dropdown value
   * @param {string} groups.scsOffice - SCS Office dropdown value
   * @param {string} groups.client - Client dropdown value
   * @returns {Promise<void>}
   */
  async changeSiteGroups({ region, scsOffice, client }) {
    await this.adminPage.changeSiteGroupDropdown('Region', region);
    await this.adminPage
      .changeSiteGroupDropdown('SCS Office', scsOffice);
    await this.adminPage.changeSiteGroupDropdown('Client', client);
  }

  /**
   * Open a site in the Site List, click Edit, and change its group
   * dropdowns. Combines navigation, filtering, edit click, and
   * dropdown changes into one call.
   * @param {string} siteName - Site name to filter and edit
   * @param {Object} groups - Group dropdown values
   * @param {string} groups.region - Region value
   * @param {string} groups.scsOffice - SCS Office value
   * @param {string} groups.client - Client value
   * @returns {Promise<void>}
   */
  async navigateToSiteAndChangeGroups(siteName, groups) {
    await this.navigateToSiteList();
    await this.adminPage.filterSiteGridByName(siteName);
    await this.adminPage.clickSiteRowEditButton();
    await this.changeSiteGroups(groups);
  }

  /**
   * Revert site groups to original values with save + success
   * message verification. Navigates to Site List, filters, edits,
   * changes dropdowns, saves, and waits for success.
   * @param {string} siteName - Site name to revert
   * @param {Object} groups - Original group values to restore
   * @param {string} groups.region - Original region
   * @param {string} groups.scsOffice - Original SCS Office
   * @param {string} groups.client - Original client
   * @param {string} successMessage - Expected success toast message
   * @returns {Promise<void>}
   */
  async revertSiteGroups(siteName, groups, successMessage) {
    await this.navigateToSiteAndChangeGroups(siteName, groups);
    await this.adminPage.clickSiteSaveButton();
    await this.adminPage.waitForSiteSuccessMessage(successMessage);
  }

  /**
   * Enter group-access cleanup mode with guarded calls.
   * Each step is wrapped so one failure does not block the next.
   * @returns {Promise<void>}
   */
  async enterGroupCleanupMode() {
    await this.adminPage.clickEditButton()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage.openGroupAccessPermissions()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
  }

  /**
   * Build an originalGroups object from a siteGroups test‑data entry.
   * @param {Object} siteGroups - siteGroups block from testData.json
   * @param {string} siteGroups.originalRegion
   * @param {string} siteGroups.originalScsOffice
   * @param {string} siteGroups.originalClient
   * @returns {{region: string, scsOffice: string, client: string}}
   */
  static buildOriginalGroups(siteGroups) {
    return {
      region: siteGroups.originalRegion,
      scsOffice: siteGroups.originalScsOffice,
      client: siteGroups.originalClient,
    };
  }

  /**
   * Safety-net cleanup for user access (site + group).
   * Each step is guarded so one failure does not block the next.
   * @param {string} groupName - Group to clean up
   * @param {string} siteName - Site to clean up
   * @returns {Promise<void>}
   */
  async safeCleanupUserAccess(groupName, siteName) {
    await this.adminPage.clickEditButton()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage.openSiteAccessPermissions()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage.openGroupAccessPermissions()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.cleanupGroupAccess(groupName)
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.cleanupSiteAccess(siteName)
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
  }

  /**
   * Safety-net cleanup for reverting site groups to original values.
   * Each step is guarded so one failure does not block the next.
   * @param {string} siteName - Site name to revert
   * @param {Object} groups - Original group values to restore
   * @param {string} groups.region - Original region
   * @param {string} groups.scsOffice - Original SCS Office
   * @param {string} groups.client - Original client
   * @returns {Promise<void>}
   */
  async safeRevertSiteGroups(siteName, groups) {
    await this.adminPage.navigateToSitesList()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage.clickSiteListButton()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage.filterSiteGridByName(siteName)
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage.clickSiteRowEditButton()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage
      .changeSiteGroupDropdown('Region', groups.region)
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage
      .changeSiteGroupDropdown('SCS Office', groups.scsOffice)
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage
      .changeSiteGroupDropdown('Client', groups.client)
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
    await this.adminPage.clickSiteSaveButton()
      .catch((e) => logger.warn(`Cleanup skip: ${e.message}`));
  }

  /**
   * Execute the shared setup flow for EXP-48, EXP-49, and EXP-50.
   *
   * Performs Steps 1–17:
   *   1-2) Navigate to Users List, set up user for site access
   *   3)   Grant site-level access
   *   4)   Verify Access Expiration and Status exist
   *   5)   Grant group-level access and save
   *   6-7) Navigate to Site List, filter site
   *   8)   Click Edit on the site
   *   9)   Change group assignments to new values
   *  10)   Save and verify confirmation popup title + message
   *  11)   Click No — dismiss popup
   *  12)   Save again & confirm with Yes
   *  13)   Verify success message
   *  14)   Navigate back to Users List
   *  15)   Search user, open site access
   *  16)   Verify Access Expiration is empty
   *  17)   Verify Access Status is empty
   *
   * @param {Object} testData - Destructured test data object
   * @param {string} testData.userName - User first name
   * @param {string} testData.siteName - Site name
   * @param {string} testData.groupName - Group name
   * @param {string} testData.confirmationTitle - Expected popup title
   * @param {string} testData.confirmationMessage - Expected popup message
   * @param {string} testData.successMessage - Expected success toast
   * @param {Object} testData.siteGroups - Site group dropdown values
   * @returns {Promise<void>}
   */
  async performSharedEXP48Setup({
    userName, siteName, groupName, confirmationTitle,
    confirmationMessage, successMessage, siteGroups,
  }) {
    // Steps 1-2
    await this.navigateToUsersList();
    await this.setupUserForSiteAccess(userName, -200);

    // Step 3
    logger.step(`Step 3: Grant site-level access to "${siteName}"`);
    await this.grantSiteAccessAndSave(siteName);

    // Step 4
    logger.step('Step 4: Verify Access Expiration and Status exist');
    await this.openSiteAccessInEditMode();
    await this.adminPage
      .verifyAccessExpirationDateIsNotEmpty(siteName);
    await this.adminPage.verifyAccessStatusIsNotEmpty(siteName);
    await this.adminPage.waitForDOMContentLoaded();

    // Step 5
    logger.step(`Step 5: Grant group-level access to "${groupName}"`);
    await this.grantGroupAccessAndSave(groupName);
    await this.saveAndWaitForSuccess();

    // Steps 6-7
    logger.step('Step 6: Navigate to Site List');
    await this.navigateToSiteList();

    logger.step(`Step 7: Filter site by name: "${siteName}"`);
    await this.adminPage.filterSiteGridByName(siteName);

    // Step 8
    logger.step('Step 8: Click Edit on the site');
    await this.adminPage.clickSiteRowEditButton();

    // Step 9
    logger.step('Step 9: Change group assignments');
    await this.changeSiteGroups({
      region: siteGroups.newRegion,
      scsOffice: siteGroups.newScsOffice,
      client: siteGroups.newClient,
    });

    // Step 10
    logger.step('Step 10: Click Save and verify confirmation popup');
    await this.adminPage.clickSiteSaveButton();
    await this.adminPage
      .verifyConfirmationPopupTitle(confirmationTitle);
    await this.adminPage
      .verifyConfirmationPopupMessage(confirmationMessage);

    // Step 11
    logger.step('Step 11: Click No on confirmation popup');
    await this.adminPage.clickNoOnConfirmation();
    await this.adminPage.verifySaveButtonIsVisible();
    logger.info('✓ Confirmation dismissed — user remains on edit screen');

    // Step 12
    logger.step('Step 12: Click Save again and confirm with Yes');
    await this.adminPage.clickSiteSaveButton();
    await this.adminPage
      .verifyConfirmationPopupTitle(confirmationTitle);
    await this.adminPage.clickYesOnConfirmation();

    // Step 13
    logger.step('Step 13: Verify success message');
    await this.adminPage.waitForSiteSuccessMessage(successMessage);

    // Steps 14-15
    logger.step('Step 14: Navigate back to Users List');
    logger.step(`Step 15: Search user "${userName}" and open site access`);
    await this.navigateBackAndOpenUserSiteAccess(userName);

    // Step 16
    logger.step(
      `Step 16: Verify Access Expiration is empty for "${siteName}"`,
    );
    await this.adminPage
      .verifyAccessExpirationDateIsEmpty(siteName);

    // Step 17
    logger.step(
      `Step 17: Verify Access Status is empty for "${siteName}"`,
    );
    await this.adminPage.verifyAccessStatusIsEmpty(siteName);
  }

  /**
   * Remove group-level access for a group and save.
   * Assumes the user is already in edit mode.
   * @param {string} groupName - Group name to remove access from
   * @returns {Promise<void>}
   */
  async removeGroupAccessAndSave(groupName) {
    await this.adminPage.openGroupAccessPermissions();
    await this.adminPage.enableShowGroupsWithAccessGranted();
    await this.adminPage.waitForGridRows();
    await this.adminPage.removeAccessForGroup(groupName);
    await this.adminPage.clickSaveButton();
    await this.adminPage.waitForSuccessMessage();
    await this.adminPage.waitForDOMContentLoaded();
    logger.info(`✓ Group access to "${groupName}" removed`);
  }

  /**
   * Prepare the grid for verification after saving.
   * Verifies "show sites with access" is selected, waits for content,
   * enters edit mode and disables permission columns.
   * @returns {Promise<void>}
   */
  async prepareGridForVerification() {
    await this.adminPage.verifyShowSitesWithAccessSelected();
    await this.adminPage.waitForGridContent();
    await this.adminPage.clickEditButton();
    await this.adminPage.waitForSiteAccessGridToLoad();
    await this.adminPage.disableShowPermissionColumnsWithRetry();
    await this.adminPage.waitForGridRows();
    await this.adminPage.ensureShowSitesWithAccessGrantedIsSelected();
  }

  // ─── Cleanup Operations ────────────────────────────────────────

  /**
   * Filter user list, open edit mode, then clean up group access.
   * Combines filter + expand + edit + openSiteAccess +
   * openGroupAccess + cleanupGroupAccess into a single call.
   * @param {string} userName - User first name to filter by
   * @param {string} groupName - Group name to remove access from
   * @returns {Promise<void>}
   */
  async findUserAndCleanupGroupAccess(userName, groupName) {
    await this.adminPage.filterByFirstName(userName);
    await this.adminPage.expandUserListSection(-200);
    await this.adminPage.clickEditButton();
    await this.adminPage.openSiteAccessPermissions();
    await this.adminPage.openGroupAccessPermissions();
    await this.cleanupGroupAccess(groupName);
  }

  /**
   * Cleanup site-level access with retry logic.
   * Safe to call even when access has already been removed.
   * @param {string} siteName - Site name to remove access from
   * @returns {Promise<void>}
   */
  async cleanupSiteAccess(siteName) {
    try {
      logger.step(`Cleanup — removing site access for: ${siteName}`);

      for (
        let attempt = 1;
        attempt <= AdminUserTestHelpers.MAX_CLEANUP_RETRIES;
        attempt++
      ) {
        logger.info(
          `Cleanup attempt ${attempt}/${AdminUserTestHelpers.MAX_CLEANUP_RETRIES}`,
        );

        await this.adminPage
          .ensureShowSitesWithAccessGrantedIsSelected();
        await this.adminPage.waitForSiteAccessGridToLoad();
        await this.adminPage.disableShowPermissionColumnsWithRetry();
        await this.adminPage.waitForAccessStatusColumn();

        const isSiteVisible =
          await this.adminPage.isSiteVisibleInGrid(siteName);
        if (!isSiteVisible) {
          logger.info(
            `✓ Site "${siteName}" not found in grid — already removed`,
          );
          break;
        }

        await this.adminPage.removeAccessForSite(siteName);
        await this.adminPage.clickSaveButton();
        await this.adminPage.waitForSuccessMessage();
        logger.info(`✓ Save completed on attempt ${attempt}`);

        await this.adminPage.clickEditButton();
        await this.adminPage.waitForSiteAccessGridToLoad();
        await this.adminPage.disableShowPermissionColumnsWithRetry();
        await this.adminPage
          .ensureShowSitesWithAccessGrantedIsSelected();
        await this.adminPage.waitForSiteAccessGridToLoad();

        const isStillVisible =
          await this.adminPage.isSiteVisibleInGrid(siteName);
        if (!isStillVisible) {
          logger.info(
            `✓ Successfully removed access for site: ${siteName}`,
          );
          break;
        }

        if (attempt === AdminUserTestHelpers.MAX_CLEANUP_RETRIES) {
          logger.warn(
            `⚠ Site "${siteName}" still visible after ${AdminUserTestHelpers.MAX_CLEANUP_RETRIES} attempts`,
          );
        } else {
          logger.warn(
            `Site "${siteName}" still visible after save, retrying...`,
          );
        }
      }
    } catch (error) {
      logger.warn(`Site cleanup warning: ${error.message}`);
    }
  }

  /**
   * Cleanup group-level access with retry logic.
   * Safe to call even when access has already been removed.
   * @param {string} groupName - Group name to remove access from
   * @returns {Promise<void>}
   */
  async cleanupGroupAccess(groupName) {
    try {
      logger.step(
        `Cleanup — removing group access for: ${groupName}`,
      );

      for (
        let attempt = 1;
        attempt <= AdminUserTestHelpers.MAX_CLEANUP_RETRIES;
        attempt++
      ) {
        logger.info(
          `Cleanup attempt ${attempt}/${AdminUserTestHelpers.MAX_CLEANUP_RETRIES}`,
        );

        await this.adminPage.enableShowGroupsWithAccessGranted();

        try {
          await this.adminPage.waitForGridRows(
            AdminUserTestHelpers.SHORT_GRID_TIMEOUT,
          );
        } catch {
          logger.info(
            `✓ Group grid empty — "${groupName}" already removed`,
          );
          break;
        }

        const isGroupVisible =
          await this.adminPage.isGroupVisibleInGrid(groupName);
        if (!isGroupVisible) {
          logger.info(
            `✓ Group "${groupName}" not in grid — already removed`,
          );
          break;
        }

        await this.adminPage.removeAccessForGroup(groupName);
        await this.adminPage.clickSaveButton();
        await this.adminPage.waitForSuccessMessage();
        logger.info(`✓ Save completed on attempt ${attempt}`);

        await this.adminPage.clickEditButton();
        await this.adminPage.enableShowGroupsWithAccessGranted();

        try {
          await this.adminPage.waitForGridRows(
            AdminUserTestHelpers.SHORT_GRID_TIMEOUT,
          );
        } catch {
          logger.info(
            '✓ Group access removed (grid empty after save)',
          );
          break;
        }

        const isStillVisible =
          await this.adminPage.isGroupVisibleInGrid(groupName);
        if (!isStillVisible) {
          logger.info('✓ Group access removed');
          break;
        }

        if (attempt === AdminUserTestHelpers.MAX_CLEANUP_RETRIES) {
          logger.warn(
            `⚠ Group "${groupName}" still visible after ${AdminUserTestHelpers.MAX_CLEANUP_RETRIES} attempts`,
          );
        } else {
          logger.warn(
            `Group "${groupName}" still visible after save, retrying...`,
          );
        }
      }
    } catch (error) {
      logger.warn(`Group cleanup warning: ${error.message}`);
    }
  }
}

module.exports = AdminUserTestHelpers;
