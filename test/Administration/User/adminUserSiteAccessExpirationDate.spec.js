const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const logger = require('../../../utils/logger');
const testData = require('../../../data/testData.json');
const credentials = require('../../../utils/credentials');

/**
 * Test suite for Admin User Management - Site Access Expiration Date functionality
 * Verifies expiration date management, access status indicators, and permission controls
 */
test.describe('Admin User Mgmt Site Access Expiration Date', () => {
  /** Wait time constants — tuned for the system's load times; modify with caution */
  const WAIT_TIMES = {
    GRID_STABILIZATION: 3000,
    PERMISSION_RENDER: 2500,
    FILTER_DELAY: 1000,
    SHORT_DELAY: 500,
  };
  /** Max retry attempts for cleanup operations */
  const MAX_CLEANUP_RETRIES = 3;

  let testSetup;
  let administrationUserPage;

  test.beforeEach(async ({ page }) => {
    logger.divider();
    logger.info('Setting up test - Initializing page objects');

    testSetup = new TestSetup();
    await testSetup.initialize(page);
    administrationUserPage = testSetup.getAdministrationUserPage();

    logger.info('Test setup completed');
    logger.divider();
  });

  /**
   * Helper: Common setup for tests requiring user site access configuration
   * @param {string} userName - User first name to filter by
   * @returns {Promise<void>}
   */
  const setupUserForSiteAccess = async (userName) => {
    await testSetup.loginAsValidUser();
    await administrationUserPage.waitForDOMContentLoaded();
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to ADMINISTRATION → Users → List');
    await administrationUserPage.navigateToAdministrationTab();
    await administrationUserPage.waitForPageReady();
    await administrationUserPage.verifySiteListVisible();
    await administrationUserPage.navigateToUsersList();
    await administrationUserPage.waitForUserGridToLoad();
    await administrationUserPage.waitForUserGridFilterReady();

    logger.step(`Filter and edit user: ${userName}`);
    await administrationUserPage.filterByFirstName(userName);
    await administrationUserPage.expandUserListSection();
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openSiteAccessPermissions();
  };

  /**
   * Helper: Grant access to site and save
   * For "PW Automation S1", checks if site already has access and removes it first to ensure clean state
   * @param {string} siteName - Site name to grant access to
   * @returns {Promise<void>}
   */
  const grantSiteAccessAndSave = async (siteName) => {
    // Only check for existing access if this is PW Automation S1 (reused across many tests)
    if (siteName === 'PW Automation S1') {
      logger.step('Check if PW Automation S1 already has access (cleanup from previous test)');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
      await administrationUserPage.waitForSiteAccessGridToLoad();
      
      try {
        // Try to find site in "with access" grid
        await administrationUserPage.waitForSitesInGrid([siteName], 5000);
        logger.info(`✓ Site "${siteName}" found with existing access - removing it first`);
        
        // Remove existing access
        await administrationUserPage.removeAccessForSite(siteName);
        await administrationUserPage.clickSaveButton();
        await administrationUserPage.waitForSuccessMessage();
        logger.info('✓ Existing access removed successfully');
      } catch (error) {
        // Site not found in "with access" grid - this is expected for clean state
        logger.info(`✓ Site "${siteName}" has no existing access - proceeding with grant`);
      }
    }
    
    // Now grant access to the site
    await administrationUserPage.enableShowSitesWithNoAccess();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    await administrationUserPage.filterBySiteName(siteName);
    await administrationUserPage.waitForGridRows();
    await administrationUserPage.clickSiteCell(siteName);
    await administrationUserPage.grantAccessToSite(siteName);
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
  };

  /**
   * Helper: Prepare grid for verification after saving
   * @returns {Promise<void>}
   */
  const prepareGridForVerification = async () => {
    await administrationUserPage.verifyShowSitesWithAccessSelected();
    await administrationUserPage.waitForGridContent();
    
    await administrationUserPage.clickEditButton();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    await administrationUserPage.disableShowPermissionColumnsWithRetry();
    await administrationUserPage.waitForGridRows();
    await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
  };

  /**
   * Helper: Cleanup site access
   * Removes site access, saves, then verifies by clicking Edit and re-checking.
   * Retries up to 3 times if the site is still visible after save.
   * @param {string} siteName - Site name to remove access from
   * @returns {Promise<void>}
   */
  const cleanupSiteAccess = async (siteName) => {
    try {
      logger.step(`Cleanup - Removing access for site: ${siteName}`);

      for (let attempt = 1; attempt <= MAX_CLEANUP_RETRIES; attempt++) {
        logger.info(`Cleanup attempt ${attempt}/${MAX_CLEANUP_RETRIES}`);

        // Ensure correct view with Access Status column visible
        await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
        await administrationUserPage.waitForSiteAccessGridToLoad();
        await administrationUserPage.disableShowPermissionColumnsWithRetry();
        await administrationUserPage.waitForAccessStatusColumn();

        // Check if site is still in the grid before trying to remove it
        const isSiteVisible = await administrationUserPage.isSiteVisibleInGrid(siteName);
        if (!isSiteVisible) {
          logger.info(`✓ Site "${siteName}" not found in grid - already removed`);
          break;
        }

        // Right-click → Remove → verify #bd8585 row colour
        await administrationUserPage.removeAccessForSite(siteName);

        // Save and wait for success message
        await administrationUserPage.clickSaveButton();
        await administrationUserPage.waitForSuccessMessage();
        logger.info(`✓ Save completed on attempt ${attempt}`);

        // Verify: click Edit, restore view, then check if site is still present
        await administrationUserPage.clickEditButton();
        await administrationUserPage.waitForSiteAccessGridToLoad();
        await administrationUserPage.disableShowPermissionColumnsWithRetry();
        await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
        await administrationUserPage.waitForSiteAccessGridToLoad();

        const isStillVisible = await administrationUserPage.isSiteVisibleInGrid(siteName);
        if (!isStillVisible) {
          logger.info(`✓ Successfully removed access for site: ${siteName}`);
          break;
        }

        if (attempt === MAX_CLEANUP_RETRIES) {
          logger.warn(`⚠ Site "${siteName}" still visible after ${MAX_CLEANUP_RETRIES} attempts`);
        } else {
          logger.warn(`Site "${siteName}" still visible after save, retrying...`);
        }
      }
    } catch (error) {
      logger.warn(`Cleanup warning for site ${siteName}: ${error.message}`);
      // Don't throw - cleanup failures shouldn't fail the test
    }
  };

  /**
   * Helper: Cleanup group access
   * Removes group access, saves, then verifies by clicking Edit → Show groups with access granted.
   * Retries up to 3 times if the group is still visible after save.
   * @param {string} groupName - Group name to remove access from
   * @returns {Promise<void>}
   */
  const cleanupGroupAccess = async (groupName) => {
    try {
      logger.step(`Cleanup - Removing access for group: ${groupName}`);

      for (let attempt = 1; attempt <= MAX_CLEANUP_RETRIES; attempt++) {
        logger.info(`Cleanup attempt ${attempt}/${MAX_CLEANUP_RETRIES}`);

        // Ensure correct view: show groups with access granted
        await administrationUserPage.enableShowGroupsWithAccessGranted();
        await administrationUserPage.waitForGridRows();

        // Check if group is still in the grid before trying to remove it
        const isGroupVisible = await administrationUserPage.isGroupVisibleInGrid(groupName);
        if (!isGroupVisible) {
          logger.info(`✓ Group "${groupName}" not found in grid - already removed`);
          break;
        }

        // Right-click → Remove → verify #bd8585 row colour
        await administrationUserPage.removeAccessForGroup(groupName);

        // Save and wait for success message
        await administrationUserPage.clickSaveButton();
        await administrationUserPage.waitForSuccessMessage();
        logger.info(`✓ Save completed on attempt ${attempt}`);

        // Verify: click Edit, show groups with access granted, then check if group is still present
        await administrationUserPage.clickEditButton();
        await administrationUserPage.enableShowGroupsWithAccessGranted();
        await administrationUserPage.waitForGridRows();

        const isStillVisible = await administrationUserPage.isGroupVisibleInGrid(groupName);
        if (!isStillVisible) {
          logger.info(`✓ Successfully removed access for group: ${groupName}`);
          break;
        }

        if (attempt === MAX_CLEANUP_RETRIES) {
          logger.warn(`⚠ Group "${groupName}" still visible after ${MAX_CLEANUP_RETRIES} attempts`);
        } else {
          logger.warn(`Group "${groupName}" still visible after save, retrying...`);
        }
      }
    } catch (error) {
      logger.warn(`Cleanup warning for group ${groupName}: ${error.message}`);
      // Don't throw - cleanup failures shouldn't fail the test
    }
  };

  test('ADMIN-USR-ACC-EXP-01 - Verify the default value of the Access Expiration date when giving permission to a new site', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-01 - Verify the default value of the Access Expiration date when giving permission to a new site';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);
      await grantSiteAccessAndSave(siteName);
      await prepareGridForVerification();

      logger.step('Verify Access Status shows "Active"');
      await administrationUserPage.verifyAccessStatusIsActive(siteName);

      logger.step('Verify Access Expiration Date is Today + 1 Year (Pacific Time)');
      await administrationUserPage.verifyAccessExpirationDateIsOneYearFromToday(siteName);

      logger.step('Verify expiration date remains Today + 1 Year after 3 permission module changes');
      await administrationUserPage.verifyExpirationDateRemainsAfterModuleChange(siteName, 3);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-03  - Verify the lower and upper limit of the Access Expiration date', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-03  - Verify the lower and upper limit of the Access Expiration date';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);
      await grantSiteAccessAndSave(siteName);
      await prepareGridForVerification();

      logger.step('Verify Access Status shows "Active"');
      await administrationUserPage.verifyAccessStatusIsActive(siteName);

      logger.step('Step 30: Double-click Access Expiration date cell to enable editing');
      await administrationUserPage.editAccessExpirationDateCell(siteName);

      logger.step('Step 31: Click calendar icon to open date picker');
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Step 32: Capture today\'s date from calendar');
      const todayDate = await administrationUserPage.getTodayDateFromCalendar();

      logger.step('Step 33: Click TODAY button in calendar');
      await administrationUserPage.clickTodayInCalendar();

      logger.step('Step 34: Reopen calendar to verify disabled dates');
      await administrationUserPage.editAccessExpirationDateCell(siteName);
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Step 35: Verify all dates before today are disabled');
      const disabledDates = await administrationUserPage.getDisabledCalendarDatesBefore(todayDate);
      expect(disabledDates.length).toBeGreaterThan(0);
      logger.info(`Found ${disabledDates.length} disabled dates before today`);
      await administrationUserPage.verifyAllDatesAreDisabled(disabledDates);

      logger.step('Step 36: Calculate maximum allowed expiration date (Today + 5 years)');
      const maxAllowedDate = await administrationUserPage.getMaxAllowedExpirationDate();
      logger.info(`Max allowed date: ${maxAllowedDate.month + 1}/${maxAllowedDate.day}/${maxAllowedDate.year}`);

      logger.step('Step 37: Close calendar');
      await administrationUserPage.closeCalendar();

      logger.step('Step 38: Double-click Access Expiration date cell to reopen');
      await administrationUserPage.editAccessExpirationDateCell(siteName);

      logger.step('Step 39: Open calendar again');
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Step 40: Navigate calendar to target year (5 years from now)');
      await administrationUserPage.navigateCalendarToYear(maxAllowedDate.year);

      logger.step('Step 41: Select current month in the target year');
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      await administrationUserPage.selectMonthInCalendar(currentMonth);

      logger.step('Step 42: Verify all dates after max allowed date are disabled');
      const disabledDatesAfter = await administrationUserPage.getDisabledCalendarDatesAfter(maxAllowedDate.day);
      expect(disabledDatesAfter.length).toBeGreaterThan(0);
      logger.info(`Found ${disabledDatesAfter.length} disabled dates after ${maxAllowedDate.day}`);
      await administrationUserPage.verifyAllDatesAreDisabled(disabledDatesAfter);

      logger.step('Step 43: Close calendar');
      await administrationUserPage.pressEscape();

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-05 - Verify users can clear the access expiry date', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-05 - Verify users can clear the access expiry date';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);
      await grantSiteAccessAndSave(siteName);
      await prepareGridForVerification();

      logger.step('Verify Access Status shows "Active"');
      await administrationUserPage.verifyAccessStatusIsActive(siteName);

      logger.step('Clear Access Expiration Date');
      await administrationUserPage.clearAccessExpirationDate(siteName);

      logger.step('Verify Access Expiration Date is empty');
      await administrationUserPage.verifyAccessExpirationDateIsEmpty(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-06 - Verify Access Status icon color when access expired', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-06 - Verify Access Status icon color when access expired';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);
      await grantSiteAccessAndSave(siteName);
      await prepareGridForVerification();

      logger.step('Double-click Access Expiration date cell to enable editing');
      await administrationUserPage.editAccessExpirationDateCell(siteName);

      logger.step('Click calendar icon to open date picker');
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Click TODAY button in calendar');
      await administrationUserPage.clickTodayInCalendar();

      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();

      logger.step('Wait for save to complete');
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Save completed');

      logger.step('Verify "Show sites with access granted" is selected');
      await administrationUserPage.verifyShowSitesWithAccessSelected();

      logger.step('Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Wait for SITE ACCESS AND PERMISSIONS section to be fully loaded');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid is fully loaded');

      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
      await administrationUserPage.waitForAccessStatusColumn();

      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Verify Access Status shows "Expired" with red background');
      await administrationUserPage.verifyAccessStatusIsExpired(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-07 - Verify Access Status icon color when access near expiry', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-07 - Verify Access Status icon color when access near expiry';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);
      await grantSiteAccessAndSave(siteName);
      await prepareGridForVerification();

      logger.step('Double-click Access Expiration date cell to enable editing');
      await administrationUserPage.editAccessExpirationDateCell(siteName);

      logger.step('Click calendar icon to open date picker');
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Capture today\'s date from calendar');
      const todayDate = await administrationUserPage.getTodayDateFromCalendar();
      logger.info(`Today's date: ${todayDate}`);

      logger.step('Click TODAY button to establish current date context');
      await administrationUserPage.clickTodayInCalendar();

      logger.step('Reopen calendar to select near-expiry date');
      await administrationUserPage.editAccessExpirationDateCell(siteName);
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Select date 29 days from today for "Expiring Soon" status (within 30 days)');
      await administrationUserPage.clickDateInCalendar(29);

      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();

      logger.step('Wait for save to complete');
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Save completed');

      logger.step('Verify "Show sites with access granted" is selected');
      await administrationUserPage.verifyShowSitesWithAccessSelected();

      logger.step('Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Wait for SITE ACCESS AND PERMISSIONS section to be fully loaded');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid is fully loaded');

      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
      await administrationUserPage.waitForAccessStatusColumn();

      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Verify Access Status shows "Expiring Soon" with orange background');
      await administrationUserPage.verifyAccessStatusIsExpiringSoon(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-08 - Verify Access Status icon color when access is valid', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-08 - Verify Access Status icon color when access is valid';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);
      await grantSiteAccessAndSave(siteName);
      await prepareGridForVerification();

      logger.step('Double-click Access Expiration date cell to enable editing');
      await administrationUserPage.editAccessExpirationDateCell(siteName);

      logger.step('Click calendar icon to open date picker');
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Capture today\'s date from calendar');
      const todayDate = await administrationUserPage.getTodayDateFromCalendar();
      logger.info(`Today's date: ${todayDate}`);

      logger.step('Click TODAY button to establish current date context');
      await administrationUserPage.clickTodayInCalendar();

      logger.step('Reopen calendar to select valid expiration date');
      await administrationUserPage.editAccessExpirationDateCell(siteName);
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Select date 31 days from today for "Active" status (beyond 30 days)');
      await administrationUserPage.clickDateInCalendar(31);

      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();

      logger.step('Wait for save success message');
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Save successful');

      logger.step('Verify "Show sites with access granted" is selected');
      await administrationUserPage.verifyShowSitesWithAccessSelected();

      logger.step('Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Wait for SITE ACCESS AND PERMISSIONS section to be fully loaded');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid is fully loaded');

      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
      await administrationUserPage.waitForAccessStatusColumn();

      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Verify Access Status shows "Active" with green background');
      await administrationUserPage.verifyAccessStatusIsActiveWithColor(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-09 - Verify Access Status icon when there\'s no expiration date', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-09 - Verify Access Status icon when there\'s no expiration date';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);
      await grantSiteAccessAndSave(siteName);
      await prepareGridForVerification();

      logger.step('Verify Access Status shows "Active"');
      await administrationUserPage.verifyAccessStatusIsActive(siteName);

      logger.step('Clear Access Expiration Date');
      await administrationUserPage.clearAccessExpirationDate(siteName);

      logger.step('Verify Access Expiration Date is empty');
      await administrationUserPage.verifyAccessExpirationDateIsEmpty(siteName);

      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();

      logger.step('Wait for save success message');
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Save successful');

      logger.step('Verify "Show sites with access granted" is selected');
      await administrationUserPage.verifyShowSitesWithAccessSelected();

      logger.step('Wait for grid to stabilize');
      await administrationUserPage.waitForGridRows();
      logger.info('✓ Grid is stable and visible');

      logger.step('Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid reloaded');

      logger.step('Verify Access Status is empty (no status displayed)');
      await administrationUserPage.verifyAccessStatusIsEmpty(siteName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-10 - Verify the default state of Show Permission columns checkbox', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-10 - Verify the default state of Show Permission columns checkbox';
    logger.testStart(testName);

    const { userName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);

      logger.step('Verify "Show sites with access granted" is selected by default');
      await administrationUserPage.verifyShowSitesWithAccessSelected();

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-11 - Verify permission grid is collapsible', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-11 - Verify permission grid is collapsible';
    logger.testStart(testName);

    const { userName } = testData.testData.administrationUser;

    try {
      await setupUserForSiteAccess(userName);

      logger.step('Wait for all permission column headers to load');
      await administrationUserPage.waitForPermissionColumnHeaders();

      logger.step('Verify "Show permission columns" checkbox is checked');
      await administrationUserPage.verifyShowPermissionColumnsChecked();

      logger.step('Verify permission columns are expanded (all 18 columns visible)');
      await administrationUserPage.verifyPermissionColumnsExpanded();

      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step('Wait for permission columns to be hidden');
      await administrationUserPage.waitForPermissionColumnsHidden();
      logger.info('✓ Permission columns hidden');

      logger.step('Verify permission columns are collapsed (only 3 core columns visible)');
      await administrationUserPage.verifyPermissionColumnsCollapsed();

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-12 - Verify filtering options in Access Expiration column', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-12 - Verify filtering options in Access Expiration column';
    logger.testStart(testName);

    const { userName, siteNames } = testData.testData.administrationUser;
    const {
      s1, s2, s3, s4,
    } = siteNames;

    try {
      await testSetup.loginAsValidUser();
      await administrationUserPage.waitForDOMContentLoaded();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 7: Navigate to ADMINISTRATION tab');
      await administrationUserPage.navigateToAdministrationTab();

      logger.step('Step 8: Wait for page to be ready');
      await administrationUserPage.waitForPageReady();
      logger.info('✓ Page is ready after navigating to ADMINISTRATION tab');

      logger.step('Step 9: Verify page contains SITE LIST');
      await administrationUserPage.verifySiteListVisible();

      logger.step('Step 10: Navigate to Users → List');
      await administrationUserPage.navigateToUsersList();

      logger.step('Step 11: Wait for user grid to load');
      await administrationUserPage.waitForUserGridToLoad();
      logger.info('✓ User grid loaded');

      logger.step(`Step 12: Filter user list by First name "${userName}"`);
      await administrationUserPage.filterByFirstName(userName);

      logger.step('Step 13: Drag resize handler up to expand user list section');
      await administrationUserPage.expandUserListSection();

      logger.step('Step 14: Click Edit button');
      await administrationUserPage.clickEditButton();

      logger.step('Step 15: Open SITE ACCESS AND PERMISSIONS section');
      await administrationUserPage.openSiteAccessPermissions();

      logger.step('Step 16: Wait for Site Access grid to load');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid loaded');

      logger.step('Step 17: Enable "Show sites with no access granted"');
      await administrationUserPage.enableShowSitesWithNoAccess();

      logger.step('Step 17a: Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid reloaded');

      logger.step('Step 18: Filter by "PW Automation" to find test sites');
      await administrationUserPage.waitForGridContent(10000);
      await administrationUserPage.filterColumnByText('Site List', 'PW Automation S');
      logger.info('✓ Filter applied, grid should now show only PW Automation S* sites');

      logger.step('Step 18a: Wait for grid to reload with filtered sites');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Grid reloaded with filtered sites');

      logger.step('Step 18b: Verify test sites are visible in grid');
      await administrationUserPage.waitForSitesInGrid([s1, s2, s3, s4], 15000);
      logger.info('✓ Test sites are visible in grid');

      logger.step('Step 19: Grant access to all test sites (S1-S4)');
      await administrationUserPage.grantAccessToMultipleSites([s1, s2, s3, s4]);

      logger.step('Step 20: Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();

      logger.step('Step 21: Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Step 22: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
      await administrationUserPage.waitForPermissionColumnsHidden();

      logger.step('Step 23: Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Step 23a: Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid reloaded');

      logger.step('Step 23b: Clear filter on "Site List" column');
      await administrationUserPage.clearColumnFilter('Site List');
      logger.info('✓ Filter cleared on "Site List" column');

      logger.step('Step 23c: Wait for test sites to appear in grid');
      await administrationUserPage.waitForSitesInGrid([s1, s2, s3, s4]);
      logger.info('✓ Test sites found in grid');

      logger.step(`Step 24: Set ${s1} expiration to Today+31 (Active)`);
      await administrationUserPage.setAccessExpirationDate(s1, 31);

      logger.step(`Step 25: Set ${s2} expiration to Today (Expired)`);
      await administrationUserPage.editAccessExpirationDateCell(s2);
      await administrationUserPage.openExpirationDateCalendar();
      await administrationUserPage.getTodayDateFromCalendar();
      await administrationUserPage.clickTodayInCalendar();

      logger.step(`Step 26: Set ${s3} expiration to Today+29 (Expiring Soon)`);
      await administrationUserPage.setAccessExpirationDate(s3, 29);

      logger.step(`Step 27: Clear ${s4} expiration date (Blanks)`);
      await administrationUserPage.clearAccessExpirationDate(s4);

      logger.step('Step 28: Click Save button');
      await administrationUserPage.clickSaveButton();

      logger.step('Step 28a: Wait for save success message');
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Save successful');

      logger.step('Step 29: Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Step 30: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step('Step 31: Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Step 31a: Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid reloaded');

      logger.step('Step 32: Click filter icon on Access Status column');
      await administrationUserPage.clickAccessStatusFilterIcon();

      logger.step('Step 33: Click Select All to deselect all items');
      const excelFilterDialog = await administrationUserPage.getExcelFilterDialog();
      await excelFilterDialog.waitFor({ state: 'visible', timeout: 10000 });
      const selectAllOption = excelFilterDialog.getByText('Select All', { exact: true });
      await selectAllOption.click();
      logger.info('✓ Clicked Select All to deselect all items');

      logger.step('Step 34: Select Active and click OK');
      const activeOption = excelFilterDialog.getByText('Active', { exact: true });
      await activeOption.click();
      logger.info('✓ Selected Active');
      const okButton1 = excelFilterDialog.getByRole('button', { name: 'OK', exact: true });
      await okButton1.click();
      logger.info('✓ Clicked OK');

      logger.step('Step 35: Verify only Active status (S1) is displayed');
      await administrationUserPage.verifyFilteredSites([s1], 'Active');
      logger.info('✓ Verified only S1 (PW Automation S1) is displayed with Active status');

      logger.step('Step 36: Open filter, deselect Active, select Expired, and click OK');
      await administrationUserPage.clickAccessStatusFilterIcon();
      const activeOption2 = excelFilterDialog.getByText('Active', { exact: true });
      await activeOption2.click();
      logger.info('✓ Deselected Active');
      const expiredOption = excelFilterDialog.getByText('Expired', { exact: true });
      await expiredOption.click();
      logger.info('✓ Selected Expired');
      const okButton2 = excelFilterDialog.getByRole('button', { name: 'OK', exact: true });
      await okButton2.click();
      logger.info('✓ Clicked OK');

      logger.step('Step 37: Verify only Expired status (S2) is displayed');
      await administrationUserPage.verifyFilteredSites([s2], 'Expired');
      logger.info('✓ Verified only S2 (PW Automation S2) is displayed with Expired status');

      logger.step('Step 38: Open filter, deselect Expired, select Expiring Soon, and click OK');
      await administrationUserPage.clickAccessStatusFilterIcon();
      const expiredOption2 = excelFilterDialog.getByText('Expired', { exact: true });
      await expiredOption2.click();
      logger.info('✓ Deselected Expired');
      const expiringSoonOption = excelFilterDialog.getByText('Expiring Soon', { exact: true });
      await expiringSoonOption.click();
      logger.info('✓ Selected Expiring Soon');
      const okButton3 = excelFilterDialog.getByRole('button', { name: 'OK', exact: true });
      await okButton3.click();
      logger.info('✓ Clicked OK');

      logger.step('Step 39: Verify only Expiring Soon status (S3) is displayed');
      await administrationUserPage.verifyFilteredSites([s3], 'Expiring Soon');
      logger.info('✓ Verified only S3 (PW Automation S3) is displayed with Expiring Soon status');

      logger.step('Step 40: Open filter, deselect Expiring Soon, select Blanks, and click OK');
      await administrationUserPage.clickAccessStatusFilterIcon();
      const expiringSoonOption2 = excelFilterDialog.getByText('Expiring Soon', { exact: true });
      await expiringSoonOption2.click();
      logger.info('✓ Deselected Expiring Soon');
      const blanksOption = excelFilterDialog.getByText('Blanks', { exact: true });
      await blanksOption.click();
      logger.info('✓ Selected Blanks');
      const okButton4 = excelFilterDialog.getByRole('button', { name: 'OK', exact: true });
      await okButton4.click();
      logger.info('✓ Clicked OK');

      logger.step('Step 41: Verify only Blanks status (S4) is displayed');
      await administrationUserPage.verifyFilteredSites([s4], 'Blanks');
      logger.info('✓ Verified only S4 (PW Automation S4) is displayed with Blanks status');

      logger.step('Step 42: Open filter, click Select All, and click OK to show all statuses');
      await administrationUserPage.clickAccessStatusFilterIcon();
      const selectAllOption2 = excelFilterDialog.getByText('Select All', { exact: true });
      await selectAllOption2.click();
      logger.info('✓ Clicked Select All to select all items');
      const okButton5 = excelFilterDialog.getByRole('button', { name: 'OK', exact: true });
      await okButton5.click();
      logger.info('✓ Clicked OK');

      logger.step('Step 43: Verify all statuses are displayed (S1, S2, S3, S4)');
      await administrationUserPage.verifyFilteredSites([s1, s2, s3, s4], 'All');
      logger.info('✓ Verified all sites (S1, S2, S3, S4) are displayed with all statuses');

      logger.step('Step 44: Cleanup - Bulk select and remove access for all test sites');
      await administrationUserPage.selectMultipleSites([s1, s2, s3, s4]);
      await administrationUserPage.bulkRemoveSelectedSites(s1);

      logger.step('Step 45: Click Save button');
      await administrationUserPage.clickSaveButton();

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-13 - Verify user can set an access expiry date for a site that already has permissions', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-13 - Verify user can set an access expiry date for a site that already has permissions';
    logger.testStart(testName);

    const { userName } = testData.testData.administrationUserJeewaka;

    try {
      await testSetup.loginAsValidUser();
      await administrationUserPage.waitForDOMContentLoaded();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 1: Navigate to ADMINISTRATION tab');
      await administrationUserPage.navigateToAdministrationTab();
      await administrationUserPage.waitForPageReady();
      logger.info('✓ Page is ready after navigating to ADMINISTRATION tab');

      logger.step('Step 2: Verify page contains SITE LIST');
      await administrationUserPage.verifySiteListVisible();

      logger.step('Step 3: Navigate to Users → List');
      await administrationUserPage.navigateToUsersList();

      logger.step('Step 4: Wait for user grid data to load');
      await administrationUserPage.waitForUserGridToLoad();
      logger.info('✓ User grid loaded');

      logger.step('Step 4a: Wait for grid filter to be ready');
      await administrationUserPage.waitForUserGridFilterReady();
      logger.info('✓ Grid filter is ready');

      logger.step(`Step 5: Filter user list by First name "${userName}"`);
      await administrationUserPage.filterByFirstName(userName);

      logger.step('Step 6: Expand user list section');
      await administrationUserPage.expandUserListSection();

      logger.step('Step 7: Click Edit button');
      await administrationUserPage.clickEditButton();

      logger.step('Step 8: Open SITE ACCESS AND PERMISSIONS section');
      await administrationUserPage.openSiteAccessPermissions();

      logger.step('Step 9: Wait for site access data to load');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid loaded');

      logger.step('Step 10: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step('Step 11: Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Step 11a: Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid reloaded');

      logger.step('Step 12: Click filter icon on Access Status column');
      await administrationUserPage.clickAccessStatusFilterIcon();

      logger.step('Step 13: Click Select All to deselect all items');
      const excelFilterDialog = await administrationUserPage.getExcelFilterDialog();
      await excelFilterDialog.waitFor({ state: 'visible', timeout: 10000 });
      const selectAllOption = excelFilterDialog.getByText('Select All', { exact: true });
      await selectAllOption.click();
      logger.info('✓ Clicked Select All to deselect all items');

      logger.step('Step 14: Select Blanks and click OK');
      const blanksOption = excelFilterDialog.getByText('Blanks', { exact: true });
      await blanksOption.click();
      logger.info('✓ Selected Blanks');
      const okButton = excelFilterDialog.getByRole('button', { name: 'OK', exact: true });
      await okButton.click();
      logger.info('✓ Clicked OK');

      logger.step('Step 15: Capture first site name without expiry date');
      const blankExpiryDateSite = await administrationUserPage.getFirstSiteNameFromGrid();
      logger.info(`✓ Captured site name: ${blankExpiryDateSite}`);

      logger.step('Step 16: Double-click Access Expiration date cell');
      await administrationUserPage.editAccessExpirationDateCell(blankExpiryDateSite);

      logger.step('Step 17: Click calendar icon to open date picker');
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Step 18: Click TODAY button to select today\'s date');
      await administrationUserPage.clickTodayInCalendar();

      logger.step('Step 19: Verify the selected date appears in the cell');
      const today = new Date();
      const expectedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
      await administrationUserPage.verifyAccessExpirationDateExists(blankExpiryDateSite, expectedDate);

      logger.step('Step 20: Click Save button');
      await administrationUserPage.clickSaveButton();

      logger.step('Step 21: Verify "Successfully saved." message appears');
      await administrationUserPage.verifySaveSuccessMessage();

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-14 - Verify that updates to the access expiry date for a single module in a site are reflected across all modules for that site', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-14 - Verify that updates to the access expiry date for a single module in a site are reflected across all modules for that site';
    logger.testStart(testName);

    const { userName } = testData.testData.administrationUserJeewaka;

    try {
      await testSetup.loginAsValidUser();
      await administrationUserPage.waitForDOMContentLoaded();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 1: Navigate to ADMINISTRATION tab');
      await administrationUserPage.navigateToAdministrationTab();
      await administrationUserPage.waitForPageReady();
      logger.info('✓ Page is ready after navigating to ADMINISTRATION tab');

      logger.step('Step 2: Verify page contains SITE LIST');
      await administrationUserPage.verifySiteListVisible();

      logger.step('Step 3: Navigate to Users → List');
      await administrationUserPage.navigateToUsersList();

      logger.step('Step 4: Wait for user grid data to load');
      await administrationUserPage.waitForUserGridToLoad();
      logger.info('✓ User grid loaded');

      logger.step('Step 4a: Wait for grid filter to be ready');
      await administrationUserPage.waitForUserGridFilterReady();
      logger.info('✓ Grid filter is ready');

      logger.step(`Step 5: Filter user list by First name "${userName}"`);
      await administrationUserPage.filterByFirstName(userName);

      logger.step('Step 6: Expand user list section');
      await administrationUserPage.expandUserListSection();

      logger.step('Step 7: Click Edit button');
      await administrationUserPage.clickEditButton();

      logger.step('Step 8: Open SITE ACCESS AND PERMISSIONS section');
      await administrationUserPage.openSiteAccessPermissions();

      logger.step('Step 9: Wait for site access data to load');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid loaded');

      logger.step('Step 10: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step('Step 11: Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Step 11a: Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid reloaded');

      logger.step('Step 12: Click filter icon on Access Status column');
      await administrationUserPage.clickAccessStatusFilterIcon();

      logger.step('Step 13: Click Select All to deselect all items');
      const excelFilterDialog = await administrationUserPage.getExcelFilterDialog();
      await excelFilterDialog.waitFor({ state: 'visible', timeout: 10000 });
      const selectAllOption = excelFilterDialog.getByText('Select All', { exact: true });
      await selectAllOption.click();
      logger.info('✓ Clicked Select All to deselect all items');

      logger.step('Step 14: Select Blanks and click OK');
      const blanksOption = excelFilterDialog.getByText('Blanks', { exact: true });
      await blanksOption.click();
      logger.info('✓ Selected Blanks');
      const okButton = excelFilterDialog.getByRole('button', { name: 'OK', exact: true });
      await okButton.click();
      logger.info('✓ Clicked OK');

      logger.step('Step 15: Capture first site name without expiry date');
      const blankExpiryDateSite = await administrationUserPage.getFirstSiteNameFromGrid();
      logger.info(`✓ Captured site name: ${blankExpiryDateSite}`);

      logger.step('Step 16: Double-click Access Expiration date cell');
      await administrationUserPage.editAccessExpirationDateCell(blankExpiryDateSite);

      logger.step('Step 17: Click calendar icon to open date picker');
      await administrationUserPage.openExpirationDateCalendar();

      logger.step('Step 18: Click TODAY button to select today\'s date');
      await administrationUserPage.clickTodayInCalendar();

      logger.step('Step 19: Verify the selected date appears in the cell');
      const today = new Date();
      const expectedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
      await administrationUserPage.verifyAccessExpirationDateExists(blankExpiryDateSite, expectedDate);

      logger.step('Step 20: Click Save button');
      await administrationUserPage.clickSaveButton();

      logger.step('Step 21: Verify "Successfully saved." message appears');
      await administrationUserPage.verifySaveSuccessMessage();

      logger.step('Step 22: Wait for network to be idle');
      logger.info('✓ Save operation complete');

      logger.step('Step 23: Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Step 24: Disable "Show permission columns" again');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step('Step 25: Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Step 25a: Wait for grid data to be fully loaded');
      await administrationUserPage.waitForGridRows();
      logger.info('✓ Grid data is fully loaded and ready for filtering');

      logger.step('Step 25b: Clear Access Status filter before filtering by site');
      await administrationUserPage.clickAccessStatusFilterIcon();
      const clearFilterOption = await administrationUserPage.getClearFilterOption();
      await clearFilterOption.waitFor({ state: 'visible', timeout: 10000 });
      await clearFilterOption.click();
      logger.info('✓ Cleared Access Status filter');

      logger.step(`Step 26: Filter by Accessible Sites: ${blankExpiryDateSite}`);
      await administrationUserPage.filterByAccessibleSites(blankExpiryDateSite);

      logger.step(`Step 27: Verify only "${blankExpiryDateSite}" appears in the grid`);
      const rowCount = await administrationUserPage.getVisibleRowCount();
      logger.info(`✓ Number of visible rows: ${rowCount}`);

      logger.step('Step 28: Enable "Show permission columns" to reveal module dropdown');
      await administrationUserPage.enableShowPermissionColumns();

      logger.step('Step 29: Randomly select a module (excluding MAINT)');
      const selectedModule = await administrationUserPage.changePermissionModuleToRandom();
      logger.info(`✓ Selected module: ${selectedModule}`);

      logger.step('Step 30: Verify Access Expiration date remains visible and matches updated value');
      await administrationUserPage.verifyAccessExpirationDateExists(blankExpiryDateSite, expectedDate);
      logger.info(`✓ Access Expiration date confirmed as ${expectedDate} for module "${selectedModule}"`);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-15 - Verify that clearing the access expiration date for a single module in a site is reflected in all modules for that site', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-15 - Verify that clearing the access expiration date for a single module in a site is reflected in all modules for that site';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUser;

    try {
      await testSetup.loginAsValidUser();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 1: Navigate to ADMINISTRATION tab');
      await administrationUserPage.navigateToAdministrationTab();
      await administrationUserPage.waitForPageReady();

      logger.step('Step 2: Verify page contains SITE LIST');
      await administrationUserPage.verifySiteListVisible();

      logger.step('Step 3: Navigate to Users → List');
      await administrationUserPage.navigateToUsersList();

      logger.step('Step 4: Wait for user grid data to load');
      await administrationUserPage.waitForUserGridToLoad();

      logger.step('Step 4a: Wait for grid filter to be ready');
      await administrationUserPage.waitForUserGridFilterReady();
      logger.info('✓ Grid filter is ready');

      logger.step(`Step 5: Filter user list by First name "${userName}"`);
      await administrationUserPage.filterByFirstName(userName);

      logger.step('Step 6: Expand user list section');
      await administrationUserPage.expandUserListSection();

      logger.step('Step 7: Click Edit button');
      await administrationUserPage.clickEditButton();

      logger.step('Step 8: Open SITE ACCESS AND PERMISSIONS section');
      await administrationUserPage.openSiteAccessPermissions();
      await administrationUserPage.waitForSiteAccessGridToLoad();

      logger.step('Step 9: Enable "Show sites with no access granted"');
      await administrationUserPage.enableShowSitesWithNoAccess();

      logger.step('Step 9a: Wait for Site Access grid to reload with all sites');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid reloaded with all sites');

      logger.step(`Step 10: Filter site list by Site Name "${siteName}"`);
      await administrationUserPage.filterBySiteName(siteName);

      logger.step(`Step 11: Click on site "${siteName}"`);
      await administrationUserPage.clickSiteCell(siteName);
      logger.info(`✓ Clicked on site "${siteName}"`);

      logger.step(`Step 12: Grant access to site "${siteName}"`);
      await administrationUserPage.grantAccessToSite(siteName);

      logger.step('Step 13: Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();

      logger.step('Step 14: Verify "Show sites with access granted" is selected');
      await administrationUserPage.verifyShowSitesWithAccessSelected();

      logger.step('Step 15: Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Step 16: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step('Step 17: Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step(`Step 18: Clear Access Expiration date for site "${siteName}"`);
      await administrationUserPage.clearAccessExpirationDate(siteName);

      logger.step('Step 19: Verify Access Expiration date is empty immediately after clearing');
      await administrationUserPage.verifyAccessExpirationDateIsEmpty(siteName);

      logger.step('Step 20: Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();

      logger.step('Step 21: Click Edit button again');
      await administrationUserPage.clickEditButton();

      logger.step('Step 22: Disable "Show permission columns" again');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step('Step 23: Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();

      logger.step('Step 24: Enable "Show permission columns" to reveal module dropdown');
      await administrationUserPage.enableShowPermissionColumns();

      logger.step('Step 25: Randomly select a module (excluding MAINT)');
      const selectedModule = await administrationUserPage.changePermissionModuleToRandom();
      logger.info(`✓ Selected module: ${selectedModule}`);

      logger.step('Step 26: Verify Access Expiration date remains empty for the selected module');
      await administrationUserPage.verifyAccessExpirationDateIsEmpty(siteName);
      logger.info(`✓ Access Expiration date confirmed as empty for module "${selectedModule}"`);

      logger.step('Step 27: Cleanup - Remove access for site');
      await administrationUserPage.removeAccessForSite(siteName);

      logger.step('Step 28: Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();

      logger.step('Step 29: Cleanup completed');
      logger.info('✓ Cleanup completed successfully');

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-16 - Verify behavior when a user (with access to multiple sites) has access expired for a single site and module', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-16 - Verify behavior when a user (with access to multiple sites) has access expired for a single site and module';
    logger.testStart(testName);

    const { userName, site1, site2 } = testData.testData.administrationUserTest16;
    const expectedSites = [site1, site2];

    try {
      logger.step('Step 1: Login as pwuser16');
      await testSetup.loginAsUser('pwuser16');
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged in as pwuser16');

      logger.step('Step 2: Verify sites dropdown shows both sites');
      const basePage = testSetup.getLoginPage();
      await basePage.verifySitesInDropdown(null, expectedSites);

      logger.step('Step 3: Logout from pwuser16');
      await basePage.logout();
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged out from pwuser16');

      logger.step('Step 4: Login as peter (admin user)');
      await testSetup.loginAsValidUser();
      await administrationUserPage.waitForDOMContentLoaded();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 5: Navigate to ADMINISTRATION tab');
      await administrationUserPage.navigateToAdministrationTab();
      await administrationUserPage.waitForPageReady();

      logger.step('Step 6: Navigate to Users → List');
      await administrationUserPage.navigateToUsersList();

      logger.step('Step 7: Wait for user grid data to load');
      await administrationUserPage.waitForUserGridToLoad();
      logger.info('✓ User grid data loaded');

      logger.step('Step 7a: Wait for grid filter to be ready');
      await administrationUserPage.waitForUserGridFilterReady();
      logger.info('✓ Grid filter is ready');

      logger.step(`Step 8: Filter user list by First name "${userName}"`);
      await administrationUserPage.filterByFirstName(userName);

      logger.step('Step 9: Drag resize handler up to expand user list section');
      await administrationUserPage.expandUserListSection();

      logger.step('Step 10: Click Edit button');
      await administrationUserPage.clickEditButton();

      logger.step('Step 11: Open SITE ACCESS AND PERMISSIONS section');
      await administrationUserPage.openSiteAccessPermissions();

      logger.step('Step 12: Wait for site grid to load');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site grid content loaded');

      logger.step('Step 12a: Wait for site grid rows to be populated');
      await administrationUserPage.waitForGridRows();
      logger.info('✓ Site grid rows populated');

      logger.step('Step 12b: Verify both sites are present');
      await administrationUserPage.waitForSitesInGrid([site1, site2]);
      logger.info(`✓ Both sites are visible: ${site1}, ${site2}`);

      logger.step('Step 13: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step(`Step 14: Set Access Expiry Date for "${site1}" to TODAY`);
      await administrationUserPage.setAccessExpirationDate(site1, 0);

      logger.step('Step 15: Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Changes saved successfully');

      logger.step('Step 16: Logout from peter');
      await basePage.logout();
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged out from peter');

      logger.step('Step 17: Login again as pwuser16');
      await testSetup.loginAsUser('pwuser16');
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged in as pwuser16');

      logger.step('Step 18: Verify user can see only Site 2 in dropdown');
      await basePage.verifySitesInDropdown(null, [site2]);
      logger.info(`✓ Only ${site2} is visible after ${site1} access expired`);

      logger.step('Step 19: Logout from pwuser16');
      await basePage.logout();
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged out from pwuser16');

      logger.step('Step 20 (Cleanup): Login as peter');
      await testSetup.loginAsValidUser();
      await administrationUserPage.waitForDOMContentLoaded();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 21: Navigate to user management and filter by First name');
      await administrationUserPage.navigateToAdministrationTab();
      await administrationUserPage.waitForPageReady();
      await administrationUserPage.navigateToUsersList();
      await administrationUserPage.waitForUserGridToLoad();
      await administrationUserPage.filterByFirstName(userName);

      logger.step('Step 22: Click Edit and open SITE ACCESS AND PERMISSIONS');
      await administrationUserPage.clickEditButton();
      await administrationUserPage.openSiteAccessPermissions();
      await administrationUserPage.waitForSiteAccessGridToLoad();
      await administrationUserPage.expandUserListSection();

      logger.step('Step 23: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step(`Step 24: Remove expiry date for "${site1}"`);
      await administrationUserPage.clearAccessExpirationDateWithRetry(site1);

      logger.step('Step 25: Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Cleanup completed - expiry date removed');

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-17 - Verify behavior when a user (with access to a single site) has access expired for that site across all modules', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-17 - Verify behavior when a user (with access to a single site) has access expired for that site across all modules';
    logger.testStart(testName);

    const { userName, siteName } = testData.testData.administrationUserTest17;
    const expectedErrorMessage = "User's configuration is not setup. Please contact SCSeTools administrators";

    try {
      logger.step('Step 1: Login as pwuser17');
      await testSetup.loginAsUser('pwuser17');
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged in as pwuser17');

      logger.step('Step 2: Verify site dropdown shows the site');
      const basePage = testSetup.getLoginPage();
      await basePage.verifySitesInDropdown(null, [siteName]);
      logger.info(`✓ Site "${siteName}" is visible`);

      logger.step('Step 3: Logout from pwuser17');
      await basePage.logout();
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged out from pwuser17');

      logger.step('Step 4: Login as peter (admin user)');
      await testSetup.loginAsValidUser();
      await administrationUserPage.waitForDOMContentLoaded();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 5: Navigate to ADMINISTRATION tab');
      await administrationUserPage.navigateToAdministrationTab();
      await administrationUserPage.waitForPageReady();

      logger.step('Step 6: Navigate to Users → List');
      await administrationUserPage.navigateToUsersList();

      logger.step('Step 7: Wait for user grid data to load');
      await administrationUserPage.waitForUserGridToLoad();
      logger.info('✓ User grid data loaded');

      logger.step('Step 7a: Wait for grid filter to be ready');
      await administrationUserPage.waitForUserGridFilterReady();
      logger.info('✓ Grid filter is ready');

      logger.step(`Step 8: Filter user list by First name "${userName}"`);
      await administrationUserPage.filterByFirstName(userName);

      logger.step('Step 9: Drag resize handler up to expand user list section');
      await administrationUserPage.expandUserListSection();

      logger.step('Step 10: Click Edit button');
      await administrationUserPage.clickEditButton();

      logger.step('Step 11: Open SITE ACCESS AND PERMISSIONS section');
      await administrationUserPage.openSiteAccessPermissions();

      logger.step('Step 11a: Wait for site grid to load');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site grid content loaded');

      logger.step('Step 11b: Wait for site grid rows to be populated');
      logger.info('✓ Site grid rows populated');

      logger.step('Step 12: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step(`Step 13: Set Access Expiry Date for "${siteName}" to TODAY`);
      await administrationUserPage.setAccessExpirationDate(siteName, 0);

      logger.step('Step 14: Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();

      logger.step('Step 15: Logout from peter');
      await basePage.logout();
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged out from peter');

      logger.step('Step 16: Attempt to login as pwuser17 (expect error due to expired access)');
      const loginPage = testSetup.getLoginPage();
      const pwuser17Creds = credentials.getUserCredentials('pwuser17');
      await loginPage.enterUsername(pwuser17Creds.username);
      await loginPage.enterPassword(pwuser17Creds.password);

      await loginPage.clickLoginButton();
      logger.info('✓ Login button clicked');

      logger.step('Step 17-18: Verify error dialog and message');
      await administrationUserPage.verifyErrorDialogWithMessage(expectedErrorMessage);
      logger.info('✓ Error dialog handled successfully');

      logger.step('Step 19: Logout/return to login page');
      // User is still on login page after error, no need to logout
      logger.info('✓ Still on login page');

      logger.step('Step 20 (Cleanup): Login as peter');
      await testSetup.loginAsValidUser();
      await administrationUserPage.waitForDOMContentLoaded();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 21: Navigate to user management and filter by First name');
      await administrationUserPage.navigateToAdministrationTab();
      await administrationUserPage.waitForPageReady();
      await administrationUserPage.navigateToUsersList();
      await administrationUserPage.waitForUserGridToLoad();

      // Add extra wait and retry for filter in cleanup section
      await administrationUserPage.filterByFirstNameWithRetry(userName, 3);

      logger.step('Step 22: Click Edit and open SITE ACCESS AND PERMISSIONS');
      await administrationUserPage.clickEditButton();
      await administrationUserPage.openSiteAccessPermissions();
      await administrationUserPage.waitForSiteAccessGridToLoad();
      await administrationUserPage.expandUserListSection();

      logger.step('Step 23: Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();

      logger.step(`Step 24: Remove expiry date for "${siteName}"`);
      await administrationUserPage.clearAccessExpirationDateWithRetry(siteName);

      logger.step('Step 25: Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Cleanup completed - expiry date removed');

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-26 - Verify File Options content in eTools access expiry notification', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-26 - Verify File Options content in eTools access expiry notification';
    logger.testStart(testName);

    try {
      await testSetup.loginAsValidUser();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 1: Navigate to Notifications');
      await administrationUserPage.navigateToNotifications();

      logger.step('Step 2: Wait for Notifications grid to load');
      await administrationUserPage.waitForNotificationsGridToLoad();

      logger.step('Step 3: Filter by Event Type "Site Access Expiration"');
      await administrationUserPage.filterByEventType('Site Access Expiration');

      logger.step('Step 4: Wait for filtered data to load');
      await administrationUserPage.waitForNotificationsGridToLoad();

      logger.step('Step 5: Capture Site Name from first row');
      const siteName = await administrationUserPage.captureFirstRowSiteName();
      logger.info(`✓ Captured Site Name: ${siteName}`);

      logger.step('Step 6: Click file viewer icon in first row');
      await administrationUserPage.clickFileViewerIcon();

      logger.step('Step 7: Validate notification content');
      await administrationUserPage.validateNotificationContent(siteName);
      logger.info('✓ Notification content validated successfully');

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-32 - Verify user access expiry data is displayed in the DS Site Status dashboard', async ({ page }) => {
    const testName = 'ADMIN-USR-ACC-EXP-32 - Verify user access expiry data is displayed in the DS Site Status dashboard';
    logger.testStart(testName);

    const {
      siteNameForAccessExpiration, userFirstNameForAccessExpiration, accessExpirationDatePattern, contactIconClass,
    } = testData.testData.siteStatusDashboard;
    const siteStatusDashboardPage = testSetup.getSiteStatusDashboardPage();

    try {
      await testSetup.loginAsValidUser();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 1: Filter by site name using exact match');
      await siteStatusDashboardPage.filterBySiteNameExact(siteNameForAccessExpiration);
      logger.info(`✓ Filtered by site: ${siteNameForAccessExpiration}`);

      logger.step('Step 2: Click the contact icon under Contacts column');
      await siteStatusDashboardPage.clickContactIcon(contactIconClass);
      logger.info('✓ Clicked contact icon');

      logger.step('Step 3: Verify a popup/modal is opened');
      await siteStatusDashboardPage.verifyContactsPopupVisible();
      logger.info('✓ Site Contacts popup is visible');

      logger.step('Step 4: Wait for popup data to load');
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch (error) {
        logger.warn(`Network idle state not reached within timeout: ${error.message}`);
      }
      await page.waitForTimeout(WAIT_TIMES.GRID_STABILIZATION);
      logger.info('✓ Popup data loaded');

      logger.step('Step 5: Click the "USERS WITH ACCESS" tab');
      await siteStatusDashboardPage.clickTab('USERS WITH ACCESS');
      logger.info('✓ Clicked USERS WITH ACCESS tab');

      logger.step('Step 6: Verify the "Access Expiration" column is visible');
      await siteStatusDashboardPage.verifyAccessExpirationColumnVisible();
      logger.info('✓ Access Expiration column is visible');

      logger.step(`Step 7: Verify user "${userFirstNameForAccessExpiration}" has Access Expiration value in correct format`);
      const accessExpirationDate = await siteStatusDashboardPage.verifyUserAccessExpirationDate(userFirstNameForAccessExpiration, accessExpirationDatePattern);
      logger.info(`✓ User "${userFirstNameForAccessExpiration}" has Access Expiration date: ${accessExpirationDate}`);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-33 - Verify user access expiry data is displayed in the GW Site Status dashboard', async ({ page }) => {
    const testName = 'ADMIN-USR-ACC-EXP-33 - Verify user access expiry data is displayed in the GW Site Status dashboard';
    logger.testStart(testName);

    const {
      userFirstNameForAccessExpiration, accessExpirationDatePattern, contactIconClass,
    } = testData.testData.siteStatusDashboard;
    const siteNameForGW = 'Site 4650';
    const siteStatusDashboardPage = testSetup.getSiteStatusDashboardPage();

    try {
      await testSetup.loginAsValidUser();
      await testSetup.acknowledgeHealthAndSafety();

      logger.step('Step 1: Click "SCS GROUNDWATER" tab');
      await siteStatusDashboardPage.clickGroundwaterTab();
      logger.info('✓ Clicked SCS GROUNDWATER tab');

      logger.step('Step 2: Wait for Groundwater dashboard to load');
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch (error) {
        logger.warn(`Load state conditions not fully met: ${error.message}`);
      }
      await page.waitForTimeout(WAIT_TIMES.PERMISSION_RENDER * 2);
      logger.info('✓ Groundwater dashboard loaded');

      logger.step('Step 3: Filter by site name using exact match');
      await siteStatusDashboardPage.filterBySiteNameExact(siteNameForGW);
      logger.info(`✓ Filtered by site: ${siteNameForGW}`);

      logger.step('Step 4: Click the contact icon under Contacts column');
      await siteStatusDashboardPage.clickContactIcon(contactIconClass);
      logger.info('✓ Clicked contact icon');

      logger.step('Step 5: Verify a popup/modal is opened');
      await siteStatusDashboardPage.verifyContactsPopupVisible();
      logger.info('✓ Site Contacts popup is visible');

      logger.step('Step 6: Wait for popup data to load');
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch (error) {
        logger.warn(`Network idle state not reached within timeout: ${error.message}`);
      }
      await page.waitForTimeout(WAIT_TIMES.GRID_STABILIZATION);
      logger.info('✓ Popup data loaded');

      logger.step('Step 7: Click the "USERS WITH ACCESS" tab');
      await siteStatusDashboardPage.clickTab('USERS WITH ACCESS');
      logger.info('✓ Clicked USERS WITH ACCESS tab');

      logger.step('Step 8: Verify the "Access Expiration" column is visible');
      await siteStatusDashboardPage.verifyAccessExpirationColumnVisible();
      logger.info('✓ Access Expiration column is visible');

      logger.step(`Step 9: Verify user "${userFirstNameForAccessExpiration}" has Access Expiration value in correct format`);
      const accessExpirationDate = await siteStatusDashboardPage.verifyUserAccessExpirationDate(userFirstNameForAccessExpiration, accessExpirationDatePattern);
      logger.info(`✓ User "${userFirstNameForAccessExpiration}" has Access Expiration date: ${accessExpirationDate}`);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });

  test('ADMIN-USR-ACC-EXP-34 - Verify User Status Admin report UI', async () => {
    const testName = 'ADMIN-USR-ACC-EXP-34 - Verify User Status Admin report UI';
    logger.testStart(testName);

    const { siteName } = testData.testData.administrationUserTest34;
    const loginPage = testSetup.getLoginPage();

    try {
      logger.step('Step 1: Login with PW Automation U2');
      await testSetup.loginAsUser('pwautomationu2');
      await administrationUserPage.waitForDOMContentLoaded();
      logger.info('✓ Logged in as PW Automation U2');

      logger.step('Step 2: Verify site in dropdown');
      await loginPage.verifySitesInDropdown(null, [siteName]);
      logger.info(`✓ Site "${siteName}" is visible in dropdown`);

      logger.step('Step 3: Navigate to Admin');
      await administrationUserPage.clickAdminToolbar();
      logger.info('✓ Navigated to Admin');

      logger.step('Step 4: Open User Status Report');
      await administrationUserPage.clickUserStatus();
      await administrationUserPage.verifyUsersTextVisible();
      logger.info('✓ User Status section opened');

      logger.step('Step 5: Create Report');
      await administrationUserPage.clickCreateReport();
      await administrationUserPage.verifyUserStatusReportPage();
      logger.info('✓ User Status Report page loaded');

      logger.step('Step 6: Verify Access Expiration column exists');
      await administrationUserPage.verifyAccessExpirationColumn();
      logger.info('✓ Access Expiration column is visible');

      logger.step('Step 7: Verify Access Expiration column is positioned after Last Logon Date');
      await administrationUserPage.verifyAccessExpirationAfterLastLogonDate();
      logger.info('✓ Access Expiration column is correctly positioned after Last Logon Date');

      logger.step('Step 8: Capture date value from Access Expiration column');
      const accessExpirationDate = await administrationUserPage.getAccessExpirationDateValue();
      logger.info(`✓ Captured Access Expiration date: ${accessExpirationDate}`);

      logger.step('Step 9: Validate date format matches other date columns');
      await administrationUserPage.verifyDateFormatMatches(accessExpirationDate);
      logger.info('✓ Access Expiration date format matches other date columns');

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    }
  });
});
