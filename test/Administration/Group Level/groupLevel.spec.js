const { test } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const logger = require('../../../utils/logger');
const AdminUserTestHelpers = require('../../../utils/adminUserTestHelpers');

// Destructure test data at import to avoid repeated deep access
const {
  groupLevelAccess43, groupLevelAccess44, groupLevelAccess48,
  groupLevelAccess49, groupLevelAccess50,
} = require('../../../data/testData.json').testData;

/**
 * Test suite for Admin User Management - Group Level Access
 * Verifies expiration date behavior when granting/removing group-level access,
 * including confirmation popups and Access Status/Expiration column states.
 */
test.describe('Admin User Mgmt Group Level Access', () => {
  /** Extended timeout for tests with site-group revert cleanup (7 min) */
  const EXTENDED_TEST_TIMEOUT = 420000;

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
   * Shared finally-block cleanup for EXP-48/49/50 tests.
   * Skips phases the main flow already completed.
   * @param {Object} params - Cleanup parameters
   * @param {string} params.groupName - Group to clean up
   * @param {string} params.siteName - Site to clean up
   * @param {Object} params.originalGroups - Original site groups to revert
   * @param {boolean} params.hasUserAccessBeenCleaned - Whether user access was cleaned
   * @param {boolean} params.haveSiteGroupsBeenReverted - Whether site groups were reverted
   * @returns {Promise<void>}
   */
  const safeCleanupAll = async ({
    groupName, siteName, originalGroups,
    hasUserAccessBeenCleaned, haveSiteGroupsBeenReverted,
  }) => {
    if (!hasUserAccessBeenCleaned) {
      await helpers.safeCleanupUserAccess(groupName, siteName);
    }
    if (!haveSiteGroupsBeenReverted) {
      await helpers.safeRevertSiteGroups(siteName, originalGroups);
    }
  };

  // ─── Tests ────────────────────────────────────────────────────────

  test('ADMIN-USR-ACC-EXP-43 - Verify that admin user is notified that site expiry dates are automatically cleared when giving access through group', async () => {
    const testName = test.info().title;
    logger.testStart(testName);

    const { userName, siteName, groupName, confirmationMessage } = groupLevelAccess43;

    try {
      await helpers.navigateToUsersList();
      await helpers.setupUserForSiteAccess(userName, -200);

      // ── Setup: Grant site-level access ──
      logger.step(`Step 5: Grant site-level access to "${siteName}"`);
      await helpers.grantSiteAccessAndSave(siteName);

      // ── Verify site access state after grant (EXP-45) ──
      logger.step('Step 6: Verify Access Status is not empty after site grant');
      await helpers.openSiteAccessInEditMode();
      await administrationUserPage.verifyAccessStatusIsNotEmpty(siteName);

      logger.step('Step 7: Verify Access Expiration is one year from today');
      await administrationUserPage.verifyAccessExpirationDateIsOneYearFromToday(siteName);

      // ── Grant group-level access ──
      logger.step(`Step 8: Grant group-level access to "${groupName}"`);
      await helpers.grantGroupAccessAndSave(groupName);

      // ── Verify confirmation popup on Save ──
      logger.step('Step 9: Click Save and verify confirmation popup');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.verifyConfirmationPopupMessage(confirmationMessage);

      // ── Click No — changes should not be finalized ──
      logger.step('Step 10: Click No on confirmation popup');
      await administrationUserPage.clickNoOnConfirmation();
      logger.info('✓ Confirmation dismissed — user remains in edit mode');

      // ── Re-grant group access (No reverted the pending grant) ──
      logger.step('Step 11: Re-grant group access after dismissal');
      await helpers.grantGroupAccessAndSave(groupName);

      // ── Save and confirm with Yes ──
      logger.step('Step 12: Click Save and confirm with Yes');
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.verifyConfirmationPopupMessage(confirmationMessage);
      await administrationUserPage.clickYesOnConfirmation();

      logger.step('Step 13: Verify success message');
      await administrationUserPage.waitForSuccessMessage();
      await administrationUserPage.waitForDOMContentLoaded();

      // ── Verify site access state after group grant (EXP-45/46) ──
      logger.step('Step 14: Open site access to verify post-group-grant state');
      await helpers.openSiteAccessInEditMode();

      logger.step(`Step 15: Verify "${siteName}" is visible in access grid`);
      await administrationUserPage.verifySiteIsVisibleInGrid(siteName);

      logger.step(`Step 16: Verify Access Status is empty for "${siteName}"`);
      await administrationUserPage.verifyAccessStatusIsEmpty(siteName);

      logger.step(`Step 17: Verify Access Expiration is empty for "${siteName}"`);
      await administrationUserPage.verifyAccessExpirationDateIsEmpty(siteName);

      // ── Verify expiration field is blocked while group is associated ──
      logger.step(`Step 18: Verify editing Access Expiration shows blocked-by-group toast`);
      await administrationUserPage.verifyExpirationEditBlockedByGroupMessage(siteName);

      // ── Remove group-level access (EXP-47) ──
      logger.step(`Step 19: Remove group-level access for "${groupName}"`);
      await helpers.removeGroupAccessAndSave(groupName);

      // ── Verify site access state after group removal ──
      logger.step('Step 20: Open site access to verify post-group-removal state');
      await helpers.openSiteAccessInEditMode();

      logger.step(`Step 21: Verify "${siteName}" remains in access grid`);
      await administrationUserPage.verifySiteIsVisibleInGrid(siteName);

      logger.step(`Step 22: Verify Access Expiration is editable for "${siteName}"`);
      await administrationUserPage.verifyAccessExpirationFieldEditable(siteName);

      // ── Set a new expiration date and verify it persists ──
      logger.step(`Step 23: Set Access Expiration date for "${siteName}" via calendar`);
      await administrationUserPage.editAccessExpirationDateCell(siteName);
      await administrationUserPage.openExpirationDateCalendar();
      await administrationUserPage.clickTodayInCalendar();
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      await administrationUserPage.waitForDOMContentLoaded();

      logger.step('Step 24: Verify expiration date was saved');
      await helpers.openSiteAccessInEditMode();
      await administrationUserPage.verifyAccessExpirationDateIsNotEmpty(siteName);
      await administrationUserPage.verifyAccessStatusIsNotEmpty(siteName);

      // ── Cleanup: Remove site-level access ──
      logger.step(`Step 25: Cleanup — remove site access for "${siteName}"`);
      await administrationUserPage.removeAccessForSite(siteName);
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      // Safety-net cleanup — guarded so failures don't cascade
      await helpers.enterGroupCleanupMode();
      await helpers.cleanupGroupAccess(groupName);
      // cleanupSiteAccess re-enters edit mode internally
      await helpers.cleanupSiteAccess(siteName);
    }
  });

  test('ADMIN-USR-ACC-EXP-44 - Verify the behavior of site expiry date when providing access to a group that has no sites with existing access to the user', async () => {
    const testName = test.info().title;
    logger.testStart(testName);

    const { userName, groupName } = groupLevelAccess44;

    try {
      await helpers.navigateToUsersList();
      await helpers.setupUserForSiteAccess(userName, -200);

      // ── Grant group-level access ──
      logger.step(`Step 5: Grant group-level access to "${groupName}"`);
      await helpers.grantGroupAccessAndSave(groupName);

      logger.step('Step 6: Save group access changes');
      await helpers.saveAndWaitForSuccess();

      // ── Verify group-provided sites have empty defaults ──
      logger.step('Step 7: Open site access to verify group-provided sites');
      await helpers.openSiteAccessInEditMode();

      const firstSiteName = await administrationUserPage.getFirstSiteNameFromGrid();
      logger.info(`First group-provided site: "${firstSiteName}"`);

      logger.step(`Step 8: Verify Access Expiration is empty for "${firstSiteName}"`);
      await administrationUserPage.verifyAccessExpirationDateIsEmpty(firstSiteName);

      logger.step(`Step 9: Verify Access Status is empty for "${firstSiteName}"`);
      await administrationUserPage.verifyAccessStatusIsEmpty(firstSiteName);

      // ── Cleanup: Remove group access ──
      logger.step(`Step 10: Cleanup — remove group access for "${groupName}"`);
      await helpers.removeGroupAccessAndSave(groupName);

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      // Safety-net cleanup — guarded so failures don't cascade
      await helpers.enterGroupCleanupMode();
      await helpers.cleanupGroupAccess(groupName);
    }
  });

  test('ADMIN-USR-ACC-EXP-48 - Verify confirmation message when assigning a site with an expiry date to a group to which the user already has access', async () => {
    test.setTimeout(EXTENDED_TEST_TIMEOUT);

    const testName = test.info().title;
    logger.testStart(testName);

    const {
      userName, siteName, groupName, successMessage, siteGroups,
    } = groupLevelAccess48;

    const originalGroups =
      AdminUserTestHelpers.buildOriginalGroups(siteGroups);

    // Flags to track which cleanup phases the main flow completed,
    // so the finally block can skip redundant (slow) operations.
    let hasUserAccessBeenCleaned = false;
    let haveSiteGroupsBeenReverted = false;

    try {
      // ── Shared setup: Steps 1-17 ──
      await helpers.performSharedEXP48Setup(groupLevelAccess48);

      // ── Cleanup: Remove site and group access ──
      logger.step(
        `Step 18: Cleanup — remove site access for "${siteName}"`,
      );
      await administrationUserPage.removeAccessForSite(siteName);
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();

      logger.step(
        `Step 19: Cleanup — remove group-level access for "${groupName}"`,
      );
      await administrationUserPage.clickEditButton();
      await administrationUserPage.openSiteAccessPermissions();
      await administrationUserPage.openGroupAccessPermissions();
      await helpers.cleanupGroupAccess(groupName);
      hasUserAccessBeenCleaned = true;

      // ── Cleanup: Revert site groups to original values ──
      logger.step('Step 20: Revert site groups to original values');
      await helpers.revertSiteGroups(
        siteName, originalGroups, successMessage,
      );
      haveSiteGroupsBeenReverted = true;

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await safeCleanupAll({
        groupName, siteName, originalGroups,
        hasUserAccessBeenCleaned, haveSiteGroupsBeenReverted,
      });
    }
  });

  test('ADMIN-USR-ACC-EXP-49 - Verify no confirmation message when assigning a site with an expiry date to a group after removing group access', async () => {
    test.setTimeout(EXTENDED_TEST_TIMEOUT);

    const testName = test.info().title;
    logger.testStart(testName);

    const {
      userName, siteName, groupName, successMessage, siteGroups,
    } = groupLevelAccess49;

    const originalGroups =
      AdminUserTestHelpers.buildOriginalGroups(siteGroups);

    let hasUserAccessBeenCleaned = false;
    let haveSiteGroupsBeenReverted = false;

    try {
      // ── Shared setup: Steps 1-17 ──
      await helpers.performSharedEXP48Setup(groupLevelAccess49);

      // ── EXP-49 specific: Remove group access, set expiry, revert ──

      logger.step(
        `Step 18: Remove group-level access for "${groupName}"`,
      );
      await helpers.removeGroupAccessAndSave(groupName);

      logger.step(
        `Step 19: Set expiry date for "${siteName}" and save`,
      );
      await helpers.openSiteAccessInEditMode();
      await administrationUserPage
        .editAccessExpirationDateCell(siteName);
      await administrationUserPage.openExpirationDateCalendar();
      await administrationUserPage.clickTodayInCalendar();
      await helpers.saveAndWaitForSuccess();

      // ── Site Group Change Flow ──
      logger.step(
        'Step 20-23: Navigate to Site List and revert groups',
      );
      await helpers.navigateToSiteAndChangeGroups(
        siteName, originalGroups,
      );

      logger.step('Step 24: Save and verify no confirmation popup');
      await administrationUserPage
        .saveSiteAndVerifyNoConfirmationPopup(successMessage);
      haveSiteGroupsBeenReverted = true;

      // ── Post-save User Verification ──
      logger.step(
        'Step 25-26: Navigate back and open user site access',
      );
      await helpers.navigateBackAndOpenUserSiteAccess(userName);

      logger.step(
        `Step 27: Verify Access Expiration is not empty for "${siteName}"`,
      );
      await administrationUserPage
        .verifyAccessExpirationDateIsNotEmpty(siteName);

      logger.step(
        `Step 28: Verify Access Status is not empty for "${siteName}"`,
      );
      await administrationUserPage
        .verifyAccessStatusIsNotEmpty(siteName);

      // ── Cleanup: Remove site-level access ──
      logger.step(
        `Step 29: Cleanup — remove site access for "${siteName}"`,
      );
      await administrationUserPage.removeAccessForSite(siteName);
      await administrationUserPage.clickSaveButton();
      await administrationUserPage.waitForSuccessMessage();
      hasUserAccessBeenCleaned = true;

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await safeCleanupAll({
        groupName, siteName, originalGroups,
        hasUserAccessBeenCleaned, haveSiteGroupsBeenReverted,
      });
    }
  });

  test('ADMIN-USR-ACC-EXP-50 - Verify no confirmation message when assigning a site with an expiry date to a group after removing site access', async () => {
    test.setTimeout(EXTENDED_TEST_TIMEOUT);

    const testName = test.info().title;
    logger.testStart(testName);

    const {
      userName, siteName, groupName, successMessage, siteGroups,
    } = groupLevelAccess50;

    const originalGroups =
      AdminUserTestHelpers.buildOriginalGroups(siteGroups);

    let hasUserAccessBeenCleaned = false;
    let haveSiteGroupsBeenReverted = false;

    try {
      // ── Shared setup: Steps 1-17 ──
      await helpers.performSharedEXP48Setup(groupLevelAccess50);

      // ── EXP-50 specific: Remove site access, revert site groups ──

      logger.step(
        `Step 18: Remove site-level access for "${siteName}"`,
      );
      await administrationUserPage.removeAccessForSite(siteName);
      await helpers.saveAndWaitForSuccess();

      // ── Site Group Change Flow ──
      logger.step(
        'Step 19-22: Navigate to Site List and revert groups',
      );
      await helpers.navigateToSiteAndChangeGroups(
        siteName, originalGroups,
      );

      logger.step('Step 23: Save and verify no confirmation popup');
      await administrationUserPage
        .saveSiteAndVerifyNoConfirmationPopup(successMessage);
      haveSiteGroupsBeenReverted = true;

      // ── Post-save: Navigate back to Users List ──
      logger.step('Step 24: Navigate back to Users List');
      await helpers.navigateBackToUsersList();

      // ── Cleanup: Remove group-level access ──
      logger.step(
        `Step 25: Cleanup — remove group access for "${groupName}"`,
      );
      await helpers.findUserAndCleanupGroupAccess(userName, groupName);
      hasUserAccessBeenCleaned = true;

      logger.testEnd(testName, 'PASSED');
    } catch (error) {
      logger.testEnd(testName, 'FAILED');
      throw error;
    } finally {
      await safeCleanupAll({
        groupName, siteName, originalGroups,
        hasUserAccessBeenCleaned, haveSiteGroupsBeenReverted,
      });
    }
  });
});
