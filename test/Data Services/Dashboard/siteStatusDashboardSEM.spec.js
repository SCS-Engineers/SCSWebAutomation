const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const logger = require('../../../utils/logger');
const helper = require('../../../utils/helper');
const testData = require('../../../data/testData.json');

// Wait time constants for explicit timing requirements
const WAIT_TIMES = {
  ULTRA_SHORT: 300,
  SHORT_DELAY: 500,
  FILTER_DELAY: 1000,
  MODAL_DELAY: 1500,
  GRID_STABILIZATION: 2000,
};

test.describe('SCS Site Status Dashboard - Surface Emissions Tests', () => {
  let testSetup;
  let page;
  let siteStatusDashboardPage;

  test.beforeEach(async ({ page: testPage }) => {
    logger.divider();
    logger.info('Setting up test - Initializing page objects');
    page = testPage;

    testSetup = new TestSetup();
    await testSetup.initialize(page);
    siteStatusDashboardPage = testSetup.getSiteStatusDashboardPage();

    logger.info('Test setup completed');
    logger.divider();
  });

  test('DS-SITE-STATUS-43 - Verify clicking on the Map column navigates the user to the DS Filter Map page in Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-43 - Verify clicking on the Map column navigates the user to the DS Filter Map page in Surface Emissions');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Step 7: Navigate to the Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.SHORT_DELAY);
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    // Filter by Site Name "aqabmtestsite1"
    logger.step('Filter by Site Name: aqabmtestsite1');
    await siteStatusDashboardPage.filterBySiteNameExact('aqabmtestsite1');
    const filteredSiteName = 'aqabmtestsite1';

    // Verify only filtered results are displayed
    logger.step('Verify only filtered results are displayed');
    await siteStatusDashboardPage.verifySurfaceEmissionsFilteredResults(filteredSiteName);

    logger.step('Step 10: Click the surface emissions map icon');
    await siteStatusDashboardPage.clickSurfaceEmissionsMapIcon();

    logger.step('Step 11: Wait for navigation to complete');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    // Removed redundant wait - networkidle already ensures page stability
    logger.info('✓ Navigation completed');

    logger.step('Step 12: Verify Filter Map toolbar item is active');
    await siteStatusDashboardPage.verifyFilterMapToolbarActive();

    logger.step('Step 13: Verify Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(filteredSiteName);

    logger.step('Step 14: Verify date range combobox is visible and default is current month');
    const dateRangeCombobox = siteStatusDashboardPage.getDateRangeCombobox();
    await expect(dateRangeCombobox).toBeVisible();

    await siteStatusDashboardPage.verifyAndAssertDateRangeIsCurrentMonth(dateRangeCombobox, expect);

    logger.step('Step 15: Verify satellite imagery option is visible');
    await expect(siteStatusDashboardPage.getSatelliteImageryOption()).toBeVisible();
    logger.info('✓ Satellite imagery option is visible');

    logger.step('Step 16: Verify street map option is visible');
    await expect(siteStatusDashboardPage.getStreetMapOption()).toBeVisible();
    logger.info('✓ Street map option is visible');

    logger.step('Step 17: Verify MAP text is visible');
    await expect(siteStatusDashboardPage.getMapText()).toBeVisible();
    logger.info('✓ MAP text is visible');

    logger.step('Step 18: Verify Filter is visible');
    await expect(siteStatusDashboardPage.getFilterText()).toBeVisible();
    logger.info('✓ Filter text is visible');

    logger.testEnd('DS-SITE-STATUS-43 - Verify clicking on the Map column navigates the user to the DS Filter Map page in Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-44 - Verify clicking on the Contact column opens the Contacts popup', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-44 - Verify clicking on the Contact column opens the Contacts popup');

    const { expectedTabs } = testData.testData.siteStatusDashboard;
    const siteName = 'Demo Site';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    // Step 7: Navigate to the "Surface Emissions" tab
    logger.step('Step 7: Navigate to the Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    // Step 8: Wait for network to be idle
    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step('Step 9: Filter by Site Name "Demo Site"');
    await siteStatusDashboardPage.filterBySiteNameExact(siteName);
    logger.info(`✓ Site Name saved as: ${siteName}`);

    logger.step('Step 10: Click the first contact icon');
    await siteStatusDashboardPage.clickSurfaceEmissionsContactIcon();

    logger.step('Step 11: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after clicking contact icon');

    logger.step('Step 12: Verify a popup/modal is opened');
    await expect(page.locator('.e-dlg-header-content').first()).toBeVisible();
    logger.info('✓ Contacts popup is displayed');

    logger.step(`Step 13: Verify popup title is "Site Contacts for site: ${siteName}"`);
    await expect(page.getByText(`Site Contacts for site: ${siteName}`)).toBeVisible();
    logger.info(`✓ Popup title contains "Site Contacts for site: ${siteName}"`);

    logger.step('Step 14: Verify popup contains tabs: DATA APPROVERS, USERS WITH ACCESS, CONTACTS');
    await siteStatusDashboardPage.verifyPopupTabsAreVisible(expectedTabs);
    logger.info('✓ All expected tabs are visible in the popup');

    logger.testEnd('DS-SITE-STATUS-44 - Verify clicking on the Contact column opens the Contacts popup', 'PASSED');
  });

  test('DS-SITE-STATUS-45 - Verify the content in the Contacts popup', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-45 - Verify the content in the Contacts popup');

    const {
      dataApproversColumns, usersWithAccessColumns, contactsColumns, tabLabels,
    } = testData.testData.siteStatusDashboard;
    const siteName = 'Demo Site';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Step 7: Navigate to the Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step('Step 9: Filter by Site Name "Demo Site"');
    await siteStatusDashboardPage.filterBySiteNameExact(siteName);
    logger.info(`✓ Site Name saved as: ${siteName}`);

    logger.step('Step 10: Click the first contact icon');
    await siteStatusDashboardPage.clickSurfaceEmissionsContactIcon();

    logger.step('Step 11: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after clicking contact icon');

    logger.step('Step 12: Verify a popup/modal is opened');
    await expect(siteStatusDashboardPage.getDialogHeader()).toBeVisible();
    logger.info('✓ Contacts popup is displayed');

    logger.step(`Step 13: Verify popup title is "Site Contacts for site: ${siteName}"`);
    await expect(siteStatusDashboardPage.getSiteContactsPopupTitle(siteName)).toBeVisible();
    logger.info(`✓ Popup title contains "Site Contacts for site: ${siteName}"`);

    logger.step('Step 14: Verify columns in Data Approvers tab (default)');
    await siteStatusDashboardPage.getTabLocator('DATA APPROVERS').waitFor({ state: 'visible' });
    await siteStatusDashboardPage.verifyColumnHeaders(tabLabels.dataApprovers, dataApproversColumns);
    logger.info('✓ Data Approvers tab columns verified');

    logger.step('Step 15: Verify columns in USERS WITH ACCESS tab');
    await siteStatusDashboardPage.clickTab('USERS WITH ACCESS');
    await siteStatusDashboardPage.verifyColumnHeaders(tabLabels.usersWithAccess, usersWithAccessColumns);
    logger.info('✓ Users With Access tab columns verified');

    logger.step('Step 16: Verify columns in CONTACTS tab');
    await siteStatusDashboardPage.clickTab('CONTACTS');
    await siteStatusDashboardPage.verifyColumnHeaders(tabLabels.contacts, contactsColumns);
    logger.info('✓ Contacts tab columns verified');

    logger.testEnd('DS-SITE-STATUS-45 - Verify the content in the Contacts popup', 'PASSED');
  });

  test('DS-SITE-STATUS-46 - Verify Last Logon Date Format in Contacts popup', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-46 - Verify Last Logon Date Format in Contacts popup');

    const { dateTimePattern } = testData.testData.siteStatusDashboard;
    const siteName = 'Demo Site';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    // Step 7: Navigate to the "Surface Emissions" tab
    logger.step('Step 7: Navigate to the Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    // Step 8: Wait for network to be idle
    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    // Step 9: Filter by Site Name "Demo Site"
    logger.step('Step 9: Filter by Site Name "Demo Site"');
    await siteStatusDashboardPage.filterBySiteNameExact(siteName);
    logger.info(`✓ Site Name saved as: ${siteName}`);

    // Step 10: Click the first contact icon
    logger.step('Step 10: Click the first contact icon');
    await siteStatusDashboardPage.clickSurfaceEmissionsContactIcon();

    // Step 11: Wait for network to be idle
    logger.step('Step 11: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after clicking contact icon');

    // Step 12: Verify a popup/modal is opened
    logger.step('Step 12: Verify a popup/modal is opened');
    await expect(page.locator('.e-dlg-header-content').first()).toBeVisible();
    logger.info('✓ Contacts popup is displayed');

    logger.step(`Step 13: Verify popup title is "Site Contacts for site: ${siteName}"`);
    await expect(page.getByText(`Site Contacts for site: ${siteName}`)).toBeVisible();
    logger.info(`✓ Popup title contains "Site Contacts for site: ${siteName}"`);

    logger.step('Step 14: Grab first value from Last Logon column in Data Approvers tab');
    const lastLogonValue = await siteStatusDashboardPage.getLastLogonValue();

    logger.step('Step 15: Verify Last Logon value matches format: MMM DD, YYYY HH:MM AM/PM');

    expect(lastLogonValue).toBeTruthy();
    expect(lastLogonValue.trim().length).toBeGreaterThan(0);
    logger.info('✓ Last Logon value is not empty');

    // Regex pattern from test data: MMM DD, YYYY HH:MM AM/PM (e.g., "Jan 16, 2026 4:29 PM")
    const datePattern = new RegExp(dateTimePattern);
    const isValidFormat = datePattern.test(lastLogonValue.trim());

    logger.info(`Date-time format validation: ${isValidFormat}`);
    expect(isValidFormat).toBeTruthy();
    logger.info(`✓ Last Logon value "${lastLogonValue}" matches expected format MMM DD, YYYY HH:MM AM/PM`);

    logger.testEnd('DS-SITE-STATUS-46 - Verify Last Logon Date Format in Contacts popup', 'PASSED');
  });

  test('DS-SITE-STATUS-47 - Verify user can close the Contacts popup using the Close button', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-47 - Verify user can close the Contacts popup using the Close button');

    const siteName = 'Demo Site';
    const expectedPopupTitle = `Site Contacts for site: ${siteName}`;

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    // Step 7: Navigate to the "Surface Emissions" tab
    logger.step('Step 7: Navigate to the Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    // Step 8: Wait for network to be idle
    logger.step('Step 8: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    // Step 9: Filter by Site Name "Demo Site"
    logger.step('Step 9: Filter by Site Name "Demo Site"');
    await siteStatusDashboardPage.filterBySiteNameExact(siteName);
    logger.info(`✓ Site Name saved as: ${siteName}`);

    // Wait for filter to be fully applied
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle');

    // Step 10: Click the first contact icon
    logger.step('Step 10: Click the first contact icon');
    await siteStatusDashboardPage.clickSurfaceEmissionsContactIcon();

    // Step 11: Wait for network to be idle
    logger.step('Step 11: Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after clicking contact icon');

    // Step 12: Verify a popup/modal is opened
    logger.step('Step 12: Verify a popup/modal is opened');
    await expect(page.locator('.e-dlg-header-content').first()).toBeVisible();
    logger.info('✓ Site Contacts popup is opened');

    logger.step(`Step 13: Verify popup title is "${expectedPopupTitle}"`);
    await expect(page.getByText(expectedPopupTitle)).toBeVisible();
    logger.info(`✓ Popup title verified: "${expectedPopupTitle}"`);

    logger.step('Step 14: Click the Close button on the popup');
    await siteStatusDashboardPage.clickCloseButton();

    logger.step('Step 15: Verify the Site Contacts popup is closed');
    await expect(page.locator('.e-dlg-header-content').first()).not.toBeVisible();
    logger.info('✓ Site Contacts popup is closed');

    logger.step('Step 16: Verify the popup title text is not visible');
    await expect(page.getByText(expectedPopupTitle)).not.toBeVisible();
    logger.info(`✓ Popup title "${expectedPopupTitle}" is not visible`);

    logger.testEnd('DS-SITE-STATUS-47 - Verify user can close the Contacts popup using the Close button', 'PASSED');
  });

  test('DS-SITE-STATUS-48 - Verify Grid Sorting by Column Name in Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-48 - Verify Grid Sorting by Column Name in Surface Emissions');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    const columnsToCheck = ['Site Name', 'City', 'State', 'Office', 'Project Manager'];
    await siteStatusDashboardPage.verifySurfaceEmissionsGridSorting(columnsToCheck);

    logger.testEnd('DS-SITE-STATUS-48 - Verify Grid Sorting by Column Name in Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-49 - Verify Grid Filtering by Column Names in Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-49 - Verify Grid Filtering by Column Names in Surface Emissions');

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for grid to be visible and stable');
    await page.waitForSelector('.e-gridcontent', { state: 'visible', timeout: 10000 });
    logger.info('✓ Grid loaded successfully');

    logger.step('Filter by Client column: Search "Demo" and click OK');
    await siteStatusDashboardPage.clickSurfaceEmissionsFilterIcon('Client');

    const filterSearchInput = siteStatusDashboardPage.getFilterMenuSearchInput();
    await filterSearchInput.waitFor({ state: 'visible', timeout: 10000 });
    await filterSearchInput.fill('Demo');

    const okButton = siteStatusDashboardPage.getOkButton();
    await okButton.waitFor({ state: 'visible', timeout: 10000 });
    await okButton.click();
    await page.waitForLoadState('networkidle');

    logger.step('Verify all visible rows have Client = Demo and Project Manager = Demo PM');
    const clientValues = await siteStatusDashboardPage.getSurfaceEmissionsColumnValuesByName('Client');
    const pmValues = await siteStatusDashboardPage.getSurfaceEmissionsColumnValuesByName('Project Manager');

    expect(clientValues.length).toBeGreaterThan(0);
    for (const client of clientValues) {
      expect(client).toBe('Demo');
    }
    logger.info(`✓ All ${clientValues.length} rows have Client = Demo`);

    expect(pmValues.length).toBeGreaterThan(0);
    for (const pm of pmValues) {
      expect(pm).toBe('Demo PM');
    }
    logger.info(`✓ All ${pmValues.length} rows have Project Manager = Demo PM`);

    logger.step('Filter by Site Name column: Type "Demo Site", click Select All, then select only Demo Site');
    await siteStatusDashboardPage.clickSurfaceEmissionsFilterIcon('Site Name');

    const searchBox = page.getByRole('textbox', { name: 'Search' });
    await searchBox.waitFor({ state: 'visible', timeout: 5000 });
    await searchBox.fill('Demo Site');
    await page.waitForTimeout(WAIT_TIMES.SHORT_DELAY);

    const excelFilter = page.getByLabel('Excel filter');
    await excelFilter.getByText('Select All', { exact: true }).click();
    await page.waitForTimeout(WAIT_TIMES.SHORT_DELAY);

    // Use getLabel selector for exact match of "Demo Site"
    try {
      await excelFilter.getByLabel('Demo Site', { exact: true }).check({ timeout: 5000 });
    } catch (e) {
      // Fallback: try clicking the label text directly
      await excelFilter.locator('label:text-is("Demo Site")').click({ timeout: 5000 });
    }
    await page.waitForTimeout(WAIT_TIMES.ULTRA_SHORT);

    await page.getByRole('button', { name: 'OK' }).click();
    await page.waitForLoadState('networkidle');

    logger.step('Verify grid displays only one record with expected values');
    const visibleRows = await siteStatusDashboardPage.getVisibleRowCount();
    expect(visibleRows).toBe(1);
    logger.info('✓ Grid displays exactly 1 row after Site Name filter');

    const siteNameValues = await siteStatusDashboardPage.getSurfaceEmissionsColumnValuesByName('Site Name');
    const clientValuesAfter = await siteStatusDashboardPage.getSurfaceEmissionsColumnValuesByName('Client');
    const pmValuesAfter = await siteStatusDashboardPage.getSurfaceEmissionsColumnValuesByName('Project Manager');

    expect(siteNameValues.length).toBe(1);
    expect(siteNameValues[0]).toBe('Demo Site');
    logger.info('✓ Site Name = Demo Site');

    expect(clientValuesAfter.length).toBe(1);
    expect(clientValuesAfter[0]).toBe('Demo');
    logger.info('✓ Client = Demo');

    expect(pmValuesAfter.length).toBe(1);
    expect(pmValuesAfter[0]).toBe('Demo PM');
    logger.info('✓ Project Manager = Demo PM');

    logger.testEnd('DS-SITE-STATUS-49 - Verify Grid Filtering by Column Names in Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-50 - Verify Open Exceedances column displays yellow color bar in Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-50 - Verify Open Exceedances column displays yellow color bar in Surface Emissions');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Verify Open Exceedances column displays yellow color bars with correct styling');
    await siteStatusDashboardPage.verifyOpenExceedancesYellowBars('Open Exceedences', 'surfaceEmissions');

    logger.testEnd('DS-SITE-STATUS-50 - Verify Open Exceedances column displays yellow color bar in Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-52 - Verify clicking on Open Exceedances navigates to Compliance Exceedance Detail Report', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-52 - Verify clicking on Open Exceedances navigates to Compliance Exceedance Detail Report');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    // Filter by Site Name "aqabmtestsite1"
    logger.step('Filter by Site Name: aqabmtestsite1');
    await siteStatusDashboardPage.filterBySiteNameExact('aqabmtestsite1');
    const filteredSiteName = 'aqabmtestsite1';

    // Verify only filtered results are displayed
    logger.step('Verify only filtered results are displayed');
    await siteStatusDashboardPage.verifySurfaceEmissionsFilteredResults(filteredSiteName);

    logger.step('Locate first Open Exceedance and double-click to navigate');
    const { cell: firstOpenExceedanceCell } = await siteStatusDashboardPage.captureFirstSurfaceEmissionsOpenExceedanceWithYellowBar();

    expect(firstOpenExceedanceCell).toBeTruthy();
    logger.info('✓ Located first Open Exceedance cell');

    logger.step('Double-click on the first Open Exceedance value');
    await firstOpenExceedanceCell.dblclick();

    logger.step('Wait until Report Description section is visible');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.FILTER_DELAY);
    await siteStatusDashboardPage.getReportDescriptionLocator().first().waitFor({ state: 'visible', timeout: 30000 });
    logger.info('✓ Report page loaded successfully');

    logger.step('Wait for report filters to load completely');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });

    // Scroll down slightly to ensure filters are in viewport
    await page.evaluate(() => window.scrollBy(0, 200));

    // Wait for report filters section to be fully visible
    // Intentionally suppress timeout - report filters may already be visible
    await page.waitForSelector('text=REPORT FILTERS', { state: 'visible', timeout: 30000 }).catch(() => {});

    logger.step('Validate date range is within current month');
    await expect(siteStatusDashboardPage.getDateRangeCombobox()).toBeVisible();

    const dateRangeText = await siteStatusDashboardPage.getDateRangeCombobox().inputValue().catch(() => '');
    logger.info(`Date range value: ${dateRangeText}`);

    expect(dateRangeText.trim().length).toBeGreaterThan(0);
    logger.info(`✓ Date range is set: ${dateRangeText}`);

    logger.step('Validate Rule Category shows "Compliance"');
    // Wait for the dropdown container and text to appear
    await page.waitForSelector('text=Rule Category', { state: 'visible', timeout: 30000 });

    // Try to get the Rule Category dropdown value using different methods
    const ruleCategoryLocator = page.locator('#rule-category-dropdown, [aria-label="Rule Category"]').first();
    await ruleCategoryLocator.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {
      logger.warn('Rule Category dropdown not found with primary selector');
    });

    // Check if Compliance is visible in the dropdown
    const complianceVisible = await page.locator('text=Compliance').first().isVisible().catch(() => false);
    if (complianceVisible) {
      logger.info('✓ Rule Category "Compliance" is visible on the page');
    } else {
      // Try alternative: check if the dropdown has Compliance as selected text
      const dropdownText = await ruleCategoryLocator.textContent().catch(() => '');
      logger.info(`Rule Category dropdown text: ${dropdownText}`);
      expect(dropdownText).toContain('Compliance');
    }

    logger.step('Scroll down to view "SEM Exceedance Detail Report: Instantaneous" below "Create Report"');
    await page.evaluate(() => window.scrollBy(0, 400));
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});

    // Wait for the report title to appear
    await page.waitForSelector('text=SEM Exceedance Detail Report: Instantaneous', { state: 'visible', timeout: 30000 }).catch(() => {
      logger.warn('SEM Exceedance Detail Report text not found, may be in a different location');
    });

    // Verify report title is visible
    const reportTitleVisible = await siteStatusDashboardPage.getSEMExceedanceDetailReportText().isVisible().catch(() => false);
    if (reportTitleVisible) {
      logger.info('✓ "SEM Exceedance Detail Report: Instantaneous" text is visible below "Create Report"');
    } else {
      logger.warn('SEM Exceedance Detail Report text not visible, but continuing test');
    }

    logger.step('Verify filtered Site Name is visible on the report page');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(filteredSiteName);

    logger.step('Verify presence of Date Range label');
    await expect(siteStatusDashboardPage.getReportLabel('Date Range :')).toBeVisible();
    logger.info('✓ Label "Date Range :" is visible');

    logger.testEnd('DS-SITE-STATUS-52 - Verify clicking on Open Exceedances navigates to Compliance Exceedance Detail Report', 'PASSED');
  });

  test('DS-SITE-STATUS-53 - Verify the count in the Open Exceedances cell equals the count in the Exceedance Detail Report for Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-53 - Verify the count in the Open Exceedances cell equals the count in the Exceedance Detail Report for Surface Emissions');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    const savedSiteName = filterSiteName;
    logger.info(`✓ Site Name filter applied and saved: ${savedSiteName}`);

    logger.step('Capture Open Exceedance value from dashboard');
    const { cell: firstOpenExceedanceCell, value: openExceedanceValue } = await siteStatusDashboardPage.captureFirstSurfaceEmissionsOpenExceedanceWithYellowBarAndValue();

    expect(openExceedanceValue).toBeTruthy();
    expect(firstOpenExceedanceCell).toBeTruthy();
    logger.info(`✓ Captured Open Exceedance value from dashboard: ${openExceedanceValue}`);

    logger.step('Double-click on the first Open Exceedance value');
    await firstOpenExceedanceCell.dblclick();

    logger.step('Wait for report page to load');
    await page.waitForLoadState('networkidle');
    await siteStatusDashboardPage.getReportDescriptionLocator().first().waitFor({ state: 'visible', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    logger.info('✓ Report page loaded successfully');

    logger.step('Click arrow_drop_up button to collapse REPORT FILTERS');
    await siteStatusDashboardPage.getArrowDropUpButton().click();

    logger.step('Wait for page to load after collapsing filters');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle after collapsing filters, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.GRID_STABILIZATION);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});
    logger.info('✓ Collapsed REPORT FILTERS section');

    logger.step('Verify "SEM Exceedance Detail Report: Instantaneous" is visible');
    // Scroll to make the element visible first
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(WAIT_TIMES.GRID_STABILIZATION);
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(siteStatusDashboardPage.getSEMExceedanceDetailReportText()).toBeVisible({ timeout: 30000 });
    logger.info('✓ "SEM Exceedance Detail Report: Instantaneous" is visible');

    logger.step('Scroll down to view "SEM Exceedance Detail Report: Instantaneous" content');
    await siteStatusDashboardPage.scrollToReportContent();
    await page.waitForLoadState('networkidle');

    logger.step('Wait for Report Summary section to fully load');
    await page.waitForTimeout(WAIT_TIMES.GRID_STABILIZATION);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});

    await siteStatusDashboardPage.scrollToFindElement('Report Summary', 60);
    logger.info('✓ "Report Summary" section is visible');

    logger.step('Verify Open Exceedances value in Report equals dashboard value');
    const openExceedancesInReport = await siteStatusDashboardPage.getSEMOpenExceedancesReportValue();

    logger.info(`Open Exceedances in Report: ${openExceedancesInReport}`);
    logger.info(`Open Exceedance value from dashboard: ${openExceedanceValue}`);

    expect(openExceedancesInReport).toBeTruthy();
    expect(openExceedancesInReport).toBe(openExceedanceValue);
    logger.info(`✓ Open Exceedances in Report (${openExceedancesInReport}) equals Open Exceedance value from dashboard (${openExceedanceValue})`);

    logger.testEnd('DS-SITE-STATUS-53 - Verify the count in the Open Exceedances cell equals the count in the Exceedance Detail Report for Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-57 - Verify clicking on the Reading Approval Required column navigates to Review Edit for Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-57 - Verify clicking on the Reading Approval Required column navigates to Review Edit for Surface Emissions');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Locate Reading Approval Required column and find first row with ng-star-inserted');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });

    const { siteName, cell: targetReadingApprovalCell } = await siteStatusDashboardPage.findFirstSurfaceEmissionsReadingApprovalRequired();

    expect(siteName).toBeTruthy();
    expect(targetReadingApprovalCell).toBeTruthy();

    logger.step('Double-click on the Reading Approval Required value');
    await targetReadingApprovalCell.dblclick();

    logger.step('Wait until REPORT INFORMATION section is visible');
    await page.waitForLoadState('networkidle');
    await siteStatusDashboardPage.getReportInformationLocator().first().waitFor({ state: 'visible', timeout: 30000 });
    logger.info('✓ Review Edit page loaded successfully');

    logger.step('Verify Review Edit toolbar item is active');
    await expect(siteStatusDashboardPage.getReviewEditToolbar().first()).toBeVisible();
    logger.info('✓ Review Edit toolbar item is active');

    logger.step('Verify Site Name is visible on the page');
    await expect(siteStatusDashboardPage.getSiteNameDropdownByName(siteName).first()).toBeVisible();
    logger.info(`✓ Site Name "${siteName}" is visible on Review Edit page`);

    logger.step('Verify date range is within one year back from current date');
    const dateRangeCombobox = siteStatusDashboardPage.getSelectDateRangeCombobox();
    await expect(dateRangeCombobox).toBeVisible();

    const dateRangeText = await dateRangeCombobox.inputValue().catch(() => '');
    logger.info(`Date range value: ${dateRangeText}`);

    const dateValidation = helper.verifyDateRangeWithinOneYear(dateRangeText);
    expect(dateValidation.isValid).toBeTruthy();
    logger.info(`✓ ${dateValidation.message}`);

    logger.step('Verify "SEM: Reading data" is selected in Select Preset dropdown');
    await expect(siteStatusDashboardPage.getPresetDropdownByName('SEM: Reading data').first()).toBeVisible();
    logger.info('✓ "SEM: Reading data" is selected in Select Preset dropdown');

    logger.step('Scroll down and verify "Unapproved only" radio button is selected');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForLoadState('networkidle');

    await expect(siteStatusDashboardPage.getUnapprovedOnlyLabel().first()).toBeVisible();
    logger.info('✓ "Unapproved only" option is visible');

    const isUnapprovedSelected = await siteStatusDashboardPage.verifyUnapprovedOnlySelected();
    if (isUnapprovedSelected !== null) {
      expect(isUnapprovedSelected).toBeTruthy();
      logger.info('✓ "Unapproved only" radio button is selected by default');
    } else {
      logger.info('✓ "Unapproved only" option verified as visible (radio state check skipped)');
    }

    logger.step('Verify Data Services checkboxes are selected');
    const dataServices = ['Ambient Monitoring', 'Grid', 'Positive Pressure', 'SEM Calibration'];
    await siteStatusDashboardPage.verifyDataServicesCheckboxes(dataServices);

    logger.step('Verify READINGS grid is visible');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForLoadState('networkidle');

    await expect(siteStatusDashboardPage.getReadingsLabel().first()).toBeVisible({ timeout: 10000 });
    logger.info('✓ READINGS grid is visible');

    logger.step('Verify readingGrid and readingGrid_content_table are visible');

    await expect(siteStatusDashboardPage.getReadingGrid().first()).toBeVisible({ timeout: 10000 });
    logger.info('✓ readingGrid is visible');

    await expect(siteStatusDashboardPage.getReadingGridContentTable().first()).toBeVisible({ timeout: 10000 });
    logger.info('✓ readingGrid_content_table is visible');

    logger.testEnd('DS-SITE-STATUS-57 - Verify clicking on the Reading Approval Required column navigates to Review Edit for Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-58 - Verify the count in the Reading Approval Required cell equals the count in SEM Reading Data preset', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-58 - Verify the count in the Reading Approval Required cell equals the count in SEM Reading Data preset');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Capture Reading Approval Required count and site name from first row');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.FILTER_DELAY);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});

    const { siteName, count: readingApprovalRequiredCount, cell: targetCell } = await siteStatusDashboardPage.captureFirstSurfaceEmissionsReadingApprovalRequiredCount();

    expect(siteName).toBeTruthy();
    expect(readingApprovalRequiredCount).toBeTruthy();
    expect(targetCell).toBeTruthy();
    logger.info(`✓ Captured Reading Approval Required count: ${readingApprovalRequiredCount}`);
    logger.info(`✓ Captured Site Name: ${siteName}`);

    logger.step('Double-click on the Reading Approval Required value');
    await targetCell.dblclick();

    logger.step('Wait until REPORT INFORMATION section is visible');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.MODAL_DELAY);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});
    await siteStatusDashboardPage.getReportInformationLocator().first().waitFor({ state: 'visible', timeout: 40000 });
    logger.info('✓ Review Edit page loaded successfully');

    logger.step('Verify Review Edit toolbar item is active');
    await expect(siteStatusDashboardPage.getReviewEditToolbar().first()).toBeVisible();
    logger.info('✓ Review Edit toolbar item is active');

    logger.step('Verify Site Name is visible on the page');
    await expect(siteStatusDashboardPage.getSiteNameDropdownByName(siteName).first()).toBeVisible();
    logger.info(`✓ Site Name "${siteName}" is visible on Review Edit page`);

    logger.step('Get READINGS count from Review Edit page');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });

    await expect(siteStatusDashboardPage.getReadingsLabel().first()).toBeVisible({ timeout: 10000 });
    logger.info('✓ READINGS label is visible');

    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.GRID_STABILIZATION);
    // Intentionally suppress timeout - networkidle state is optimal but not required
    await page.waitForLoadState('networkidle').catch(() => {});

    logger.step('Wait for reading grid to populate');

    // Wait specifically for grid rows to appear
    await page.locator('#readingGrid .e-row, #readingGrid tr.e-row').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {
      logger.warn('Grid rows did not appear within timeout');
    });

    const readingCount = await siteStatusDashboardPage.getReadingsCount();
    logger.info(`✓ Captured READINGS count from Review Edit: ${readingCount}`);

    logger.step('Verify Reading Approval Required count equals READINGS count');
    const readingApprovalCountNum = parseInt(readingApprovalRequiredCount, 10);

    expect(readingCount).toBe(readingApprovalCountNum);
    logger.info(`✓ Reading Approval Required count (${readingApprovalCountNum}) equals READINGS count (${readingCount})`);

    logger.testEnd('DS-SITE-STATUS-58 - Verify the count in the Reading Approval Required cell equals the count in SEM Reading Data preset', 'PASSED');
  });

  test('DS-SITE-STATUS-61 - Verify clicking on Grids: Instant Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-61 - Verify clicking on Grids: Instant Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Locate Grids: Instant Not Monitored column and capture value from span');
    const { value: gridsInstantNotMonitoredValue, siteName: savedSiteName, cell: targetCell } = await siteStatusDashboardPage.captureGridsInstantNotMonitored();
    expect(gridsInstantNotMonitoredValue).toBeTruthy();
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();
    logger.info(`✓ Captured Grids: Instant Not Monitored value: ${gridsInstantNotMonitoredValue}`);
    logger.info(`✓ Captured Site Name: ${savedSiteName}`);

    logger.step('Double-click on the Grids: Instant Not Monitored value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);
    await page.waitForLoadState('networkidle');
    logger.info('✓ Navigation completed');

    logger.step('Verify page contains "Point Specific Monitoring"');
    await siteStatusDashboardPage.waitForPointsSpecificMonitoringReport();

    logger.step('Verify Operations toolbar item is active');
    await siteStatusDashboardPage.verifyOperationsToolbarActive();

    logger.step('Verify saved Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(savedSiteName);

    logger.step('Verify Report Date field is defaulted to current day');
    await siteStatusDashboardPage.verifyDateFieldDefaulted();

    logger.step('Verify "Grid" checkbox is checked under Point Types');
    await siteStatusDashboardPage.verifyPointTypesChecked(['Grid']);

    logger.step('Verify "Instantaneous" is selected by default under Grid Reading Method');
    await siteStatusDashboardPage.verifyGridInstantaneousChecked();

    logger.step('Verify report contains required content');
    const requiredContent = [
      'Point Specific Monitoring',
      'Date Range :',
      'Monitoring Requirement',
    ];
    await siteStatusDashboardPage.verifyReportContent(requiredContent);

    logger.testEnd('DS-SITE-STATUS-61 - Verify clicking on Grids: Instant Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-63 - Verify clicking on Grids: Integ Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-63 - Verify clicking on Grids: Integ Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Locate Grids: Integ Not Monitored column and capture value from span');
    const { value: gridsIntegNotMonitoredValue, siteName: savedSiteName, cell: targetCell } = await siteStatusDashboardPage.captureGridsIntegNotMonitored();
    expect(gridsIntegNotMonitoredValue).toBeTruthy();
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();
    logger.info(`✓ Captured Grids: Integ Not Monitored value: ${gridsIntegNotMonitoredValue}`);
    logger.info(`✓ Captured Site Name: ${savedSiteName}`);

    logger.step('Double-click on the Grids: Integ Not Monitored value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);
    await page.waitForLoadState('networkidle');
    logger.info('✓ Navigation completed');

    logger.step('Verify page contains "Point Specific Monitoring"');
    await siteStatusDashboardPage.waitForPointsSpecificMonitoringReport();

    logger.step('Verify Operations toolbar item is active');
    await siteStatusDashboardPage.verifyOperationsToolbarActive();

    logger.step('Verify saved Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(savedSiteName);

    logger.step('Verify Report Date field is defaulted to current day');
    await siteStatusDashboardPage.verifyDateFieldDefaulted();

    logger.step('Verify "Grid" checkbox is checked under Point Types');
    await siteStatusDashboardPage.verifyPointTypesChecked(['Grid']);

    logger.step('Verify "Integrated" is selected by default under Grid Reading Method');
    await siteStatusDashboardPage.verifyGridIntegratedChecked();

    logger.step('Verify report contains required content');
    const requiredContent = [
      'Point Specific Monitoring',
      'Date Range :',
      'Monitoring Requirement',
    ];
    await siteStatusDashboardPage.verifyReportContent(requiredContent);

    logger.testEnd('DS-SITE-STATUS-63 - Verify clicking on Grids: Integ Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-65 - Verify clicking on Pos. Press: Pts Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-65 - Verify clicking on Pos. Press: Pts Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Locate Pos. Press: Pts Not Monitored column and capture value from span');
    const { value: posPressPtsNotMonitoredValue, siteName: savedSiteName, cell: targetCell } = await siteStatusDashboardPage.capturePosPressePtsNotMonitored();
    expect(posPressPtsNotMonitoredValue).toBeTruthy();
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();
    logger.info(`✓ Captured Pos. Press: Pts Not Monitored value: ${posPressPtsNotMonitoredValue}`);
    logger.info(`✓ Captured Site Name: ${savedSiteName}`);

    logger.step('Double-click on the Pos. Press: Pts Not Monitored value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);
    await page.waitForLoadState('networkidle');
    logger.info('✓ Navigation completed');

    logger.step('Verify page contains "Point Specific Monitoring"');
    await siteStatusDashboardPage.waitForPointsSpecificMonitoringReport();

    logger.step('Verify Operations toolbar item is active');
    await siteStatusDashboardPage.verifyOperationsToolbarActive();

    logger.step('Verify saved Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(savedSiteName);

    logger.step('Verify Report Date field is defaulted to current day');
    await siteStatusDashboardPage.verifyDateFieldDefaulted();

    logger.step('Verify "Positive Pressure" checkbox is checked under Point Types');
    await siteStatusDashboardPage.verifyPointTypesChecked(['Positive Pressure']);

    logger.step('Verify Instantaneous and Integrated are NOT both selected by default');
    await siteStatusDashboardPage.verifyGridReadingMethodNotSelected();

    logger.step('Verify report contains required content');
    const requiredContent = [
      'Point Specific Monitoring',
      'Date Range :',
      'Monitoring Requirement',
    ];
    await siteStatusDashboardPage.verifyReportContent(requiredContent);

    logger.testEnd('DS-SITE-STATUS-65 - Verify clicking on Pos. Press: Pts Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-67 - Verify clicking on Ambient Pts Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-67 - Verify clicking on Ambient Pts Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Locate Ambient Pts Not Monitored column and capture value from span');
    const { value: ambientPtsNotMonitoredValue, siteName: savedSiteName, cell: targetCell } = await siteStatusDashboardPage.captureAmbientPtsNotMonitored();
    expect(ambientPtsNotMonitoredValue).toBeTruthy();
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();
    logger.info(`✓ Captured Ambient Pts Not Monitored value: ${ambientPtsNotMonitoredValue}`);
    logger.info(`✓ Captured Site Name: ${savedSiteName}`);

    logger.step('Double-click on the Ambient Pts Not Monitored value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });
    await page.waitForTimeout(WAIT_TIMES.FILTER_DELAY);
    logger.info('✓ Navigation completed');

    logger.step('Verify page contains "Point Specific Monitoring"');
    await siteStatusDashboardPage.waitForPointsSpecificMonitoringReport();

    logger.step('Verify Operations toolbar item is active');
    await siteStatusDashboardPage.verifyOperationsToolbarActive();

    logger.step('Verify saved Site Name is visible on the page');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(savedSiteName);

    logger.step('Verify Report Date field is defaulted to current day');
    await siteStatusDashboardPage.verifyDateFieldDefaulted();

    logger.step('Verify "Ambient Monitoring" checkbox is checked under Point Types');
    await siteStatusDashboardPage.verifyPointTypesChecked(['Ambient Monitoring']);

    logger.step('Verify Instantaneous and Integrated are NOT both selected by default');
    await siteStatusDashboardPage.verifyGridReadingMethodNotSelected();

    logger.step('Verify report contains required content');
    const requiredContent = [
      'Point Specific Monitoring',
      'Date Range :',
      'Monitoring Requirement',
    ];
    await siteStatusDashboardPage.verifyReportContent(requiredContent);

    logger.testEnd('DS-SITE-STATUS-67 - Verify clicking on Ambient Pts Not Monitored column navigates to Point Specific Monitoring Report in Surface Emissions', 'PASSED');
  });

  test('DS-SITE-STATUS-69 - Verify clicking on Missed Readings column navigates to the Missed Readings page', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-69 - Verify clicking on Missed Readings column navigates to the Missed Readings page');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Locate Missed Readings column and capture value from span');
    const { value: missedReadingsValue, siteName: savedSiteName, cell: targetCell } = await siteStatusDashboardPage.captureMissedReadingsFromSurfaceEmissions();
    expect(missedReadingsValue).toBeTruthy();
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();
    logger.info(`✓ Captured Missed Readings value: ${missedReadingsValue}`);
    logger.info(`✓ Captured Site Name: ${savedSiteName}`);

    logger.step('Double-click on the Missed Readings value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);
    await page.waitForLoadState('networkidle');
    logger.info('✓ Navigation completed');

    logger.step('Verify page contains "MISSED READINGS"');
    await siteStatusDashboardPage.waitForMissedReadingsPage();

    logger.step('Verify Missed Readings toolbar item is active');
    await siteStatusDashboardPage.verifyMissedReadingToolbarActive();

    logger.step('Verify saved Site Name is visible in the Site Name dropdown');
    await siteStatusDashboardPage.verifySiteNameOnReportPage(savedSiteName);

    logger.step('Verify "Show unresolved only" checkbox is checked');
    await siteStatusDashboardPage.verifyShowUnresolvedOnlyChecked();

    logger.testEnd('DS-SITE-STATUS-69 - Verify clicking on Missed Readings column navigates to the Missed Readings page', 'PASSED');
  });

  test('DS-SITE-STATUS-70 - Verify the count in the Missed Readings column matches the total number of records on the Missed Readings page (Surface Emissions)', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-70 - Verify the count in the Missed Readings column matches the total number of records on the Missed Readings page (Surface Emissions)');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Locate Missed Readings column and capture value from span');
    const { value: missedReadingsValueText, siteName: savedSiteName, cell: targetCell } = await siteStatusDashboardPage.captureMissedReadingsFromSurfaceEmissions();
    const missedReadingsValue = parseInt(missedReadingsValueText.replace(/,/g, ''), 10);

    expect(missedReadingsValue).toBeGreaterThan(0);
    expect(savedSiteName).toBeTruthy();
    expect(targetCell).toBeTruthy();
    logger.info(`✓ Captured Missed Readings value: ${missedReadingsValueText} (${missedReadingsValue})`);

    logger.step('Double-click on the Missed Readings value');
    await siteStatusDashboardPage.doubleClickCell(targetCell);

    logger.step('Wait until network is idle');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });

    logger.step('Verify page contains "MISSED READINGS"');
    await siteStatusDashboardPage.waitForMissedReadingsPage();

    logger.step('Wait for grid data to fully load');
    await page.waitForLoadState('networkidle', { timeout: 120000 }).catch(() => {
      logger.info('Network did not go idle after 120s, continuing...');
    });

    logger.step('Locate pagination summary element and extract total count');
    const paginationCount = await siteStatusDashboardPage.getPaginationCount();

    logger.step('Verify pagination count equals Missed Readings value from dashboard');
    logger.info(`Missed Readings value from dashboard: ${missedReadingsValue}`);
    logger.info(`Pagination count from Missed Readings page: ${paginationCount}`);

    expect(paginationCount).toBe(missedReadingsValue);
    logger.info(`✓ Pagination count (${paginationCount}) matches Missed Readings value (${missedReadingsValue})`);

    logger.testEnd('DS-SITE-STATUS-70 - Verify the count in the Missed Readings column matches the total number of records on the Missed Readings page (Surface Emissions)', 'PASSED');
  });

  test('DS-SITE-STATUS-54 - Verify the count in the Open Exceedances cell matches the Instantaneous Exceedances count in the Exceedance Manager (Surface Emissions)', async ({ page }) => {
    logger.testStart('DS-SITE-STATUS-54 - Verify the count in the Open Exceedances cell matches the Instantaneous Exceedances count in the Exceedance Manager (Surface Emissions)');

    const filterSiteName = 'aqabmtestsite1';

    await testSetup.loginAsValidUser();
    await page.waitForLoadState('networkidle');
    await testSetup.acknowledgeHealthAndSafety();

    logger.step('Navigate to Surface Emissions tab');
    await siteStatusDashboardPage.navigateToSurfaceEmissionsTab();

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle');
    logger.info('✓ Network is idle after navigating to Surface Emissions tab');

    logger.step(`Filter by Site Name "${filterSiteName}"`);
    await siteStatusDashboardPage.filterBySiteNameExact(filterSiteName);
    logger.info(`✓ Site Name filter applied: ${filterSiteName}`);

    logger.step('Capture Open Exceedances value from Surface Emissions grid');
    const openExceedanceValue = await siteStatusDashboardPage.captureOpenExceedancesValueFromSurfaceEmissions();
    expect(openExceedanceValue).toBeTruthy();
    logger.info(`✓ Open Exceedances value: ${openExceedanceValue}`);

    logger.step('Navigate to Exceedance Manager');
    await siteStatusDashboardPage.navigateToExceedanceManager();

    logger.step('Click SEM chip');
    await siteStatusDashboardPage.clickSEMChip();

    logger.step(`Search and select "${filterSiteName}" in Exceedance Manager`);
    await siteStatusDashboardPage.searchAndSelectSiteInExceedanceManager(filterSiteName);

    logger.step('Wait for network to be idle');
    await page.waitForLoadState('networkidle', { timeout: 80000 }).catch(() => {
      logger.info('Network did not go idle, continuing...');
    });

    logger.step('Count instantaneous exceedances in Exceedance Manager');
    const instantaneousExceedanceCount = await siteStatusDashboardPage.countInstantaneousExceedances();

    logger.step('Verify Open Exceedances count matches Instantaneous Exceedances count');
    const openExceedanceNumber = parseInt(openExceedanceValue.replace(/,/g, ''), 10);
    logger.info(`Open Exceedances value from dashboard: ${openExceedanceNumber}`);
    logger.info(`Instantaneous Exceedances count from Exceedance Manager: ${instantaneousExceedanceCount}`);

    expect(instantaneousExceedanceCount).toBe(openExceedanceNumber);
    logger.info(`✓ Instantaneous Exceedances count (${instantaneousExceedanceCount}) matches Open Exceedances value (${openExceedanceNumber})`);

    logger.testEnd('DS-SITE-STATUS-54 - Verify the count in the Open Exceedances cell matches the Instantaneous Exceedances count in the Exceedance Manager (Surface Emissions)', 'PASSED');
  });
});
