const { test } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const logger = require('../../../utils/logger');
const AdminUserTestHelpers = require('../../../utils/adminUserTestHelpers');
const testData = require('../../../data/testData.json');

/**
 * Test suite for Admin User Management - Filter by Site Assignment functionality
 * Verifies behavior of the "Assigned to selected site" checkbox filter on the Users list
 */
test.describe('Admin User Mgmt Filter by Site Assignment', () => {
  /** Short timeout for grid row checks that may legitimately be empty */
  const SHORT_GRID_TIMEOUT = 5000;
  /** Delay after programmatic dialog dismissal */
  const DIALOG_DISMISS_DELAY = 500;
  /** Max retry attempts for cleanup operations */
  const MAX_CLEANUP_RETRIES = 3;

  let testSetup;
  let administrationUserPage;
  let helpers;

  test.beforeEach(async ({ page }) => {
    logger.divider();
    logger.info('Setting up test - Initializing page objects');

    testSetup = new TestSetup();
    await testSetup.initialize(page);
    administrationUserPage = testSetup.getAdministrationUserPage();
    helpers = new AdminUserTestHelpers(testSetup, administrationUserPage);

    logger.info('Test setup completed');
    logger.divider();
  });

  /**
   * Helper: Select a site from the SCS DATASERVICES site dropdown and wait for grid to stabilize
   * @param {string} dropdownId - EJ2 dropdown element ID
   * @param {string} siteName - Site name to select
   * @returns {Promise<void>}
   */
  const selectSiteFilter = async (dropdownId, siteName) => {
    logger.step(`Click site dropdown and select "${siteName}"`);
    await administrationUserPage.selectSiteFromDropdownById(dropdownId, siteName);
    logger.info(`✓ Site "${siteName}" selected in dropdown`);

    logger.step('Wait for user grid to stabilize after site selection');
    await administrationUserPage.waitForUserGridFilterReady();
    logger.info('✓ User grid stabilized after site selection');
  };

  /**
   * Helper: Grant direct site-level access to a user.
   * Assumes the current page is the Users List (after navigateToUsersList).
   * Filters to the user, opens edit mode, opens Site Access, removes any
   * pre-existing access to the site, then grants fresh access and saves.
   * @param {string} userName - User first name
   * @param {string} siteName - Site to grant access to
   * @returns {Promise<void>}
   */
  const grantSiteAccess = async (userName, siteName) => {
    logger.step(`Grant site access to "${siteName}" for "${userName}"`);
    await administrationUserPage.expandUserListSection();
    await administrationUserPage.filterByFirstName(userName);
    await administrationUserPage.expandUserListSection();
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openSiteAccessPermissions();

    // Clean up any pre-existing access to ensure a fresh grant
    await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    const isAlreadyGranted = await administrationUserPage.isSiteVisibleInGrid(siteName);
    if (isAlreadyGranted) {
      logger.info(`Site "${siteName}" already has access — removing first`);
      await administrationUserPage.removeAccessForSite(siteName);
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      await administrationUserPage.clickEditButton();
      await administrationUserPage.openSiteAccessPermissions();
    }

    // Grant access
    await administrationUserPage.enableShowSitesWithNoAccess();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    await administrationUserPage.filterBySiteName(siteName);
    await administrationUserPage.waitForGridRows();
    await administrationUserPage.clickSiteCell(siteName);
    await administrationUserPage.grantAccessToSite(siteName);
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    logger.info(`✓ Site access granted to "${siteName}"`);

    // Verify the access was actually saved
    logger.step(`Verify "${siteName}" access was saved by re-opening edit`);
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openSiteAccessPermissions();
    await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    const isSavedOk = await administrationUserPage.isSiteVisibleInGrid(siteName);
    if (!isSavedOk) {
      throw new Error(`Access grant verification failed: "${siteName}" not visible in access-granted grid after save`);
    }
    logger.info(`✓ "${siteName}" confirmed in access-granted grid — access saved`);
    await administrationUserPage.clickCancelButton();
  };

  /**
   * Helper: Remove site-level access from a user (with retry).
   * Navigates to the Users List, opens the user in edit mode, and removes site access.
   * Safe to call even if access has already been removed.
   * @param {string} userName - User first name
   * @param {string} siteName - Site to remove access from
   * @returns {Promise<void>}
   */
  const cleanupSiteAccess = async (userName, siteName) => {
    try {
      logger.step(`Cleanup — removing site access to "${siteName}" for "${userName}"`);
      await administrationUserPage.navigateToUsersList();
      await administrationUserPage.resetAssignedToSiteFilter();
      await administrationUserPage.waitForUserGridFilterReady();
      await administrationUserPage.expandUserListSection();
      await administrationUserPage.filterByFirstName(userName);
      await administrationUserPage.expandUserListSection();
      await administrationUserPage.clickEditButton();
      await administrationUserPage.openSiteAccessPermissions();

      for (let attempt = 1; attempt <= MAX_CLEANUP_RETRIES; attempt++) {
        await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
        await administrationUserPage.waitForSiteAccessGridToLoad();
        const isSiteVisible = await administrationUserPage.isSiteVisibleInGrid(siteName);
        if (!isSiteVisible) {
          logger.info(`✓ Site "${siteName}" not in grid — already removed`);
          await administrationUserPage.clickCancelButton();
          break;
        }
        await administrationUserPage.removeAccessForSite(siteName);
        await administrationUserPage.clickSaveButton();
        await administrationUserPage.waitForSuccessMessage();
        await administrationUserPage.clickEditButton();
        await administrationUserPage.waitForSiteAccessGridToLoad();
        await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
        await administrationUserPage.waitForSiteAccessGridToLoad();
        const isStillVisible = await administrationUserPage.isSiteVisibleInGrid(siteName);
        if (!isStillVisible) {
          logger.info(`✓ Site access removed`);
          await administrationUserPage.clickCancelButton();
          break;
        }
        if (attempt === MAX_CLEANUP_RETRIES) {
          logger.warn(`⚠ Site "${siteName}" still visible after ${MAX_CLEANUP_RETRIES} attempts`);
          await administrationUserPage.clickCancelButton();
        }
      }
    } catch (error) {
      logger.warn(`Site cleanup warning: ${error.message}`);
    }
  };



  /**
   * Helper: Remove group-level access from a user (with retry).
   * Navigates to the Users List, opens the user in edit mode, and removes group access.
   * Safe to call even if access has already been removed.
   * @param {string} userName - User first name
   * @param {string} groupName - Group to remove access from
   * @returns {Promise<void>}
   */
  const cleanupGroupAccess = async (userName, groupName) => {
    try {
      logger.step(`Cleanup — removing group access to "${groupName}" for "${userName}"`);
      await administrationUserPage.navigateToUsersList();
      await administrationUserPage.resetAssignedToSiteFilter();
      await administrationUserPage.waitForUserGridFilterReady();
      await administrationUserPage.expandUserListSection();
      await administrationUserPage.filterByFirstName(userName);
      await administrationUserPage.expandUserListSection();
      await administrationUserPage.clickEditButton();
      await administrationUserPage.openGroupAccessPermissions();

      for (let attempt = 1; attempt <= MAX_CLEANUP_RETRIES; attempt++) {
        await administrationUserPage.enableShowGroupsWithAccessGranted();

        // Grid may be empty if user has no group access
        try {
          await administrationUserPage.waitForGridRows(SHORT_GRID_TIMEOUT);
        } catch (error) {
          logger.info(`✓ Group grid empty — "${groupName}" already removed`);
          await administrationUserPage.clickCancelButton();
          break;
        }

        const isGroupVisible = await administrationUserPage.isGroupVisibleInGrid(groupName);
        if (!isGroupVisible) {
          logger.info(`✓ Group "${groupName}" not in grid — already removed`);
          await administrationUserPage.clickCancelButton();
          break;
        }
        await administrationUserPage.removeAccessForGroup(groupName);
        await administrationUserPage.clickSaveButton();
        await administrationUserPage.waitForSuccessMessage();
        await administrationUserPage.clickEditButton();
        await administrationUserPage.enableShowGroupsWithAccessGranted();

        // Grid may be empty after removal
        try {
          await administrationUserPage.waitForGridRows(SHORT_GRID_TIMEOUT);
        } catch (error) {
          logger.info('✓ Group access removed (grid empty after save)');
          await administrationUserPage.clickCancelButton();
          break;
        }

        const isStillVisible = await administrationUserPage.isGroupVisibleInGrid(groupName);
        if (!isStillVisible) {
          logger.info('✓ Group access removed');
          await administrationUserPage.clickCancelButton();
          break;
        }
        if (attempt === MAX_CLEANUP_RETRIES) {
          logger.warn(`⚠ Group "${groupName}" still visible after ${MAX_CLEANUP_RETRIES} attempts`);
          await administrationUserPage.clickCancelButton();
        }
      }
    } catch (error) {
      logger.warn(`Group cleanup warning: ${error.message}`);
    }
  };

  /**
   * Helper: Apply the "Assigned to selected site" checkbox and wait for grid
   * @returns {Promise<void>}
   */
  const applyAssignedToSiteCheckbox = async () => {
    await administrationUserPage.clickAssignedToSelectedSiteCheckbox();
    await administrationUserPage.waitForUserGridToLoad();
    await administrationUserPage.waitForUserGridFilterReady();
    await administrationUserPage.expandUserListSection();
    logger.info('✓ Grid stabilized after checkbox filter');
  };

  /**
   * Helper: Navigate back to Users → List with optional filter reset and first-name filter
   * @param {Object} [options={}]
   * @param {boolean} [options.shouldResetFilter=false] - Reset the "Assigned to selected site" filter
   * @param {string|null} [options.filterName=null] - First name to filter by
   * @returns {Promise<void>}
   */
  const navigateBackToUsersList = async ({shouldResetFilter = false, filterName = null} = {}) => {
    await administrationUserPage.navigateToUsersList();
    if (shouldResetFilter) {
      await administrationUserPage.resetAssignedToSiteFilter();
    }
    await administrationUserPage.waitForUserGridFilterReady();
    if (filterName) {
      await administrationUserPage.filterByFirstName(filterName);
    }
  };

  /**
   * Helper: Click Edit, open Site Access, remove access for the given site, and save
   * @param {string} siteName - Site to remove access from
   * @returns {Promise<void>}
   */
  const removeSiteAccessInEdit = async (siteName) => {
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openSiteAccessPermissions();
    await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    await administrationUserPage.removeAccessForSite(siteName);
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    logger.info(`✓ Site access to "${siteName}" removed`);
  };

  /**
   * Helper: Click Edit, open Site Access, clear the expiration date for the given site, and save
   * @param {string} siteName - Site whose expiration date should be cleared
   * @returns {Promise<void>}
   */
  const clearExpirationDateInEdit = async (siteName) => {
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openSiteAccessPermissions();
    await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    await administrationUserPage.clearAccessExpirationDate(siteName);
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    // Re-enter edit and cancel to normalise page state (same as grantSiteAccess)
    await administrationUserPage.clickEditButton();
    await administrationUserPage.clickCancelButton();
    logger.info(`✓ Expiration date cleared for "${siteName}"`);
  };

  /**
   * Helper: Click Edit, open Group Access, grant access to the given group, and save.
   * Checks for pre-existing access first and removes it before re-granting,
   * mirroring the safety check in grantSiteAccess.
   * @param {string} groupName - Group to grant access to
   * @returns {Promise<void>}
   */
  const grantGroupAccessInEdit = async (groupName) => {
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openGroupAccessPermissions();

    // Check for pre-existing access to avoid filtering in an empty list
    await administrationUserPage.enableShowGroupsWithAccessGranted();
    // Grid may be empty if user has no group access — catch the timeout
    try {
      await administrationUserPage.waitForGridRows(SHORT_GRID_TIMEOUT);
      const isAlreadyGranted =
        await administrationUserPage.isGroupVisibleInGrid(groupName);
      if (isAlreadyGranted) {
        logger.info(
          `Group "${groupName}" already has access — removing first`,
        );
        await administrationUserPage.removeAccessForGroup(groupName);
        await administrationUserPage.clickSaveButton();
        await administrationUserPage.waitForSuccessMessage();
        await administrationUserPage.clickEditButton();
        await administrationUserPage.openGroupAccessPermissions();
      }
    } catch (error) {
      logger.info(`No groups with access found — proceeding to grant: ${error.message}`);
    }

    // Grant access
    await administrationUserPage.enableShowGroupsWithNoAccess();
    await administrationUserPage.waitForGridRows();
    await administrationUserPage.filterByGroupName(groupName);
    await administrationUserPage.waitForGridRows();
    await administrationUserPage.clickGroupCell(groupName);
    await administrationUserPage.grantAccessToGroup(groupName);
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    logger.info(`✓ Group access granted to "${groupName}"`);
  };

  /**
   * Helper: Click Edit, open Group Access, remove access for the given group, and save
   * @param {string} groupName - Group to remove access from
   * @returns {Promise<void>}
   */
  const removeGroupAccessInEdit = async (groupName) => {
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openGroupAccessPermissions();
    await administrationUserPage.enableShowGroupsWithAccessGranted();
    await administrationUserPage.waitForGridRows();
    await administrationUserPage.removeAccessForGroup(groupName);
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    logger.info(`✓ Group access to "${groupName}" removed`);
  };

  /**
   * Helper: Dismiss all open EJ2 dialogs and overlays via DOM manipulation.
   * Useful in finally blocks when Escape key cannot close modal dialogs.
   * @returns {Promise<void>}
   */
  const dismissAllDialogs = async () => {
    try {
      await administrationUserPage.page.evaluate(() => {
        document.querySelectorAll('.e-dlg-overlay').forEach((el) => el.remove());
        document.querySelectorAll('.e-dlg-container').forEach((el) => el.remove());
      });
      await administrationUserPage.page.waitForTimeout(DIALOG_DISMISS_DELAY);
    } catch (error) {
      logger.info(`Dialog dismissal skipped: ${error.message}`);
    }
  };

  test('ADMIN-FILTR-BY-SITE-ASGN-01 - Verify functionality when "Assigned to selected site" checkbox is not selected', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-01 - Verify functionality when "Assigned to selected site" checkbox is not selected';
    logger.testStart(testName);

    const { siteDropdownId, siteName, firstNamesCount } = testData.testData.filterBySiteAssignment;

    try {
      await helpers.navigateToUsersList();

      logger.step(`Step 5: Capture first ${firstNamesCount} first names before applying site filter`);
      const capturedFirstNames = await administrationUserPage.getFirstNamesFromUserGrid(firstNamesCount);
      logger.info(`✓ Captured first names: ${capturedFirstNames.join(', ')}`);

      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 8: Verify the previously captured first names are still visible (no assignment filter applied)');
      await administrationUserPage.verifyFirstNamesPresent(capturedFirstNames);
      logger.info('✓ All captured first names are still visible — site selection alone does not filter by assignment');

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-02 - Verify users who have permission to the selected site are filtered when "Assigned to selected site" checkbox is selected', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-02 - Verify users who have permission to the selected site are filtered when "Assigned to selected site" checkbox is selected';
    logger.testStart(testName);

    const { siteDropdownId, siteName, firstNamesCount, assignedUsers } = testData.testData.filterBySiteAssignment;

    try {
      await helpers.navigateToUsersList();

      // Ensure both assigned users have site access before the test
      logger.step(`Setup: Grant site access to "${siteName}" for "${assignedUsers[0]}"`);
      await grantSiteAccess(assignedUsers[0], siteName);

      logger.step(`Setup: Navigate back for "${assignedUsers[1]}"`);
      await navigateBackToUsersList();

      logger.step(`Setup: Grant site access to "${siteName}" for "${assignedUsers[1]}"`);
      await grantSiteAccess(assignedUsers[1], siteName);

      logger.step('Setup: Navigate back to Users List');
      await navigateBackToUsersList();
      await administrationUserPage.expandUserListSection();

      logger.step(`Step 5: Capture first ${firstNamesCount} first names before applying site filter`);
      const capturedFirstNames = await administrationUserPage.getFirstNamesFromUserGrid(firstNamesCount);
      logger.info(`✓ Captured first names: ${capturedFirstNames.join(', ')}`);

      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 8: Verify the previously captured first names are still visible before applying checkbox');
      await administrationUserPage.verifyFirstNamesPresent(capturedFirstNames);
      logger.info('✓ All captured first names are still visible before "Assigned to selected site" is checked');

      logger.step('Step 9: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 11: Verify only assigned users are shown: ${assignedUsers.join(', ')}`);
      await administrationUserPage.verifyOnlyFirstNamesVisible(assignedUsers);
      logger.info(`✓ Grid shows only: ${assignedUsers.join(', ')}`);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      // Cleanup: Remove site access for both users
      await cleanupSiteAccess(assignedUsers[0], siteName);
      await cleanupSiteAccess(assignedUsers[1], siteName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-03 - Verify the users who have permission to the group containing the selected site are filtered when the "Assigned to selected site" checkbox is selected', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-03 - Verify the users who have permission to the group containing the selected site are filtered when the "Assigned to selected site" checkbox is selected';
    logger.testStart(testName);

    const { userName, siteDropdownId, siteName, groupName, groupSiteName } =
      testData.testData.filterBySiteAssignment03;

    try {
      await helpers.navigateToUsersList();

      // ── PART 1: Verify direct site-level access filtering ──

      logger.step(`Step 5: Grant site-level access to "${siteName}" for "${userName}"`);
      await grantSiteAccess(userName, siteName);

      logger.step('Step 6: Navigate back to Users → List');
      await navigateBackToUsersList();

      logger.step(`Step 7: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 8: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 9: Verify "${userName}" is shown under First name column`);
      await administrationUserPage.verifyFirstNamesPresent([userName]);
      logger.info(`✓ "${userName}" is visible via direct site access to "${siteName}"`);

      logger.step(`Step 10: Remove granted site access for "${userName}"`);
      await removeSiteAccessInEdit(siteName);

      // ── PART 2: Verify group-level access filtering ──

      logger.step('Step 11: Navigate to Users → List for Part 2');
      await navigateBackToUsersList({shouldResetFilter: true, filterName: userName});

      logger.step(`Step 12: Grant group-level access to "${groupName}" for "${userName}"`);
      await grantGroupAccessInEdit(groupName);

      logger.step('Step 13: Navigate back to Users → List');
      await navigateBackToUsersList({shouldResetFilter: true, filterName: userName});

      logger.step(`Step 14: Select site "${groupSiteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, groupSiteName);

      logger.step('Step 15: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 16: Verify "${userName}" is shown under First name column`);
      await administrationUserPage.verifyFirstNamesPresent([userName]);
      logger.info(`✓ "${userName}" is visible via group "${groupName}" containing "${groupSiteName}"`);

      logger.step(`Step 17: Remove granted group access for "${userName}"`);
      await removeGroupAccessInEdit(groupName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      // Safety-net cleanup — group first, then site
      await cleanupGroupAccess(userName, groupName);
      await cleanupSiteAccess(userName, siteName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-04 - Verify changing the site when "Assigned to selected site" checkbox is selected', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-04 - Verify changing the site when "Assigned to selected site" checkbox is selected';
    logger.testStart(testName);

    const {
      siteDropdownId, site1, site1AssignedUsers,
      site2, site2AssignedUsers, site2NotVisibleUsers,
    } = testData.testData.filterBySiteAssignment04;

    try {
      await helpers.navigateToUsersList();

      logger.step(`Step 5: Select site "${site1}" from dropdown`);
      await selectSiteFilter(siteDropdownId, site1);

      logger.step('Step 6: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 7: Verify assigned users are shown: ${site1AssignedUsers.join(', ')}`);
      await administrationUserPage.verifyFirstNamesPresent(site1AssignedUsers);
      logger.info(`✓ Users visible for "${site1}": ${site1AssignedUsers.join(', ')}`);

      logger.step(`Step 8: Change site selection to "${site2}"`);
      await selectSiteFilter(siteDropdownId, site2);

      logger.step('Step 9: Wait for grid to stabilize after site change');
      await administrationUserPage.waitForUserGridToLoad();
      await administrationUserPage.waitForUserGridFilterReady();
      logger.info('✓ Grid stabilized after site change');

      logger.step(`Step 10: Verify assigned users for "${site2}": ${site2AssignedUsers.join(', ')}`);
      await administrationUserPage.verifyFirstNamesPresent(site2AssignedUsers);
      logger.info(`✓ Users visible for "${site2}": ${site2AssignedUsers.join(', ')}`);

      logger.step(`Step 11: Verify non-assigned users are not visible: ${site2NotVisibleUsers.join(', ')}`);
      for (const user of site2NotVisibleUsers) {
        await administrationUserPage.verifyFirstNameNotVisible(user);
      }
      logger.info(`✓ Non-assigned users not visible for "${site2}"`);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-05 - Verify the behavior of the "Access Expiration" column for users who have an expiry date when "Assigned to selected site" checkbox is checked', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-05 - Verify the behavior of the "Access Expiration" column for users who have an expiry date when "Assigned to selected site" checkbox is checked';
    logger.testStart(testName);

    const { userName, siteDropdownId, siteName } =
      testData.testData.filterBySiteAssignment05;

    try {
      await helpers.navigateToUsersList();

      logger.step(`Step 5: Grant site access to "${siteName}" for "${userName}"`);
      await grantSiteAccess(userName, siteName);

      logger.step('Step 6: Navigate back to Users → List');
      await navigateBackToUsersList();

      logger.step(`Step 7: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 8: Verify Access Expiration column is NOT visible before checkbox');
      await administrationUserPage.verifyAccessExpirationColumnNotVisibleInUserGrid();

      logger.step('Step 9: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 10: Verify Access Expiration column IS visible between Last Login and Created On');
      await administrationUserPage.verifyAccessExpirationColumnVisibleInUserGrid();

      logger.step(`Step 11: Verify Access Expiration date format is MM/DD/YYYY for "${userName}"`);
      await administrationUserPage.verifyAccessExpirationDateFormatInUserGrid(userName);

      logger.step(`Step 12: Remove granted site access for "${userName}"`);
      await removeSiteAccessInEdit(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await cleanupSiteAccess(userName, siteName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-06 - Verify the behavior of the "Access Expiration" column for users who do not have an expiry date when "Assigned to selected site" checkbox is checked', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-06 - Verify the behavior of the "Access Expiration" column for users who do not have an expiry date when "Assigned to selected site" checkbox is checked';
    logger.testStart(testName);

    const { userName, siteDropdownId, siteName } =
      testData.testData.filterBySiteAssignment06;

    try {
      await helpers.navigateToUsersList();

      logger.step(`Step 5: Grant site access to "${siteName}" for "${userName}"`);
      await grantSiteAccess(userName, siteName);

      logger.step(`Step 6: Clear expiration date for "${siteName}"`);
      await clearExpirationDateInEdit(siteName);

      logger.step('Step 7: Navigate back to Users → List');
      await navigateBackToUsersList();

      logger.step(`Step 8: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 9: Verify Access Expiration column is NOT visible before checkbox');
      await administrationUserPage.verifyAccessExpirationColumnNotVisibleInUserGrid();

      logger.step('Step 10: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 11: Verify Access Expiration column IS visible between Last Login and Created On');
      await administrationUserPage.verifyAccessExpirationColumnVisibleInUserGrid();

      logger.step(`Step 12: Verify Access Expiration cell is empty for "${userName}"`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(userName);

      logger.step(`Step 13: Remove granted site access for "${userName}"`);
      await removeSiteAccessInEdit(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await cleanupSiteAccess(userName, siteName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-07 - Verify sorting the grid by the "Access Expiration" column', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-07 - Verify sorting the grid by the "Access Expiration" column';
    logger.testStart(testName);

    const { siteDropdownId, siteName } =
      testData.testData.filterBySiteAssignment07;

    try {
      await helpers.navigateToUsersList();

      logger.step(`Step 5: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 6: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 7: Verify Access Expiration column is visible');
      await administrationUserPage.verifyAccessExpirationColumnVisibleInUserGrid();

      logger.step('Step 8: Sort Access Expiration column ascending');
      await administrationUserPage.sortAccessExpirationAscending();

      logger.step('Step 9: Verify values are sorted ascending');
      await administrationUserPage.verifyAccessExpirationSortedAscending();

      logger.step('Step 10: Sort Access Expiration column descending');
      await administrationUserPage.sortAccessExpirationDescending();

      logger.step('Step 11: Verify values are sorted descending');
      await administrationUserPage.verifyAccessExpirationSortedDescending();

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-08 - Verify filtering the grid by the "Access Expiration" column', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-08 - Verify filtering the grid by the "Access Expiration" column';
    logger.testStart(testName);

    const { siteDropdownId, siteName } =
      testData.testData.filterBySiteAssignment08;

    try {
      await helpers.navigateToUsersList();

      logger.step(`Step 5: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 6: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 7: Verify Access Expiration column is visible');
      await administrationUserPage.verifyAccessExpirationColumnVisibleInUserGrid();

      logger.step('Step 8: Read an existing Access Expiration date value for filtering');
      const allValues = await administrationUserPage.getAllAccessExpirationValues();
      const dateValues = allValues.filter((v) => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v.trim()));
      if (dateValues.length === 0) {
        throw new Error('No Access Expiration date values found in grid to filter by');
      }
      const filterValue = dateValues[0].trim();
      logger.info(`Using filter value: "${filterValue}"`);

      logger.step(`Step 9: Filter Access Expiration by "${filterValue}"`);
      await administrationUserPage.filterAccessExpirationByValue(filterValue);

      logger.step('Step 10: Verify all visible rows match the filtered date');
      const matchCount = await administrationUserPage.verifyAllAccessExpirationValuesMatch(filterValue);
      logger.info(`✓ ${matchCount} rows match filter "${filterValue}"`);

      logger.step('Step 11: Clear Access Expiration column filter');
      await administrationUserPage.clearAccessExpirationColumnFilter();

      logger.step('Step 12: Filter Access Expiration by Blanks');
      await administrationUserPage.filterAccessExpirationByBlanks();

      logger.step('Step 13: Verify all visible rows have empty Access Expiration');
      const blankCount = await administrationUserPage.verifyAllAccessExpirationValuesEmpty();
      logger.info(`✓ ${blankCount} rows have empty Access Expiration`);

      logger.step('Step 14: Clear Access Expiration column filter');
      await administrationUserPage.clearAccessExpirationColumnFilter();

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-09 - Verify all "Access Expiration" values in the user grid are updated in real time when updating the access expiry date of a user', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-09 - Verify all "Access Expiration" values in the user grid are updated in real time when updating the access expiry date of a user';
    logger.testStart(testName);

    const { userName, siteDropdownId, siteName } =
      testData.testData.filterBySiteAssignment09;

    try {
      await helpers.navigateToUsersList();

      logger.step(`Step 5: Grant site access to "${siteName}" for "${userName}"`);
      await grantSiteAccess(userName, siteName);

      logger.step('Step 6: Navigate back to Users → List');
      await navigateBackToUsersList();

      logger.step(`Step 7: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 8: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 9: Verify Access Expiration date is shown for "${userName}"`);
      await administrationUserPage.verifyAccessExpirationDateFormatInUserGrid(userName);
      logger.info(`✓ Access Expiration date visible for "${userName}"`);

      logger.step(`Step 10: Clear expiration date for "${siteName}"`);
      await administrationUserPage.clickEditButton();
      await administrationUserPage.openSiteAccessPermissions();
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
      await administrationUserPage.waitForSiteAccessGridToLoad();
      await administrationUserPage.clearAccessExpirationDate(siteName);
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      logger.info(`✓ Expiration date cleared for "${siteName}"`);

      logger.step(`Step 11: Verify Access Expiration cell is now empty for "${userName}"`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(userName);
      logger.info(`✓ Access Expiration cell is empty after clearing expiry date`);

      logger.step(`Step 12: Remove granted site access for "${userName}"`);
      await removeSiteAccessInEdit(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await cleanupSiteAccess(userName, siteName);
    }
  });

  // ── Common setup helpers for tests 10–13 and 20 ──────────────

  /**
   * Helper: Setup users with site and group access for tests 10–13, 20
   * Grants site access to user1 and user2 on siteName, and group access
   * to user3 on groupName. Optionally clears expiration dates.
   * @param {Object} params - Destructured test data object
   * @param {string} params.user1 - First user name
   * @param {string} params.user2 - Second user name
   * @param {string} params.user3 - Third user name
   * @param {string} params.siteName - Site name
   * @param {string} params.groupName - Group name
   * @param {boolean} shouldClearExpiry - If true, clear expiry date after granting
   * @returns {Promise<void>}
   */
  const setupUsersForExpDateTests = async (
    {user1, user2, user3, siteName, groupName},
    shouldClearExpiry,
  ) => {
    logger.step(`Setup: Grant site access to "${siteName}" for "${user1}"`);
    await grantSiteAccess(user1, siteName);

    if (shouldClearExpiry) {
      logger.step(`Setup: Clear expiration date for "${user1}"`);
      await clearExpirationDateInEdit(siteName);
    }

    logger.step(`Setup: Navigate back for "${user2}"`);
    await navigateBackToUsersList();

    logger.step(`Setup: Grant site access to "${siteName}" for "${user2}"`);
    await grantSiteAccess(user2, siteName);

    if (shouldClearExpiry) {
      logger.step(`Setup: Clear expiration date for "${user2}"`);
      await clearExpirationDateInEdit(siteName);
    }

    logger.step(`Setup: Navigate back for "${user3}"`);
    await navigateBackToUsersList();
    await administrationUserPage.filterByFirstName(user3);
    await administrationUserPage.expandUserListSection();

    logger.step(`Setup: Grant group access to "${groupName}" for "${user3}"`);
    await grantGroupAccessInEdit(groupName);

    logger.step('Setup: Navigate back to Users → List');
    await navigateBackToUsersList();

    logger.step('Setup: Collapse User Information section');
    await administrationUserPage.expandUserListSection();
  };

  /**
   * Helper: Inline cleanup — click user row, edit, remove site/group access.
   * Users are already visible in the grid; no re-filtering needed.
   * @param {Object} params - Destructured test data object
   * @param {string} params.user1 - First user name
   * @param {string} params.user2 - Second user name
   * @param {string} params.user3 - Third user name
   * @param {string} params.siteName - Site name
   * @param {string} params.groupName - Group name
   * @returns {Promise<void>}
   */
  const cleanupExpDateTestUsers = async (
    {user1, user2, user3, siteName, groupName},
  ) => {
    const cleanupTasks = [
      {user: user1, type: 'site', name: siteName},
      {user: user2, type: 'site', name: siteName},
      {user: user3, type: 'group', name: groupName},
    ];
    for (const task of cleanupTasks) {
      try {
        logger.step(`Cleanup: Remove ${task.type} access for "${task.user}"`);
        await administrationUserPage.clickUserRowInGrid(task.user);
        await administrationUserPage.verifyUserRowHighlighted(task.user);
        if (task.type === 'site') {
          await removeSiteAccessInEdit(task.name);
        } else {
          await removeGroupAccessInEdit(task.name);
        }
        await administrationUserPage.waitForUserGridToLoad();
      } catch (error) {
        logger.warn(`Cleanup "${task.user}" ${task.type}: ${error.message}`);
      }
    }
  };

  test('ADMIN-FILTR-BY-SITE-ASGN-10 - Access expiry popup: Verify updating the access expiry date of all applicable users', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-10 - Access expiry popup: Verify updating the access expiry date of all applicable users';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment10_13;
    const {
      siteDropdownId, siteName, user1, user2, user3,
      contextMenuItem, popupTitle, applyToAllLabel,
      saveAndExitLabel, successMessage, confirmUpdateAll,
    } = data;

    try {
      await helpers.navigateToUsersList();

      logger.step('Step 5: Setup — grant access and clear expiry dates');
      await setupUsersForExpDateTests(data, true);

      logger.step(`Step 6: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 7: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 8: Click user row for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);

      logger.step(`Step 9: Right-click Access Expiration cell for "${user1}"`);
      await administrationUserPage.rightClickAccessExpirationCell(user1);

      logger.step(`Step 10: Verify context menu shows "${contextMenuItem}"`);
      await administrationUserPage.verifyContextMenuItemVisible(contextMenuItem);

      logger.step(`Step 11: Click "${contextMenuItem}"`);
      await administrationUserPage.clickContextMenuItem(contextMenuItem);

      logger.step(`Step 12: Verify "${popupTitle}" popup is displayed`);
      await administrationUserPage.verifyAccessExpirationPopupVisible(popupTitle);

      logger.step('Step 13: Select a future date from the calendar');
      const selectedDate = await administrationUserPage.selectFutureDateInPopupCalendar();
      logger.info(`Selected date: "${selectedDate}"`);

      logger.step(`Step 14: Click "${applyToAllLabel}"`);
      await administrationUserPage.clickApplyToAllFilteredUsersCheckbox(applyToAllLabel);

      logger.step(`Step 15: Click "${saveAndExitLabel}"`);
      await administrationUserPage.clickSaveAndExitInPopup(saveAndExitLabel);

      logger.step('Step 16: Verify confirmation popup is displayed');
      const expectedMsg = confirmUpdateAll.replace('{date}', selectedDate);
      await administrationUserPage.verifyConfirmationPopupMessage(expectedMsg);

      logger.step('Step 17: Click YES');
      await administrationUserPage.clickYesOnConfirmation();

      logger.step('Step 18: Verify success message');
      await administrationUserPage.verifyAccessExpirationSuccessMessage(successMessage);

      logger.step(`Step 19: Verify Access Expiration updated for "${user1}" and "${user2}"`);
      await administrationUserPage.verifyAccessExpirationValueForUser(user1, selectedDate);
      await administrationUserPage.verifyAccessExpirationValueForUser(user2, selectedDate);

      logger.step(`Step 20: Verify Access Expiration NOT set for "${user3}"`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(user3);

      logger.step('Step 21: Cleanup');
      await cleanupExpDateTestUsers(data);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await dismissAllDialogs();
      await cleanupSiteAccess(user1, siteName);
      await cleanupSiteAccess(user2, siteName);
      await cleanupGroupAccess(user3, groupName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-11 - Access expiry popup: Verify updating the access expiry date of a single user', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-11 - Access expiry popup: Verify updating the access expiry date of a single user';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment10_13;
    const {
      siteDropdownId, siteName, user1, user2, user3,
      contextMenuItem, popupTitle,
      saveAndExitLabel, confirmUpdateSingle,
    } = data;

    try {
      await helpers.navigateToUsersList();

      logger.step('Step 5: Setup — grant access and clear expiry dates');
      await setupUsersForExpDateTests(data, true);

      logger.step(`Step 6: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 7: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 8: Click user row for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);

      logger.step(`Step 9: Right-click Access Expiration cell for "${user1}"`);
      await administrationUserPage.rightClickAccessExpirationCell(user1);

      logger.step(`Step 10: Click "${contextMenuItem}"`);
      await administrationUserPage.clickContextMenuItem(contextMenuItem);

      logger.step(`Step 11: Verify "${popupTitle}" popup is displayed`);
      await administrationUserPage.verifyAccessExpirationPopupVisible(popupTitle);

      logger.step('Step 12: Select a future date from the calendar');
      const selectedDate = await administrationUserPage.selectFutureDateInPopupCalendar();
      logger.info(`Selected date: "${selectedDate}"`);

      logger.step(`Step 13: Click "${saveAndExitLabel}" (without Apply to all)`);
      await administrationUserPage.clickSaveAndExitInPopup(saveAndExitLabel);

      logger.step('Step 14: Verify confirmation popup message');
      const expectedMsg = confirmUpdateSingle.replace('{date}', selectedDate);
      await administrationUserPage.verifyConfirmationPopupMessage(expectedMsg);

      logger.step('Step 15: Click YES');
      await administrationUserPage.clickYesOnConfirmation();

      logger.step(`Step 16: Verify Access Expiration updated only for "${user1}"`);
      await administrationUserPage.verifyAccessExpirationValueForUser(user1, selectedDate);

      logger.step(`Step 17: Verify "${user2}" still has no Access Expiration`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(user2);

      logger.step(`Step 18: Verify "${user3}" still has no Access Expiration`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(user3);

      logger.step('Step 19: Cleanup');
      await cleanupExpDateTestUsers(data);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await dismissAllDialogs();
      await cleanupSiteAccess(user1, siteName);
      await cleanupSiteAccess(user2, siteName);
      await cleanupGroupAccess(user3, groupName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-12 - Access expiry popup: Verify clearing the access expiry date of all applicable users', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-12 - Access expiry popup: Verify clearing the access expiry date of all applicable users';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment10_13;
    const {
      siteDropdownId, siteName, user1, user2, user3,
      contextMenuItem, applyToAllLabel,
      saveAndExitLabel, confirmClearAll,
    } = data;

    try {
      await helpers.navigateToUsersList();

      logger.step('Step 5: Setup — grant access WITHOUT clearing expiry dates');
      await setupUsersForExpDateTests(data, false);

      logger.step(`Step 6: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 7: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 8: Click user row for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);

      logger.step(`Step 9: Right-click Access Expiration cell for "${user1}"`);
      await administrationUserPage.rightClickAccessExpirationCell(user1);

      logger.step(`Step 10: Click "${contextMenuItem}"`);
      await administrationUserPage.clickContextMenuItem(contextMenuItem);

      logger.step('Step 11: Clear the date using the clear icon');
      await administrationUserPage.clearDateInPopup();

      logger.step(`Step 12: Click "${applyToAllLabel}"`);
      await administrationUserPage.clickApplyToAllFilteredUsersCheckbox(applyToAllLabel);

      logger.step(`Step 13: Click "${saveAndExitLabel}"`);
      await administrationUserPage.clickSaveAndExitInPopup(saveAndExitLabel);

      logger.step('Step 14: Verify confirmation popup is displayed');
      await administrationUserPage.verifyConfirmationPopupMessage(confirmClearAll);

      logger.step('Step 15: Click YES');
      await administrationUserPage.clickYesOnConfirmation();

      logger.step(`Step 16: Verify Access Expiration cleared for "${user1}" and "${user2}"`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(user1);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(user2);

      logger.step(`Step 17: Verify group-level user "${user3}" remains unaffected`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(user3);

      logger.step('Step 18: Cleanup');
      await cleanupExpDateTestUsers(data);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await dismissAllDialogs();
      await cleanupSiteAccess(user1, siteName);
      await cleanupSiteAccess(user2, siteName);
      await cleanupGroupAccess(user3, groupName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-13 - Access expiry popup: Verify clearing the access expiry date of a single user', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-13 - Access expiry popup: Verify clearing the access expiry date of a single user';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment10_13;
    const {
      siteDropdownId, siteName, user1, user2, user3,
      contextMenuItem,
      saveAndExitLabel, confirmClearSingle,
    } = data;

    try {
      await helpers.navigateToUsersList();

      logger.step('Step 5: Setup — grant access WITHOUT clearing expiry dates');
      await setupUsersForExpDateTests(data, false);

      logger.step(`Step 6: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 7: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step(`Step 8: Click user row for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);

      logger.step(`Step 9: Right-click Access Expiration cell for "${user1}"`);
      await administrationUserPage.rightClickAccessExpirationCell(user1);

      logger.step(`Step 10: Click "${contextMenuItem}"`);
      await administrationUserPage.clickContextMenuItem(contextMenuItem);

      logger.step('Step 11: Clear the date using the clear icon');
      await administrationUserPage.clearDateInPopup();

      logger.step(`Step 12: Click "${saveAndExitLabel}" (without Apply to all)`);
      await administrationUserPage.clickSaveAndExitInPopup(saveAndExitLabel);

      logger.step('Step 13: Verify confirmation popup message');
      await administrationUserPage.verifyConfirmationPopupMessage(confirmClearSingle);

      logger.step('Step 14: Click YES');
      await administrationUserPage.clickYesOnConfirmation();

      logger.step(`Step 15: Verify Access Expiration cleared only for "${user1}"`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(user1);

      logger.step(`Step 16: Verify "${user2}" still has an Access Expiration date`);
      await administrationUserPage.verifyAccessExpirationDateFormatInUserGrid(user2);

      logger.step(`Step 17: Verify "${user3}" has no Access Expiration date`);
      await administrationUserPage.verifyAccessExpirationCellEmptyForUser(user3);

      logger.step('Step 18: Cleanup');
      await cleanupExpDateTestUsers(data);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await dismissAllDialogs();
      await cleanupSiteAccess(user1, siteName);
      await cleanupSiteAccess(user2, siteName);
      await cleanupGroupAccess(user3, groupName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-14 - Access expiry popup: Verify the default access expiry date of a user who does not have an expiry date', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-14 - Access expiry popup: Verify the default access expiry date of a user who does not have an expiry date';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment14_15;
    const {
      siteDropdownId, siteName, user1,
      contextMenuItem, popupTitle,
    } = data;

    try {
      await helpers.navigateToUsersList();

      // ── Setup: Grant site access and clear expiry date ──
      logger.step(`Step 5: Grant site access to "${siteName}" for "${user1}"`);
      await grantSiteAccess(user1, siteName);

      logger.step(`Step 6: Clear expiration date for "${user1}"`);
      await clearExpirationDateInEdit(siteName);

      logger.step('Step 7: Navigate back to Users → List');
      await navigateBackToUsersList();

      logger.step(`Step 8: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      // ── Test: Verify default popup date is today + 1 year ──
      logger.step('Step 9: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 10: Wait for grid stability');
      await administrationUserPage.waitForUserGridToLoad();

      logger.step(`Step 11: Click user row for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);

      logger.step(`Step 12: Verify "${user1}" row is highlighted`);
      await administrationUserPage.verifyUserRowHighlighted(user1);

      logger.step(`Step 13: Right-click Access Expiration cell for "${user1}"`);
      await administrationUserPage.rightClickAccessExpirationCell(user1);

      logger.step(`Step 14: Verify context menu shows "${contextMenuItem}"`);
      await administrationUserPage.verifyContextMenuItemVisible(contextMenuItem);

      logger.step(`Step 15: Click "${contextMenuItem}"`);
      await administrationUserPage.clickContextMenuItem(contextMenuItem);

      logger.step(`Step 16: Verify "${popupTitle}" popup is displayed`);
      await administrationUserPage.verifyAccessExpirationPopupVisible(popupTitle);

      logger.step('Step 17: Verify datepicker is visible');
      await administrationUserPage.getPopupDatePickerValue();

      logger.step('Step 18: Verify default date is today + 1 year');
      await administrationUserPage.verifyPopupDateIsDefaultOneYearFromToday();

      logger.step('Step 19: Click Cancel');
      await administrationUserPage.clickCancelInPopup();

      // ── Cleanup: Remove site access ──
      logger.step(`Step 20: Cleanup — remove site access for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);
      await administrationUserPage.verifyUserRowHighlighted(user1);
      await removeSiteAccessInEdit(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await dismissAllDialogs();
      await cleanupSiteAccess(user1, siteName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-15 - Access expiry popup: Verify the default access expiry date of a user who already has an expiry date', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-15 - Access expiry popup: Verify the default access expiry date of a user who already has an expiry date';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment14_15;
    const {
      siteDropdownId, siteName, user1,
      contextMenuItem, popupTitle,
    } = data;

    try {
      await helpers.navigateToUsersList();

      // ── Setup: Grant site access — keep expiry date ──
      logger.step(`Step 5: Grant site access to "${siteName}" for "${user1}"`);
      await grantSiteAccess(user1, siteName);

      logger.step('Step 6: Navigate back to Users → List');
      await navigateBackToUsersList();

      logger.step(`Step 7: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      // ── Test: Verify popup shows existing expiry date ──
      logger.step('Step 8: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 9: Wait for grid stability');
      await administrationUserPage.waitForUserGridToLoad();

      logger.step(`Step 10: Click user row for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);

      logger.step(`Step 11: Verify "${user1}" row is highlighted`);
      await administrationUserPage.verifyUserRowHighlighted(user1);

      logger.step(`Step 12: Store existing Access Expiration value for "${user1}"`);
      const existingDate = await administrationUserPage.getAccessExpirationValueForUser(user1);
      logger.info(`Stored existing expiry date: "${existingDate}"`);

      logger.step(`Step 13: Right-click Access Expiration cell for "${user1}"`);
      await administrationUserPage.rightClickAccessExpirationCell(user1);

      logger.step(`Step 14: Verify context menu shows "${contextMenuItem}"`);
      await administrationUserPage.verifyContextMenuItemVisible(contextMenuItem);

      logger.step(`Step 15: Click "${contextMenuItem}"`);
      await administrationUserPage.clickContextMenuItem(contextMenuItem);

      logger.step(`Step 16: Verify "${popupTitle}" popup is displayed`);
      await administrationUserPage.verifyAccessExpirationPopupVisible(popupTitle);

      logger.step('Step 17: Verify popup date matches stored expiry date');
      await administrationUserPage.verifyPopupDateMatchesExpectedDate(existingDate);

      logger.step('Step 18: Click Cancel');
      await administrationUserPage.clickCancelInPopup();

      // ── Cleanup: Remove site access ──
      logger.step(`Step 19: Cleanup — remove site access for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);
      await administrationUserPage.verifyUserRowHighlighted(user1);
      await removeSiteAccessInEdit(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await dismissAllDialogs();
      await cleanupSiteAccess(user1, siteName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-16 - Verify that users are removed from the user grid when sites are removed from a user while "Assigned to selected site" is selected', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-16 - Verify that users are removed from the user grid when sites are removed from a user while "Assigned to selected site" is selected';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment16_17;
    const {siteDropdownId, siteName, user1, user3, groupName} = data;

    try {
      await helpers.navigateToUsersList();

      // ── Setup: Grant site access to user1 ──
      logger.step(`Step 5: Grant site access to "${siteName}" for "${user1}"`);
      await grantSiteAccess(user1, siteName);

      logger.step(`Step 6: Navigate back for "${user3}"`);
      await navigateBackToUsersList();
      await administrationUserPage.filterByFirstName(user3);
      await administrationUserPage.expandUserListSection();

      // ── Setup: Grant group access to user3 ──
      logger.step(`Step 7: Grant group access to "${groupName}" for "${user3}"`);
      await grantGroupAccessInEdit(groupName);

      // ── Navigate and apply filters ──
      logger.step('Step 8: Navigate back to Users → List');
      await navigateBackToUsersList();
      await administrationUserPage.expandUserListSection();

      logger.step(`Step 9: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 10: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 11: Wait for grid stability');
      await administrationUserPage.waitForUserGridToLoad();

      // ── Test: Verify both users visible ──
      logger.step(`Step 12: Verify grid shows "${user1}" and "${user3}"`);
      await administrationUserPage.verifyFirstNamesPresent([user1, user3]);
      logger.info(`✓ Both "${user1}" and "${user3}" visible`);

      // ── Remove site access for user1 ──
      logger.step(`Step 13: Click user row for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);

      logger.step(`Step 14: Verify "${user1}" row is highlighted`);
      await administrationUserPage.verifyUserRowHighlighted(user1);

      logger.step(`Step 15: Remove site access for "${user1}"`);
      await removeSiteAccessInEdit(siteName);

      logger.step('Step 16: Wait for grid stability');
      await administrationUserPage.waitForUserGridToLoad();

      // ── Verify user1 removed from grid ──
      logger.step(`Step 17: Verify only "${user3}" remains in grid`);
      await administrationUserPage.verifyFirstNamesPresent([user3]);

      logger.step(`Step 18: Verify "${user1}" is no longer visible`);
      await administrationUserPage.verifyFirstNameNotVisible(user1);
      logger.info(`✓ "${user1}" removed from filtered grid`);

      // ── Cleanup: Remove group access for user3 ──
      logger.step(`Step 19: Cleanup — remove group access for "${user3}"`);
      await administrationUserPage.clickUserRowInGrid(user3);
      await administrationUserPage.verifyUserRowHighlighted(user3);
      await removeGroupAccessInEdit(groupName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await cleanupSiteAccess(user1, siteName);
      await cleanupGroupAccess(user3, groupName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-17 - Verify that users are removed from the user grid when groups are removed from a user while "Assigned to selected site" is selected', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-17 - Verify that users are removed from the user grid when groups are removed from a user while "Assigned to selected site" is selected';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment16_17;
    const {siteDropdownId, siteName, user1, user3, groupName} = data;

    try {
      await helpers.navigateToUsersList();

      // ── Setup: Grant site access to user1 ──
      logger.step(`Step 5: Grant site access to "${siteName}" for "${user1}"`);
      await grantSiteAccess(user1, siteName);

      logger.step(`Step 6: Navigate back for "${user3}"`);
      await navigateBackToUsersList();
      await administrationUserPage.filterByFirstName(user3);
      await administrationUserPage.expandUserListSection();

      // ── Setup: Grant group access to user3 ──
      logger.step(`Step 7: Grant group access to "${groupName}" for "${user3}"`);
      await grantGroupAccessInEdit(groupName);

      // ── Navigate and apply filters ──
      logger.step('Step 8: Navigate back to Users → List');
      await navigateBackToUsersList();
      await administrationUserPage.expandUserListSection();

      logger.step(`Step 9: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 10: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 11: Wait for grid stability');
      await administrationUserPage.waitForUserGridToLoad();

      // ── Test: Verify both users visible ──
      logger.step(`Step 12: Verify grid shows "${user1}" and "${user3}"`);
      await administrationUserPage.verifyFirstNamesPresent([user1, user3]);
      logger.info(`✓ Both "${user1}" and "${user3}" visible`);

      // ── Remove group access for user3 ──
      logger.step(`Step 13: Click user row for "${user3}"`);
      await administrationUserPage.clickUserRowInGrid(user3);

      logger.step(`Step 14: Verify "${user3}" row is highlighted`);
      await administrationUserPage.verifyUserRowHighlighted(user3);

      logger.step(`Step 15: Remove group access for "${user3}"`);
      await removeGroupAccessInEdit(groupName);

      logger.step('Step 16: Wait for grid stability');
      await administrationUserPage.waitForUserGridToLoad();

      // ── Verify user3 removed from grid ──
      logger.step(`Step 17: Verify only "${user1}" remains in grid`);
      await administrationUserPage.verifyFirstNamesPresent([user1]);

      logger.step(`Step 18: Verify "${user3}" is no longer visible`);
      await administrationUserPage.verifyFirstNameNotVisible(user3);
      logger.info(`✓ "${user3}" removed from filtered grid`);

      // ── Cleanup: Remove site access for user1 ──
      logger.step(`Step 19: Cleanup — remove site access for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);
      await administrationUserPage.verifyUserRowHighlighted(user1);
      await removeSiteAccessInEdit(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await cleanupSiteAccess(user1, siteName);
      await cleanupGroupAccess(user3, groupName);
    }
  });

  test('ADMIN-FILTR-BY-SITE-ASGN-20 - Verify the behavior of the context menu item "Edit Exp. Dates" in the user grid for users who get access to the selected site through group-level access', async () => {
    const testName = 'ADMIN-FILTR-BY-SITE-ASGN-20 - Verify the behavior of the context menu item "Edit Exp. Dates" in the user grid for users who get access to the selected site through group-level access';
    logger.testStart(testName);

    const data = testData.testData.filterBySiteAssignment20;
    const {
      siteDropdownId, siteName, user1, user3,
      groupName, contextMenuItem,
    } = data;

    try {
      await helpers.navigateToUsersList();

      // ── Setup: Grant site access to user1 ──
      logger.step(`Step 5: Grant site access to "${siteName}" for "${user1}"`);
      await grantSiteAccess(user1, siteName);

      logger.step(`Step 6: Clear expiration date for "${user1}"`);
      await clearExpirationDateInEdit(siteName);

      // ── Setup: Grant group access to user3 ──
      logger.step(`Step 7: Navigate back for "${user3}"`);
      await navigateBackToUsersList();
      await administrationUserPage.filterByFirstName(user3);
      await administrationUserPage.expandUserListSection();

      logger.step(`Step 8: Grant group access to "${groupName}" for "${user3}"`);
      await grantGroupAccessInEdit(groupName);

      // ── Navigate and apply filters ──
      logger.step('Step 9: Navigate back to Users → List');
      await navigateBackToUsersList();
      await administrationUserPage.expandUserListSection();

      logger.step(`Step 10: Select site "${siteName}" from dropdown`);
      await selectSiteFilter(siteDropdownId, siteName);

      logger.step('Step 11: Wait for grid stability');
      await administrationUserPage.waitForUserGridToLoad();

      logger.step('Step 12: Click "Assigned to selected site" checkbox');
      await applyAssignedToSiteCheckbox();

      logger.step('Step 13: Wait for grid stability');
      await administrationUserPage.waitForUserGridToLoad();

      // ── Verify context menu behaviour for group-level user ──
      logger.step(`Step 14: Click user row for "${user3}"`);
      await administrationUserPage.clickUserRowInGrid(user3);

      logger.step(`Step 15: Verify "${user3}" row is highlighted`);
      await administrationUserPage.verifyUserRowHighlighted(user3);

      logger.step(`Step 16: Right-click Access Expiration cell for "${user3}"`);
      await administrationUserPage.rightClickAccessExpirationCell(user3);

      logger.step(`Step 17: Verify context menu shows "${contextMenuItem}"`);
      await administrationUserPage.verifyContextMenuItemVisible(contextMenuItem);

      logger.step(`Step 18: Verify "${contextMenuItem}" is disabled for group-level user`);
      await administrationUserPage.verifyContextMenuItemDisabled(contextMenuItem);

      // Close context menu
      await administrationUserPage.pressEscape();

      // ── Cleanup: Remove access directly from grid rows ──
      logger.step(`Step 19: Cleanup — remove site access for "${user1}"`);
      await administrationUserPage.clickUserRowInGrid(user1);
      await administrationUserPage.verifyUserRowHighlighted(user1);
      await removeSiteAccessInEdit(siteName);
      await administrationUserPage.waitForUserGridToLoad();

      logger.step(`Step 20: Cleanup — remove group access for "${user3}"`);
      await administrationUserPage.clickUserRowInGrid(user3);
      await administrationUserPage.verifyUserRowHighlighted(user3);
      await removeGroupAccessInEdit(groupName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await dismissAllDialogs();
      await cleanupSiteAccess(user1, siteName);
      await cleanupGroupAccess(user3, groupName);
    }
  });
});
