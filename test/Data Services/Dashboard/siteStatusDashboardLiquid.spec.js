const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const logger = require('../../../utils/logger');
const helper = require('../../../utils/helper');
const testData = require('../../../data/testData.json');

// Wait time constants for explicit timing requirements
const WAIT_TIMES = {
  SHORT_DELAY: 500,
  FILTER_DELAY: 1000,
  MODAL_DELAY: 1500,
  GRID_STABILIZATION: 2000,
};

test.describe('SCS Site Status Dashboard - Liquid Levels Tests', () => {
  let testSetup;
  let loginPage;
  let siteStatusDashboardPage;

  test.beforeEach(async ({ page }) => {
    testSetup = new TestSetup();
    await testSetup.initialize(page);
    loginPage = testSetup.getLoginPage();
    siteStatusDashboardPage = testSetup.getSiteStatusDashboardPage();
  });

  test('DS-SITE-STATUS-29 - Verify clicking on the Map column navigates the user to the DS Filter Map page', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-29 - Verify clicking on the Map column navigates the user to the DS Filter Map page');

    const siteName = 'Demo Site';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to the Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Liquid Levels tab');

    logger.step('Filter by Site Name "Demo Site"');
    await siteStatusDashboardPage.filterBySiteNameExact(siteName);
    logger.info(`✓ Site Name filter applied: ${siteName}`);

    logger.step('Click the liquid levels map icon');
    await siteStatusDashboardPage.clickLiquidLevelsMapIcon();

    logger.step('Wait for navigation to complete');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Navigation completed');

    logger.step('Verify Filter Map toolbar item is active');
    await siteStatusDashboardPage.verifyFilterMapToolbarActive();

    logger.step('Verify Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(siteName);

    logger.step('Verify date range combobox is visible and default is current month');
    const dateRangeCombobox = siteStatusDashboardPage.getDateRangeCombobox();
    await expect(dateRangeCombobox).toBeVisible();

    await siteStatusDashboardPage.verifyAndAssertDateRangeIsCurrentMonth(dateRangeCombobox, expect);

    logger.step('Verify satellite imagery option is visible');
    await expect(siteStatusDashboardPage.getSatelliteImageryOption()).toBeVisible();
    logger.info('✓ Satellite imagery option is visible');

    logger.step('Verify street map option is visible');
    await expect(siteStatusDashboardPage.getStreetMapOption()).toBeVisible();
    logger.info('✓ Street map option is visible');

    logger.step('Verify MAP text is visible');
    await expect(siteStatusDashboardPage.getMapText()).toBeVisible();
    logger.info('✓ MAP text is visible');

    logger.step('Verify Filter is visible');
    const filterLocator = await siteStatusDashboardPage.getFilterTextLocator();
    await expect(filterLocator).toBeVisible();
    logger.info('✓ Filter text is visible');

    logger.testEnd('DS-SITE-STATUS-29 - Verify clicking on the Map column navigates the user to the DS Filter Map page', 'PASSED');
  });

  test('DS-SITE-STATUS-30 - Verify clicking on the Contact column opens the Contacts popup', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-30 - Verify clicking on the Contact column opens the Contacts popup');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    const { contactIconClass, expectedTabs } = testData.testData.siteStatusDashboard;
    const siteName = 'Demo Site';

    logger.step('Navigate to the Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // Step 8: Wait for network to be idle
    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Liquid Levels tab');

    // Step 9: Filter by Site Name "Demo Site"
    logger.step('Step 9: Filter by Site Name "Demo Site"');
    await siteStatusDashboardPage.filterBySiteNameExact(siteName);
    logger.info(`✓ Site Name saved as: ${siteName}`);

    // Step 10: Click the first contact icon
    logger.step('Step 10: Click the first contact icon');
    await siteStatusDashboardPage.clickLiquidLevelsContactIcon();

    // Step 11: Wait for network to be idle
    logger.step('Step 11: Wait for network to be idle');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.FILTER_DELAY);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});
    logger.info('✓ Network is idle after clicking contact icon');

    logger.step('Step 12: Verify a popup/modal is opened');
    await siteStatusDashboardPage.verifyDialogHeaderVisible();
    logger.info('✓ Contacts popup is displayed');

    logger.step(`Step 13: Verify popup title is "Site Contacts for site: ${siteName}"`);
    await siteStatusDashboardPage.verifySiteContactsDialog(siteName);
    logger.info(`✓ Popup title contains "Site Contacts for site: ${siteName}"`);

    logger.step('Step 14: Verify popup contains tabs: DATA APPROVERS, USERS WITH ACCESS, CONTACTS');
    await siteStatusDashboardPage.verifyPopupTabsAreVisible(expectedTabs);
    logger.info('✓ All expected tabs are visible in the popup');

    logger.testEnd('DS-SITE-STATUS-30 - Verify clicking on the Contact column opens the Contacts popup', 'PASSED');
  });

  test('DS-SITE-STATUS-31 - Verify the content in the Contacts popup', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-31 - Verify the content in the Contacts popup');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    const {
      dataApproversColumns, usersWithAccessColumns, contactsColumns, tabLabels,
    } = testData.testData.siteStatusDashboard;

    logger.step('Navigate to the Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // Step 8: Wait for network to be idle
    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Liquid Levels tab');

    // Filter by Site Name "aqabmtestsite1"
    logger.step('Filter by Site Name: aqabmtestsite1');
    await siteStatusDashboardPage.filterLiquidLevelsBySiteName('aqabmtestsite1');
    const filteredSiteName = 'aqabmtestsite1';

    // Verify only filtered results are displayed
    logger.step('Verify only filtered results are displayed');
    await siteStatusDashboardPage.verifyLiquidLevelsFilteredResults(filteredSiteName);

    // Step 10: Click the first contact icon
    logger.step('Step 10: Click the first contact icon');
    await siteStatusDashboardPage.clickLiquidLevelsContactIcon();

    // Step 11: Wait for network to be idle
    logger.step('Step 11: Wait for network to be idle');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after clicking contact icon');

    // Step 12: Verify a popup/modal is opened
    logger.step('Step 12: Verify a popup/modal is opened');
    await expect(siteStatusDashboardPage.getDialogHeader()).toBeVisible();
    logger.info('✓ Contacts popup is displayed');

    // Step 13: Verify the popup title contains "Site Contacts for site: <siteName>"
    logger.step(`Step 13: Verify popup title is "Site Contacts for site: ${filteredSiteName}"`);
    await expect(siteStatusDashboardPage.getSiteContactsPopupTitle(filteredSiteName)).toBeVisible();
    logger.info(`✓ Popup title contains "Site Contacts for site: ${filteredSiteName}"`);

    // Step 14: Verify Columns - Data Approvers Tab (Default Tab)
    logger.step('Step 14: Verify columns in Data Approvers tab (default)');
    await siteStatusDashboardPage.getTabLocator('DATA APPROVERS').waitFor({ state: 'visible' });
    await siteStatusDashboardPage.verifyColumnHeaders(tabLabels.dataApprovers, dataApproversColumns);
    logger.info('✓ Data Approvers tab columns verified');

    // Step 15: Verify Columns - USERS WITH ACCESS Tab
    logger.step('Step 15: Verify columns in USERS WITH ACCESS tab');
    await siteStatusDashboardPage.clickTab('USERS WITH ACCESS');
    await siteStatusDashboardPage.verifyColumnHeaders(tabLabels.usersWithAccess, usersWithAccessColumns);
    logger.info('✓ Users With Access tab columns verified');

    // Step 16: Verify Columns - CONTACTS Tab
    logger.step('Step 16: Verify columns in CONTACTS tab');
    await siteStatusDashboardPage.clickTab('CONTACTS');
    await siteStatusDashboardPage.verifyColumnHeaders(tabLabels.contacts, contactsColumns);
    logger.info('✓ Contacts tab columns verified');

    logger.testEnd('DS-SITE-STATUS-31 - Verify the content in the Contacts popup', 'PASSED');
  });

  test('DS-SITE-STATUS-32 - Verify Last Logon Date Format in Contacts popup', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-32 - Verify Last Logon Date Format in Contacts popup');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    const { dateTimePattern } = testData.testData.siteStatusDashboard;
    const siteName = 'Demo Site';

    logger.step('Navigate to the Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // Step 8: Wait for network to be idle
    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Liquid Levels tab');

    // Step 9: Filter by Site Name "Demo Site"
    logger.step('Step 9: Filter by Site Name "Demo Site"');
    await siteStatusDashboardPage.filterBySiteNameExact(siteName);
    logger.info(`✓ Site Name saved as: ${siteName}`);

    // Step 10: Click the first contact icon
    logger.step('Step 10: Click the first contact icon');
    await siteStatusDashboardPage.clickLiquidLevelsContactIcon();

    // Step 11: Wait for network to be idle
    logger.step('Step 11: Wait for network to be idle');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.FILTER_DELAY);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});
    logger.info('✓ Network is idle after clicking contact icon');

    // Step 12: Verify a popup/modal is opened
    logger.step('Step 12: Verify a popup/modal is opened');
    await page.waitForTimeout(WAIT_TIMES.SHORT_DELAY);
    await siteStatusDashboardPage.verifyDialogHeaderVisible();
    logger.info('✓ Contacts popup is displayed');

    // Step 13: Verify the popup title contains "Site Contacts for site: <siteName>"
    logger.step(`Step 13: Verify popup title is "Site Contacts for site: ${siteName}"`);
    await siteStatusDashboardPage.verifySiteContactsDialog(siteName);
    logger.info(`✓ Popup title contains "Site Contacts for site: ${siteName}"`);

    // Step 14: Grab the first visible value from Last Logon column in Data Approvers tab
    logger.step('Step 14: Grab first value from Last Logon column in Data Approvers tab');
    await page.waitForTimeout(WAIT_TIMES.SHORT_DELAY);
    const lastLogonValue = await siteStatusDashboardPage.getLastLogonValue();

    // Step 15: Verify the date-time format matches MMM DD, YYYY HH:MM AM/PM
    logger.step('Step 15: Verify Last Logon value matches format: MMM DD, YYYY HH:MM AM/PM');

    // Verify value is not empty or null
    expect(lastLogonValue).toBeTruthy();
    expect(lastLogonValue.trim().length).toBeGreaterThan(0);
    logger.info('✓ Last Logon value is not empty');

    // Regex pattern from test data: MMM DD, YYYY HH:MM AM/PM (e.g., "Jan 16, 2026 4:29 PM")
    const datePattern = new RegExp(dateTimePattern);
    const isValidFormat = datePattern.test(lastLogonValue.trim());

    logger.info(`Date-time format validation: ${isValidFormat}`);
    expect(isValidFormat).toBeTruthy();
    logger.info(`✓ Last Logon value "${lastLogonValue}" matches expected format MMM DD, YYYY HH:MM AM/PM`);

    logger.testEnd('DS-SITE-STATUS-32 - Verify Last Logon Date Format in Contacts popup', 'PASSED');
  });

  test('DS-SITE-STATUS-33 - Verify user can close the Contacts popup using the Close button', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-33 - Verify user can close the Contacts popup using the Close button');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    const siteName = 'Demo Site';
    const expectedPopupTitle = `Site Contacts for site: ${siteName}`;

    logger.step('Navigate to the Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // Step 8: Wait for network to be idle
    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Liquid Levels tab');

    // Step 9: Filter by Site Name "Demo Site"
    logger.step('Step 9: Filter by Site Name "Demo Site"');
    await siteStatusDashboardPage.filterBySiteNameExact(siteName);
    logger.info(`✓ Site Name saved as: ${siteName}`);

    // Step 10: Click the first contact icon
    logger.step('Step 10: Click the first contact icon');
    await siteStatusDashboardPage.clickLiquidLevelsContactIcon();

    // Step 11: Wait for network to be idle
    logger.step('Step 11: Wait for network to be idle');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.FILTER_DELAY);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});
    logger.info('✓ Network is idle after clicking contact icon');

    // Step 12: Verify a popup/modal is opened
    logger.step('Step 12: Verify a popup/modal is opened');
    await page.waitForTimeout(WAIT_TIMES.SHORT_DELAY);
    await siteStatusDashboardPage.verifyDialogHeaderVisible();
    logger.info('✓ Site Contacts popup is opened');

    // Step 13: Verify the popup title contains "Site Contacts for site: <siteName>"
    logger.step(`Step 13: Verify popup title is "${expectedPopupTitle}"`);
    await siteStatusDashboardPage.verifySiteContactsDialog(expectedPopupTitle.replace('Site Contacts for site: ', ''));
    logger.info(`✓ Popup title verified: "${expectedPopupTitle}"`);

    // Step 14: Click the Close button on the popup
    logger.step('Step 14: Click the Close button on the popup');
    await siteStatusDashboardPage.clickCloseButton();

    // Step 15 & 16: Verify the Site Contacts popup is closed
    logger.step('Step 15 & 16: Verify the Site Contacts popup is closed');
    await siteStatusDashboardPage.verifyContactsPopupNotVisible();
    logger.info('✓ Site Contacts popup is closed');
    logger.info(`✓ Popup title "${expectedPopupTitle}" is not visible`);

    logger.testEnd('DS-SITE-STATUS-33 - Verify user can close the Contacts popup using the Close button', 'PASSED');
  });

  test('DS-SITE-STATUS-34 - Verify Grid Sorting by Column Name in Liquid Levels', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-34 - Verify Grid Sorting by Column Name in Liquid Levels');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to the Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Liquid Levels tab');

    // Validate sorting for specified columns
    const columnsToCheck = ['Site Name', 'City', 'State', 'Office', 'Project Manager'];
    await siteStatusDashboardPage.verifyLiquidLevelsGridSorting(columnsToCheck, expect);

    logger.testEnd('DS-SITE-STATUS-34 - Verify Grid Sorting by Column Name in Liquid Levels', 'PASSED');
  });

  test('DS-SITE-STATUS-35 - Verify Grid Filtering by Column Names in Liquid Levels', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-35 - Verify Grid Filtering by Column Names in Liquid Levels');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // STEP 1: Filter by Client column
    logger.step('Filter by Client column: Search "Demo" and click OK');
    await siteStatusDashboardPage.clickLiquidLevelsFilterIcon('Client');
    await page.waitForTimeout(WAIT_TIMES.MODAL_DELAY);

    const filterSearchInput = siteStatusDashboardPage.getFilterMenuSearchInput();
    await filterSearchInput.waitFor({ state: 'visible', timeout: 10000 });
    await filterSearchInput.fill('Demo');
    await page.waitForTimeout(WAIT_TIMES.MODAL_DELAY);

    const okButton = siteStatusDashboardPage.getOkButton();
    await okButton.waitFor({ state: 'visible', timeout: 10000 });
    await okButton.click();
    await page.waitForTimeout(WAIT_TIMES.MODAL_DELAY);

    logger.step('Verify all visible rows have Client = Demo and Project Manager = Demo PM');
    await siteStatusDashboardPage.verifyAllLiquidLevelsRowsHaveValue('Client', 'Demo');
    await siteStatusDashboardPage.verifyAllLiquidLevelsRowsHaveValue('Project Manager', 'Demo PM');

    // STEP 2: Filter by Site Name column
    logger.step('Filter by Site Name column: Type "Demo Site", click Select All, then select only Demo Site');
    await siteStatusDashboardPage.clickLiquidLevelsFilterIcon('Site Name');
    await page.waitForTimeout(WAIT_TIMES.MODAL_DELAY);

    await siteStatusDashboardPage.applyExcelFilter('Demo Site');
    await page.waitForLoadState('networkidle');

    logger.step('Verify grid displays only one record with expected values');
    const visibleRows = await siteStatusDashboardPage.getVisibleRowCount();
    expect(visibleRows).toBe(1);
    logger.info('✓ Grid displays exactly 1 row after Site Name filter');

    const siteNameValues = await siteStatusDashboardPage.getLiquidLevelsColumnValuesByName('Site Name');
    const clientValuesAfter = await siteStatusDashboardPage.getLiquidLevelsColumnValuesByName('Client');
    const pmValuesAfter = await siteStatusDashboardPage.getLiquidLevelsColumnValuesByName('Project Manager');

    expect(siteNameValues.length).toBe(1);
    expect(siteNameValues[0]).toBe('Demo Site');
    logger.info('✓ Site Name = Demo Site');

    expect(clientValuesAfter.length).toBe(1);
    expect(clientValuesAfter[0]).toBe('Demo');
    logger.info('✓ Client = Demo');

    expect(pmValuesAfter.length).toBe(1);
    expect(pmValuesAfter[0]).toBe('Demo PM');
    logger.info('✓ Project Manager = Demo PM');

    logger.testEnd('DS-SITE-STATUS-35 - Verify Grid Filtering by Column Names in Liquid Levels', 'PASSED');
  });

  test('DS-SITE-STATUS-37 - Verify clicking on Reading Approval Required column navigates to Review Edit in Liquid Levels', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-37 - Verify clicking on Reading Approval Required column navigates to Review Edit in Liquid Levels');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Liquid Levels tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.applyLiquidLevelsSiteNameFilter(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    // Step 1: Locate Reading Approval Required column and capture site name
    logger.step('Locate Reading Approval Required column and find first row with ng-star-inserted');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });

    const { siteName, row: targetRow } = await siteStatusDashboardPage.findFirstLiquidLevelsNgStarInsertedInColumn('Reading Approval Required');
    const readingApprovalHeader = siteStatusDashboardPage.getLiquidLevelsHeader('Reading Approval Required');
    const readingApprovalColIndex = await siteStatusDashboardPage.getColumnIndex(readingApprovalHeader);
    const targetReadingApprovalCell = targetRow.locator('td').nth(readingApprovalColIndex);

    expect(siteName).toBeTruthy();
    expect(targetReadingApprovalCell).toBeTruthy();
    logger.info(`✓ Captured Site Name: ${siteName}`);

    // Step 2: Double-click on the Reading Approval Required value
    logger.step('Double-click on the Reading Approval Required value');
    await targetReadingApprovalCell.dblclick();

    // Step 3: Wait until REPORT INFORMATION section is visible
    logger.step('Wait until REPORT INFORMATION section is visible');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle').catch(() => logger.info('Network did not go idle, continuing...'));
    await siteStatusDashboardPage.verifyReportInformationHeader();
    logger.info('✓ Review Edit page loaded successfully');

    // Validation 1: Verify Review Edit toolbar item is active
    logger.step('Verify Review Edit toolbar item is active');
    await siteStatusDashboardPage.verifyReviewEditToolbarActive();

    // Validation 2: Verify Site Name is visible on the page
    logger.step('Verify Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameDropdown(siteName);

    // Validation 3: Verify date range is within one year back from current date
    logger.step('Verify date range is within one year back from current date');
    await siteStatusDashboardPage.verifyDateRangeCombobox();

    const dateRangeCombobox = siteStatusDashboardPage.getDateRangeCombobox();
    const dateRangeText = await dateRangeCombobox.inputValue().catch(() => '');
    logger.info(`Date range value: ${dateRangeText}`);

    const dateValidation = helper.verifyDateRangeWithinOneYear(dateRangeText);
    expect(dateValidation.isValid).toBeTruthy();
    logger.info(`✓ ${dateValidation.message}`);

    // Validation 4: Verify "Liquid Level" is selected in Select Preset dropdown
    logger.step('Verify "Liquid Level" is selected in Select Preset dropdown');
    await siteStatusDashboardPage.verifyPresetDropdown('Liquid Level');

    // Validation 5: Scroll down and verify "Unapproved only" radio button is selected
    logger.step('Scroll down and verify "Unapproved only" radio button is selected');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForLoadState('networkidle');

    await siteStatusDashboardPage.verifyUnapprovedOnlyRadioVisibleAndSelected(expect);

    // Validation 6: Verify Data Services checkboxes are selected (sample port, well)
    logger.step('Verify Data Services checkboxes are selected');
    const dataServices = ['sample port', 'well'];
    await siteStatusDashboardPage.verifyDataServicesCheckboxes(dataServices);

    // Validation 7: Verify READINGS grid is visible
    logger.step('Verify READINGS grid is visible');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForLoadState('networkidle');

    await siteStatusDashboardPage.verifyReadingsLabel();
    logger.info('✓ READINGS grid is visible');

    // Validation 8: Verify readingGrid and readingGrid_content_table are visible
    logger.step('Verify readingGrid and readingGrid_content_table are visible');
    await siteStatusDashboardPage.verifyReadingGridVisible();
    logger.info('✓ readingGrid is visible');
    logger.info('✓ readingGrid_content_table is visible');

    logger.testEnd('DS-SITE-STATUS-37 - Verify clicking on Reading Approval Required column navigates to Review Edit in Liquid Levels', 'PASSED');
  });

  test('DS-SITE-STATUS-38 - Verify Reading Approval Required count equals Liquid Level preset count in Review Edit', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-38 - Verify Reading Approval Required count equals Liquid Level preset count in Review Edit');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    // Navigate to Liquid Levels tab
    logger.step('Navigate to Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // Filter by Site Name
    logger.step('Filter by Site Name: aqabmtestsite1');

    // Wait for grid to load
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => logger.info('Network did not go idle, continuing...'));

    // Apply Site Name filter: aqabmtestsite1
    await siteStatusDashboardPage.applyLiquidLevelsSiteNameFilter('aqabmtestsite1');
    logger.info('✓ Site Name filter applied: aqabmtestsite1');

    // Step 1: Capture Reading Approval Required Count
    logger.step('Locate Reading Approval Required column and search for first count > 0');

    // Wait for grid to load completely
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => logger.info('Network did not go idle, continuing...'));

    // Get column indexes from Liquid Levels grid
    const readingApprovalHeader = siteStatusDashboardPage.getLiquidLevelsHeader('Reading Approval Required');
    await readingApprovalHeader.waitFor({ state: 'visible', timeout: 10000 });
    const readingApprovalColIndex = await siteStatusDashboardPage.getColumnIndex(readingApprovalHeader);
    logger.info(`Reading Approval Required column index: ${readingApprovalColIndex}`);

    const siteNameHeader = siteStatusDashboardPage.getLiquidLevelsHeader('Site Name');
    await siteNameHeader.waitFor({ state: 'visible', timeout: 10000 });
    const siteNameColIndex = await siteStatusDashboardPage.getColumnIndex(siteNameHeader);
    logger.info(`Site Name column index: ${siteNameColIndex}`);

    // Search through rows to find first Reading Approval Required count > 0
    logger.step('Search for first row with Reading Approval Required count > 0');

    const result = await siteStatusDashboardPage.findFirstRowWithReadingApprovalGreaterThanZero(readingApprovalColIndex, siteNameColIndex);
    expect(result).toBeTruthy();

    const readingApprovalRequiredCount = result.count;
    const { siteName } = result;
    const targetRow = result.row;

    logger.info(`✓ Found Reading Approval Required count: ${readingApprovalRequiredCount} in row ${result.rowIndex + 1}`);
    logger.info(`✓ Captured Site Name: ${siteName}`);

    expect(readingApprovalRequiredCount).toBeGreaterThan(0);
    expect(siteName).toBeTruthy();
    expect(targetRow).toBeTruthy();

    // Step 2: Navigate to Review Edit
    logger.step('Double-click on the Reading Approval Required value');
    const targetReadingApprovalCell = targetRow.locator('td').nth(readingApprovalColIndex);
    await targetReadingApprovalCell.dblclick();

    // Wait for navigation/network idle after double-click
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});

    logger.step('Wait until REPORT INFORMATION section is visible');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => logger.info('Network did not go idle, continuing...'));
    await siteStatusDashboardPage.verifyReportInformationHeader();
    logger.info('✓ Review Edit page loaded successfully');

    // Validation 1: Verify Review Edit toolbar item is active
    logger.step('Verify Review Edit toolbar item is active');
    await siteStatusDashboardPage.verifyReviewEditToolbarActive();
    logger.info('✓ Review Edit toolbar item is selected');

    // Validation 2: Verify Site Name is visible on the page
    logger.step('Verify Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameDropdown(siteName);
    logger.info(`✓ Site Name "${siteName}" is visible on Review Edit page`);

    // Step 3: Get READINGS count for Liquid Level preset
    logger.step('Get READINGS count for Liquid Level preset');

    // Wait for page to load
    await page.waitForLoadState('networkidle').catch(() => logger.info('Network did not go idle, continuing...'));

    // Click Create Report to load Liquid Level data
    logger.step('Click Create Report to load Liquid Level preset data');
    await siteStatusDashboardPage.clickCreateReport();

    // Wait for data to load
    await page.waitForLoadState('networkidle').catch(() => logger.info('Network did not go idle, continuing...'));
    await page.waitForLoadState('networkidle');

    // Grab the count on the right of READINGS and save as readingCount
    logger.step('Grab count on the right of READINGS and save as readingCount');
    const readingCount = await siteStatusDashboardPage.getReadingsCount();
    logger.info(`✓ Liquid Level READINGS count: ${readingCount}`);

    // Step 4: Final validation - Verify readingCount === readingApprovalRequiredCount
    logger.step('Validate Reading Approval Required count equals READINGS count');
    logger.info(`READINGS count: ${readingCount}`);
    logger.info(`Reading Approval Required count: ${readingApprovalRequiredCount}`);

    expect(readingCount).toBe(readingApprovalRequiredCount);
    logger.info(`✓ Reading Approval Required count (${readingApprovalRequiredCount}) equals Liquid Level READINGS count (${readingCount})`);

    logger.testEnd('DS-SITE-STATUS-38 - Verify Reading Approval Required count equals Liquid Level preset count in Review Edit', 'PASSED');
  });

  test('DS-SITE-STATUS-40 - Verify clicking on Liq Lvl Pts Not Monitored column navigates to Point Specific Monitoring Report in Liquid Levels', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-40 - Verify clicking on Liq.Lvl Pts Not Monitored column navigates to Point Specific Monitoring Report in Liquid Levels');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    // Navigate to Liquid Levels tab
    logger.step('Navigate to Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // Filter by Site Name "aqabmtestsite1"
    logger.step('Filter by Site Name: aqabmtestsite1');
    await siteStatusDashboardPage.filterLiquidLevelsBySiteName('aqabmtestsite1');
    const filteredSiteName = 'aqabmtestsite1';

    // Verify only filtered results are displayed
    logger.step('Verify only filtered results are displayed');
    await siteStatusDashboardPage.verifyLiquidLevelsFilteredResults(filteredSiteName);

    // Step 2: Locate Liq.Lvl Pts Not Monitored column and capture value
    logger.step('Locate Liq.Lvl Pts Not Monitored column and capture value from span');
    const { value: liqLvlPtsNotMonitoredValue, siteName: savedSiteName, cell: targetCell } = await siteStatusDashboardPage.captureLiqLvlPtsNotMonitored();
    expect(liqLvlPtsNotMonitoredValue).toBeTruthy();
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();

    // Step 3: Double-click on the Liq Lvl Pts Not Monitored value
    logger.step('Double-click on the Liq.Lvl Pts Not Monitored value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);
    await page.waitForLoadState('networkidle');

    // Step 4: Navigation Validation
    logger.step('Verify page contains "Point Specific Monitoring"');
    await siteStatusDashboardPage.waitForPointsSpecificMonitoringReport();

    logger.step('Verify Operations toolbar item is active');
    await siteStatusDashboardPage.verifyOperationsToolbarActive();

    // Step 5: Page Validations
    logger.step('Verify saved Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(savedSiteName);

    logger.step('Verify Report Date field is defaulted to current day');
    await siteStatusDashboardPage.verifyDateFieldDefaulted();

    // Step 6: Point Types Validation
    logger.step('Verify "well" and "sample port" checkboxes are checked under Point Types');
    await siteStatusDashboardPage.verifyPointTypesChecked(['well', 'sample port']);

    // Step 7: Report Content Validation
    logger.step('Verify report contains required content');
    const requiredContent = [
      'Point Specific Monitoring',
      'Report Date :',
      'Site Name :',
      'Date Range :',
      'Monitoring Requirement',
    ];
    await siteStatusDashboardPage.verifyReportContent(requiredContent);

    logger.testEnd('DS-SITE-STATUS-40 - Verify clicking on Liq Lvl Pts Not Monitored column navigates to Point Specific Monitoring Report in Liquid Levels', 'PASSED');
  });

  test('DS-SITE-STATUS-41 - Verify clicking on Missed Readings column navigates to Missed Readings page in Liquid Levels', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-41 - Verify clicking on Missed Readings column navigates to Missed Readings page in Liquid Levels');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // Step 1: Filter by Site Name "aqabmtestsite1"
    logger.step('Filter by Site Name: aqabmtestsite1');
    await siteStatusDashboardPage.filterLiquidLevelsBySiteName('aqabmtestsite1');

    // Step 2: Locate Missed Readings column and capture value
    logger.step('Locate Missed Readings column and capture value from span');
    const { valueText: missedReadingsValue, siteName: savedSiteName, cell: targetCell } = await siteStatusDashboardPage.captureMissedReadingsValueFromLiquidLevels();
    expect(missedReadingsValue).toBeTruthy();
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();

    // Step 3: Double-click on the Missed Readings value
    logger.step('Double-click on the Missed Readings value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);
    await page.waitForLoadState('networkidle');

    // Step 4: Navigation Validation
    logger.step('Verify page contains "MISSED READINGS"');
    await siteStatusDashboardPage.waitForMissedReadingsPage();

    logger.step('Verify Missed Reading toolbar item is active');
    await siteStatusDashboardPage.verifyMissedReadingToolbarActive();

    // Step 5: Page Validations
    logger.step('Verify saved Site Name is visible in the Site Name dropdown');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(savedSiteName);

    // Step 6: Verify "Show unresolved only" checkbox is checked
    logger.step('Verify "Show unresolved only" checkbox is checked');
    const isChecked = await siteStatusDashboardPage.verifyShowUnresolvedOnlyChecked();
    expect(isChecked).toBeTruthy();

    logger.testEnd('DS-SITE-STATUS-41 - Verify clicking on Missed Readings column navigates to Missed Readings page in Liquid Levels', 'PASSED');
  });

  test('DS-SITE-STATUS-42 - Verify the count in the Missed Readings column matches the total number of records on the Missed Readings page (Liquid Levels)', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-42 - Verify the count in the Missed Readings column matches the total number of records on the Missed Readings page (Liquid Levels)');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Liquid Levels tab');
    await siteStatusDashboardPage.navigateToLiquidLevelsTab();

    // Step 1: Filter by Site Name "aqabmtestsite1"
    logger.step('Filter by Site Name: aqabmtestsite1');
    await siteStatusDashboardPage.filterBySiteNameExact('aqabmtestsite1');
    const filteredSiteName = 'aqabmtestsite1';

    // Verify only filtered results are displayed
    logger.step('Verify only filtered results are displayed');
    await siteStatusDashboardPage.verifyLiquidLevelsFilteredResults(filteredSiteName);

    // Capture current date range from dashboard
    logger.step('Capture date range value from dashboard');
    const dateRangeCombobox = siteStatusDashboardPage.getDateRangeCombobox();
    let dateRangeText = '';
    try {
      dateRangeText = await dateRangeCombobox.inputValue({ timeout: 5000 });
      logger.info(`Dashboard date range: ${dateRangeText}`);
    } catch (error) {
      logger.warn(`Could not capture date range: ${error.message}`);
      dateRangeText = 'Unknown';
    }

    // Step 2: Locate Missed Readings column and capture value
    logger.step('Locate Missed Readings column and capture value from span');
    const {
      valueText: missedReadingsValueText, valueNumber: missedReadingsValue, siteName: savedSiteName, cell: targetCell,
    } = await siteStatusDashboardPage.captureMissedReadingsValueFromLiquidLevels();

    expect(missedReadingsValue).toBeGreaterThan(0);
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();

    // Step 3: Double-click on the Missed Readings value
    logger.step('Double-click on the Missed Readings value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);

    // Wait until network is idle
    logger.step('Wait until network is idle');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });

    // Step 4: Navigation Validation
    logger.step('Verify page contains "MISSED READINGS"');
    await siteStatusDashboardPage.waitForMissedReadingsPage();

    // Step 5: Wait for grid data to fully load
    logger.step('Wait for grid data to fully load');
    await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {
      logger.info('Network did not go idle after 120s, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.GRID_STABILIZATION);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});

    // Step 6: Pagination Summary Validation
    logger.step('Locate pagination summary element and extract total count');
    const paginationCount = await siteStatusDashboardPage.getPaginationCount();

    // Step 7: Assert that pagination count equals missedReadingsValue
    logger.step('Verify pagination count equals Missed Readings value from dashboard');
    logger.info(`Missed Readings value from dashboard: ${missedReadingsValue} (Date range: ${dateRangeText})`);
    logger.info(`Pagination count from Missed Readings page: ${paginationCount}`);

    // Check if counts match
    if (paginationCount === missedReadingsValue) {
      logger.info(`✓ Pagination count (${paginationCount}) matches Missed Readings value (${missedReadingsValue})`);
    } else {
      logger.warn(`⚠ COUNT MISMATCH: Dashboard shows ${missedReadingsValue} for date range "${dateRangeText}", but detail page shows ${paginationCount} total records`);
      logger.warn('This indicates the detail page does NOT respect the dashboard\'s date range filter');
      logger.warn(`Expected: ${missedReadingsValue}, Actual: ${paginationCount}, Difference: ${Math.abs(paginationCount - missedReadingsValue)}`);
    }

    expect(paginationCount).toBe(missedReadingsValue);

    logger.testEnd('DS-SITE-STATUS-42 - Verify the count in the Missed Readings column matches the total number of records on the Missed Readings page (Liquid Levels)', 'PASSED');
  });
});
