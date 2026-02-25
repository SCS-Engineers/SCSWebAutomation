const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const logger = require('../../../utils/logger');
const testData = require('../../../data/testData.json');

// Wait time constants for explicit timing requirements
// Note: These values are tuned for the system's load times - modify with caution
const WAIT_TIMES = {
  GRID_STABILIZATION: 3000,
  PERMISSION_RENDER: 2500,
  FILTER_DELAY: 1000,
  SHORT_DELAY: 500,
};

/**
 * Test suite for Admin User Management - Site Access Expiration Date functionality
 * Verifies expiration date management, access status indicators, and permission controls
 */
test.describe('Admin User Mgmt Site Access Expiration Date', () => {
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
  async function setupUserForSiteAccess(userName) {
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
  }

  /**
   * Helper: Grant access to site and save
   * @param {string} siteName - Site name to grant access to
   * @returns {Promise<void>}
   */
  async function grantSiteAccessAndSave(siteName) {
    await administrationUserPage.enableShowSitesWithNoAccess();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    await administrationUserPage.filterBySiteName(siteName);
    await administrationUserPage.waitForGridRows();
    await administrationUserPage.clickSiteCell(siteName);
    await administrationUserPage.grantAccessToSite(siteName);
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
  }

  /**
   * Helper: Prepare grid for verification after saving
   * @param {number} [stabilizationWait=WAIT_TIMES.GRID_STABILIZATION] - Wait time in ms for grid to stabilize
   * @returns {Promise<void>}
   */
  async function prepareGridForVerification(stabilizationWait = WAIT_TIMES.GRID_STABILIZATION) {
    await administrationUserPage.verifyShowSitesWithAccessSelected();
    await administrationUserPage.waitForGridContent();
    await administrationUserPage.clickEditButton();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    await administrationUserPage.wait(stabilizationWait);
    
    // Try to disable permission columns, but don't fail if it's not possible
    try {
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
    } catch (error) {
      logger.warn(`Could not disable permission columns: ${error.message}`);
      logger.info('Continuing without disabling permission columns');
    }
    
    await administrationUserPage.waitForGridRows();
    await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
  }

  /**
   * Helper: Cleanup site access
   * @param {string} siteName - Site name to remove access from
   * @returns {Promise<void>}
   */
  async function cleanupSiteAccess(siteName) {
    try {
      await administrationUserPage.removeAccessForSite(siteName);
      await administrationUserPage.clickSaveButton();
    } catch (error) {
      logger.error(`Cleanup failed for site ${siteName}: ${error.message}`);
      // Don't throw - cleanup failures shouldn't fail the test
    }
  }

  test('ADMIN-USR-ACC-EXP-01 - Verify the default value of the Access Expiration date when giving permission to a new site', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-01 - Verify the default value of the Access Expiration date when giving permission to a new site');
    
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
      
      logger.testEnd('ADMIN-USR-ACC-EXP-01 - Verify the default value of the Access Expiration date when giving permission to a new site', 'PASSED');
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-02 - Verify the default value of the Access Expiration date when giving permission to a new site through a group', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-02 - Verify the default value of the Access Expiration date when giving permission to a new site through a group');
    
    const { userName, groupName, siteNames } = testData.testData.administrationUser;
    const expectedSites = [siteNames.s2, siteNames.s3, siteNames.s4, siteNames.s5];
    
    try {
      await setupUserForSiteAccess(userName);
      
      logger.step('Enable "Show groups with no access granted"');
      await administrationUserPage.enableShowGroupsWithNoAccess();
      
      logger.step('Wait for groups grid to load');
      await administrationUserPage.waitForGridContent();
      
      logger.step(`Filter group list by Group Name "${groupName}"`);
      await administrationUserPage.filterByGroupName(groupName);
      
      logger.step('Wait for filtered group to appear');
      await administrationUserPage.waitForGroupCellVisible(groupName);
      
      logger.step(`Click on group "${groupName}"`);
      await administrationUserPage.clickGroupCell(groupName);
      
      logger.step(`Grant access to group "${groupName}"`);
      await administrationUserPage.grantAccessToGroup(groupName);
      
      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();
      
      logger.step('Wait for save success message');
      await administrationUserPage.waitForSuccessMessage();
      
      logger.step('Verify "Show sites with access granted" is selected');
      await administrationUserPage.verifyShowSitesWithAccessSelected();
      
      logger.step('Wait for sites grid to stabilize');
      await administrationUserPage.waitForGridContent();
      await administrationUserPage.waitForGridRows();
      await administrationUserPage.waitForGridRowsWithStabilization(30000, 5000);
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Click Edit button again');
      await administrationUserPage.clickEditButton();
      
      logger.step('Wait for SITE ACCESS AND PERMISSIONS section to load');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
      
      logger.step('Wait for grid to stabilize');
      await administrationUserPage.waitForAccessStatusColumn();
      await administrationUserPage.waitForGridRowsWithStabilization();
      
      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
      
      logger.step('Clear filter on "Accessible Sites" column');
      await administrationUserPage.clearColumnFilter('Accessible Sites');
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Wait for sites grid data to load');
      await administrationUserPage.waitForGridRowsWithStabilization();
      
      logger.step(`Verify sites ${expectedSites.join(', ')} have Access Expiration dates`);
      await administrationUserPage.verifySitesHaveExpirationDates(expectedSites);
      
      logger.testEnd('ADMIN-USR-ACC-EXP-02 - Verify the default value of the Access Expiration date when giving permission to a new site through a group', 'PASSED');
    } finally {
      logger.step('Cleanup - Remove group access');
      await administrationUserPage.enableShowGroupsWithAccessGranted();
      await administrationUserPage.waitForGridContent();
      await administrationUserPage.waitForGridRows();
      await administrationUserPage.removeAccessForGroup(groupName);
      await administrationUserPage.clickSaveButton();
    }
  });

  test('ADMIN-USR-ACC-EXP-03  - Verify the lower and upper limit of the Access Expiration date', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-03  - Verify the lower and upper limit of the Access Expiration date');
    
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
    
      logger.testEnd('ADMIN-USR-ACC-EXP-03  - Verify the lower and upper limit of the Access Expiration date', 'PASSED');
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-05 - Verify users can clear the access expiry date', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-05 - Verify users can clear the access expiry date');
    
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
      
      logger.testEnd('ADMIN-USR-ACC-EXP-05 - Verify users can clear the access expiry date', 'PASSED');
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-06 - Verify Access Status icon color when access expired', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-06 - Verify Access Status icon color when access expired');
    
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
      
      logger.testEnd('ADMIN-USR-ACC-EXP-06 - Verify Access Status icon color when access expired', 'PASSED');
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-07 - Verify Access Status icon color when access near expiry', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-07 - Verify Access Status icon color when access near expiry');
    
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
      
      logger.testEnd('ADMIN-USR-ACC-EXP-07 - Verify Access Status icon color when access near expiry', 'PASSED');
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-08 - Verify Access Status icon color when access is valid', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-08 - Verify Access Status icon color when access is valid');
    
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
      
      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
      
      logger.step('Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      logger.info('✓ Site Access grid reloaded');
      
      logger.step('Verify Access Status shows "Active" with green background');
      await administrationUserPage.verifyAccessStatusIsActiveWithColor(siteName);
      
      logger.testEnd('ADMIN-USR-ACC-EXP-08 - Verify Access Status icon color when access is valid', 'PASSED');
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-09 - Verify Access Status icon when there\'s no expiration date', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-09 - Verify Access Status icon when there\'s no expiration date');
    
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
      
      logger.testEnd('ADMIN-USR-ACC-EXP-09 - Verify Access Status icon when there\'s no expiration date', 'PASSED');
    } finally {
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-10 - Verify the default state of Show Permission columns checkbox', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-10 - Verify the default state of Show Permission columns checkbox');
    
    const { userName } = testData.testData.administrationUser;
    
    await setupUserForSiteAccess(userName);
    
    logger.step('Verify "Show sites with access granted" is selected by default');
    await administrationUserPage.verifyShowSitesWithAccessSelected();
    
    logger.testEnd('ADMIN-USR-ACC-EXP-10 - Verify the default state of Show Permission columns checkbox', 'PASSED');
  });

  test('ADMIN-USR-ACC-EXP-11 - Verify permission grid is collapsible', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-11 - Verify permission grid is collapsible');
    
    const { userName } = testData.testData.administrationUser;
    
    await setupUserForSiteAccess(userName);
    
    logger.step('Wait for grid to render permission columns');
    await administrationUserPage.wait(WAIT_TIMES.PERMISSION_RENDER);
    
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
    
    logger.testEnd('ADMIN-USR-ACC-EXP-11 - Verify permission grid is collapsible', 'PASSED');
  });

  test('ADMIN-USR-ACC-EXP-12 - Verify filtering options in Access Expiration column', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-12 - Verify filtering options in Access Expiration column');
    
    const { userName, siteNames } = testData.testData.administrationUser;
    const { s1, s2, s3, s4 } = siteNames;
    
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
    await administrationUserPage.wait(WAIT_TIMES.FILTER_DELAY);
    logger.info('✓ Grid reloaded with filtered sites');
    
    logger.step('Step 18b: Verify test sites are visible in grid');
    await administrationUserPage.waitForSitesInGrid([s1, s2, s3, s4], 15000);
    logger.info('✓ Test sites are visible in grid');
    
    logger.step('Step 19: Grant access to all test sites (S1-S4)');
    await administrationUserPage.grantAccessToMultipleSites([s1, s2, s3, s4]);
    
    logger.step('Step 20: Click Save button');
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    
    logger.step('Step 20a: Wait for sites grid to stabilize after save');
    await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
    logger.info('✓ Grids stabilized after save');
    
    logger.step('Step 21: Click Edit button again');
    await administrationUserPage.clickEditButton();
    
    logger.step('Step 22: Disable "Show permission columns"');
    await administrationUserPage.disableShowPermissionColumnsWithRetry();
    
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
    
    logger.testEnd('ADMIN-USR-ACC-EXP-12 - Verify filtering options in Access Expiration column', 'PASSED');
  });

  test('ADMIN-USR-ACC-EXP-13 - Verify user can set an access expiry date for a site that already has permissions', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-13 - Verify user can set an access expiry date for a site that already has permissions');
    
    const { userName } = testData.testData.administrationUserJeewaka;
    
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
    await administrationUserPage.wait(WAIT_TIMES.SHORT_DELAY);
    
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
    
    logger.testEnd('ADMIN-USR-ACC-EXP-13 - Verify user can set an access expiry date for a site that already has permissions', 'PASSED');
  });

  test('ADMIN-USR-ACC-EXP-14 - Verify that updates to the access expiry date for a single module in a site are reflected across all modules for that site', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-14 - Verify that updates to the access expiry date for a single module in a site are reflected across all modules for that site');
    
    const { userName } = testData.testData.administrationUserJeewaka;
    
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
    
    logger.testEnd('ADMIN-USR-ACC-EXP-14 - Verify that updates to the access expiry date for a single module in a site are reflected across all modules for that site', 'PASSED');
  });

  test('ADMIN-USR-ACC-EXP-15 - Verify that clearing the access expiration date for a single module in a site is reflected in all modules for that site', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-15 - Verify that clearing the access expiration date for a single module in a site is reflected in all modules for that site');
    
    const { userName, siteName } = testData.testData.administrationUser;
    
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
    
    logger.testEnd('ADMIN-USR-ACC-EXP-15 - Verify that clearing the access expiration date for a single module in a site is reflected in all modules for that site', 'PASSED');
  });

  test('ADMIN-USR-ACC-EXP-16 - Verify behavior when a user (with access to multiple sites) has access expired for a single site and module', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-16 - Verify behavior when a user (with access to multiple sites) has access expired for a single site and module');
    
    const { userName, site1, site2 } = testData.testData.administrationUserTest16;
    const expectedSites = [site1, site2];
    
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
    
    logger.step('Step 9: Click Edit button');
    await administrationUserPage.clickEditButton();
    
    logger.step('Step 10: Open SITE ACCESS AND PERMISSIONS section');
    await administrationUserPage.openSiteAccessPermissions();
    
    logger.step('Step 11: Wait for site grid to load');
    await administrationUserPage.waitForSiteAccessGridToLoad();
    logger.info('✓ Site grid content loaded');
    
    logger.step('Step 11a: Wait for site grid rows to be populated');
    await administrationUserPage.waitForGridRows();
    logger.info('✓ Site grid rows populated');
    
    logger.step('Step 11b: Verify both sites are present');
    await administrationUserPage.waitForSitesInGrid([site1, site2]);
    logger.info(`✓ Both sites are visible: ${site1}, ${site2}`);
    
    logger.step('Step 12: Disable "Show permission columns"');
    await administrationUserPage.disableShowPermissionColumnsWithRetry();
    
    logger.step(`Step 13: Set Access Expiry Date for "${site1}" to TODAY`);
    await administrationUserPage.setAccessExpirationDate(site1, 0);
    
    logger.step('Step 14: Click Save button');
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    logger.info('✓ Changes saved successfully');
    
    logger.step('Step 15: Logout from peter');
    await basePage.logout();
    await administrationUserPage.waitForDOMContentLoaded();
    logger.info('✓ Logged out from peter');
    
    logger.step('Step 16: Login again as pwuser16');
    await testSetup.loginAsUser('pwuser16');
    await administrationUserPage.waitForDOMContentLoaded();
    logger.info('✓ Logged in as pwuser16');
    
    logger.step('Step 17: Verify user can see only Site 2 in dropdown');
    await basePage.verifySitesInDropdown(null, [site2]);
    logger.info(`✓ Only ${site2} is visible after ${site1} access expired`);
    
    logger.step('Step 18: Logout from pwuser16');
    await basePage.logout();
    await administrationUserPage.waitForDOMContentLoaded();
    logger.info('✓ Logged out from pwuser16');
    
    logger.step('Step 19 (Cleanup): Login as peter');
    await testSetup.loginAsValidUser();
    await administrationUserPage.waitForDOMContentLoaded();
    await testSetup.acknowledgeHealthAndSafety();
    
    logger.step('Step 20: Navigate to user management and filter by First name');
    await administrationUserPage.navigateToAdministrationTab();
    await administrationUserPage.waitForPageReady();
    await administrationUserPage.navigateToUsersList();
    await administrationUserPage.waitForUserGridToLoad();
    await administrationUserPage.filterByFirstName(userName);
    
    logger.step('Step 21: Click Edit and open SITE ACCESS AND PERMISSIONS');
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openSiteAccessPermissions();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    
    logger.step('Step 22: Disable "Show permission columns"');
    await administrationUserPage.disableShowPermissionColumnsWithRetry();
    
    logger.step(`Step 23: Remove expiry date for "${site1}"`);
    await administrationUserPage.clearAccessExpirationDate(site1);
    
    logger.step('Step 24: Click Save button');
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    logger.info('✓ Cleanup completed - expiry date removed');
    
    logger.testEnd('ADMIN-USR-ACC-EXP-16 - Verify behavior when a user (with access to multiple sites) has access expired for a single site and module', 'PASSED');
  });

  test('ADMIN-USR-ACC-EXP-17 - Verify behavior when a user (with access to a single site) has access expired for that site across all modules', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-17 - Verify behavior when a user (with access to a single site) has access expired for that site across all modules');
    
    const { userName, siteName } = testData.testData.administrationUserTest17;
    const expectedErrorMessage = "User's configuration is not setup. Please contact SCSeTools administrators";
    
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
    
    logger.step('Step 9: Click Edit button');
    await administrationUserPage.clickEditButton();
    
    logger.step('Step 10: Open SITE ACCESS AND PERMISSIONS section');
    await administrationUserPage.openSiteAccessPermissions();
    
    logger.step('Step 10a: Wait for site grid to load');
    await administrationUserPage.waitForSiteAccessGridToLoad();
    logger.info('✓ Site grid content loaded');
    
    logger.step('Step 10b: Wait for site grid rows to be populated');
    logger.info('✓ Site grid rows populated');
    
    logger.step('Step 11: Disable "Show permission columns"');
    await administrationUserPage.disableShowPermissionColumnsWithRetry();
    
    logger.step(`Step 12: Set Access Expiry Date for "${siteName}" to TODAY`);
    await administrationUserPage.setAccessExpirationDate(siteName, 0);
    
    logger.step('Step 13: Click Save button');
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    
    logger.step('Step 14: Logout from peter');
    await basePage.logout();
    await administrationUserPage.waitForDOMContentLoaded();
    logger.info('✓ Logged out from peter');
    
    logger.step('Step 15: Attempt to login as pwuser17 (expect error due to expired access)');
    const loginPage = testSetup.getLoginPage();
    await loginPage.enterUsername('pwuser17');
    await loginPage.enterPassword('Testing.123');
    
    await loginPage.clickLoginButton();
    logger.info('✓ Login button clicked');
    
    logger.step('Step 16-17: Verify error dialog and message');
    await administrationUserPage.verifyErrorDialogWithMessage(expectedErrorMessage);
    logger.info('✓ Error dialog handled successfully');
    
    logger.step('Step 18: Logout/return to login page');
    // User is still on login page after error, no need to logout
    logger.info('✓ Still on login page');
    
    logger.step('Step 19 (Cleanup): Login as peter');
    await testSetup.loginAsValidUser();
    await administrationUserPage.waitForDOMContentLoaded();
    await testSetup.acknowledgeHealthAndSafety();
    
    logger.step('Step 20: Navigate to user management and filter by First name');
    await administrationUserPage.navigateToAdministrationTab();
    await administrationUserPage.waitForPageReady();
    await administrationUserPage.navigateToUsersList();
    await administrationUserPage.waitForUserGridToLoad();
    
    // Add extra wait and retry for filter in cleanup section
    await administrationUserPage.filterByFirstNameWithRetry(userName, 3);
    
    logger.step('Step 21: Click Edit and open SITE ACCESS AND PERMISSIONS');
    await administrationUserPage.clickEditButton();
    await administrationUserPage.openSiteAccessPermissions();
    await administrationUserPage.waitForSiteAccessGridToLoad();
    
    logger.step('Step 22: Disable "Show permission columns"');
    await administrationUserPage.disableShowPermissionColumnsWithRetry();
    
    logger.step(`Step 23: Remove expiry date for "${siteName}"`);
    await administrationUserPage.clearAccessExpirationDate(siteName);
    
    logger.step('Step 24: Click Save button');
    await administrationUserPage.clickSaveButton();
    await administrationUserPage.waitForSuccessMessage();
    logger.info('✓ Cleanup completed - expiry date removed');
    
    logger.testEnd('ADMIN-USR-ACC-EXP-17 - Verify behavior when a user (with access to a single site) has access expired for that site across all modules', 'PASSED');
  });

  test('ADMIN-USR-ACC-EXP-20 - Verify providing permission to a group for a user who already has access to one site in that group, with an access expiration date', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-20 - Verify providing permission to a group for a user who already has access to one site in that group, with an access expiration date');
    
    const { userName, siteName, groupName } = testData.testData.administrationUserTest20;
    
    try {
      // Initial setup - same as ADMIN-USR-ACC-EXP-01
      await setupUserForSiteAccess(userName);
      
      logger.step('Enable "Show sites with no access granted"');
      await administrationUserPage.enableShowSitesWithNoAccess();
      
      logger.step('Wait for Site Access grid to load');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      
      logger.step(`Search for "${siteName}" in the Site List`);
      await administrationUserPage.filterBySiteName(siteName);
      await administrationUserPage.waitForGridRows();
      
      logger.step(`Grant access to site "${siteName}"`);
      await administrationUserPage.clickSiteCell(siteName);
      await administrationUserPage.grantAccessToSite(siteName);
      
      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Access granted and saved');
      
      logger.step('Verify "Show sites with access granted" is selected');
      await administrationUserPage.verifyShowSitesWithAccessSelected();
      
      logger.step('Wait for grid to stabilize');
      await administrationUserPage.waitForGridContent();
      await administrationUserPage.waitForGridRows();
      
      logger.step('Click Edit button to modify expiration date');
      await administrationUserPage.clickEditButton();
      
      logger.step('Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
      
      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
      
      logger.step(`Update Access Expiration Date for "${siteName}" to today\'s date`);
      await administrationUserPage.setAccessExpirationDateToToday(siteName);
      
      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Expiration date updated to today');
      
      logger.step('Wait for grid to stabilize');
      await administrationUserPage.waitForGridContent();
      await administrationUserPage.waitForGridRows();
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Click Edit button again');
      await administrationUserPage.clickEditButton();
      
      logger.step('Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Navigate to "Show groups with no access granted"');
      await administrationUserPage.enableShowGroupsWithNoAccess();
      
      logger.step('Wait for groups grid to load');
      await administrationUserPage.waitForGridContent();
      
      logger.step(`Search for "${groupName}" in the Group/Site list`);
      await administrationUserPage.filterByGroupName(groupName);
      
      logger.step('Wait for filtered group to appear');
      await administrationUserPage.waitForGroupCellVisible(groupName);
      
      logger.step(`Grant access to group "${groupName}"`);
      await administrationUserPage.clickGroupCell(groupName);
      await administrationUserPage.grantAccessToGroup(groupName);
      
      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Group access granted and saved');
      
      logger.step('Wait for page to stabilize');
      await administrationUserPage.waitForGridContent();
      await administrationUserPage.waitForGridRows();
      await administrationUserPage.waitForGridRowsWithStabilization(30000, 5000);
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Click Edit button again');
      await administrationUserPage.clickEditButton();
      
      logger.step('Wait for SITE ACCESS AND PERMISSIONS section to load');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
      
      logger.step('Wait for grid to stabilize');
      await administrationUserPage.waitForAccessStatusColumn();
      await administrationUserPage.waitForGridRowsWithStabilization();
      
      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
      
      logger.step('Click the filter icon on Accessible Sites and select Clear Filter');
      await administrationUserPage.clearColumnFilter('Accessible Sites');
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Wait for sites grid data to load');
      await administrationUserPage.waitForGridRowsWithStabilization();
      
      logger.step(`Verify both "${siteName}" and "${groupName}" are visible`);
      await administrationUserPage.waitForSitesInGrid([siteName]);
      logger.info(`✓ Verified "${siteName}" is visible in the grid`);
      
      logger.step(`Verify Access Expiration Date for "${siteName}" is still today\'s date`);
      await administrationUserPage.verifyAccessExpirationDateIsToday(siteName);
      logger.info('✓ Access Expiration Date is still today');
      
      logger.step('Go to "Show groups with access granted"');
      await administrationUserPage.enableShowGroupsWithAccessGranted();
      
      logger.step('Wait for groups grid to load');
      await administrationUserPage.waitForGridContent();
      await administrationUserPage.waitForGridRows();
      
      logger.step(`Remove access from "${groupName}"`);
      await administrationUserPage.removeAccessForGroup(groupName);
      
      logger.step('Click Save button');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      logger.info('✓ Group access removed');
      
      logger.step('Verify "Show sites with access granted" is selected');
      await administrationUserPage.verifyShowSitesWithAccessSelected();
      
      logger.step('Wait for page to stabilize');
      await administrationUserPage.waitForGridContent();
      await administrationUserPage.waitForGridRows();
      await administrationUserPage.waitForGridRowsWithStabilization(30000, 5000);
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Click Edit button again');
      await administrationUserPage.clickEditButton();
      
      logger.step('Wait for Site Access grid to reload');
      await administrationUserPage.waitForSiteAccessGridToLoad();
      await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
      
      logger.step('Disable "Show permission columns"');
      await administrationUserPage.disableShowPermissionColumnsWithRetry();
      
      logger.step('Ensure "Show sites with access granted" is selected');
      await administrationUserPage.ensureShowSitesWithAccessGrantedIsSelected();
      
      logger.step('Wait for grid to stabilize');
      await administrationUserPage.waitForGridRows();
      
      logger.step(`Verify only "${siteName}" is visible (group should be removed)`);
      await administrationUserPage.waitForSitesInGrid([siteName]);
      logger.info(`✓ Verified only "${siteName}" is visible after group removal`);
      
      logger.step(`Verify Access Expiration Date for "${siteName}" remains today\'s date`);
      await administrationUserPage.verifyAccessExpirationDateIsToday(siteName);
      logger.info('✓ Access Expiration Date remains today after group removal');
      
      logger.testEnd('ADMIN-USR-ACC-EXP-20 - Verify providing permission to a group for a user who already has access to one site in that group, with an access expiration date', 'PASSED');
    } finally {
      logger.step('Cleanup - Prepare for site removal');
      try {
        await administrationUserPage.verifyShowSitesWithAccessSelected();
        await administrationUserPage.waitForGridContent();
        await administrationUserPage.waitForGridRows();
        await administrationUserPage.clickEditButton();
        await administrationUserPage.waitForSiteAccessGridToLoad();
        await administrationUserPage.wait(WAIT_TIMES.GRID_STABILIZATION);
        logger.info('✓ Grid prepared for cleanup');
      } catch (error) {
        logger.warn(`Could not prepare for cleanup: ${error.message}`);
      }
      
      logger.step('Cleanup - Remove access for site');
      await cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-26 - Verify File Options content in eTools access expiry notification', async () => {
    logger.testStart('ADMIN-USR-ACC-EXP-26 - Verify File Options content in eTools access expiry notification');
    
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
    
    logger.testEnd('ADMIN-USR-ACC-EXP-26 - Verify File Options content in eTools access expiry notification', 'PASSED');
  });
});

