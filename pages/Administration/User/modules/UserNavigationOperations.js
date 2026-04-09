const BasePage = require('../../../basePage');
const LOCATORS = require('../../../constants/administrationUserPage.constants');

/**
 * UserNavigationOperations module for Administration User Page
 * Handles navigation, section visibility, and basic page setup
 */
class UserNavigationOperations extends BasePage {
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
    // Removed redundant wait - click operations auto-wait
    await this.click(LOCATORS.listMenuItem);
    await this.page.waitForLoadState('networkidle');
    this.logger.info('✓ Navigated to Users List');
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
      // Wait for section content to become visible
      await this.page.locator('.e-grid, .e-gridcontent').first()
        .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    }

    this.logger.info('✓ SITE ACCESS AND PERMISSIONS section opened');
  }

  /**
   * Open GROUP ACCESS AND PERMISSIONS section by clicking the collapsible header.
   * If the header is not found (e.g., section is always visible), the method
   * logs a warning and continues safely.
   * @returns {Promise<void>}
   */
  async openGroupAccessPermissions() {
    this.logger.action('Opening GROUP ACCESS AND PERMISSIONS section');

    try {
      const header = this.page.locator(LOCATORS.groupAccessPermissionsHeader).first();
      const isHeaderVisible = await header.isVisible({ timeout: 5000 }).catch(() => false);

      if (isHeaderVisible) {
        // Check if section is already expanded by looking for collapse icon
        const isExpanded = await header.locator('..').locator('.e-icons.e-chev-up-icon').isVisible().catch(() => false);

        if (!isExpanded) {
          await header.click();
          // Wait for group access content to become visible
          await this.page.locator('.e-grid .e-row, .e-gridcontent').first()
            .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
          this.logger.info('✓ GROUP ACCESS AND PERMISSIONS section expanded by clicking header');
        } else {
          this.logger.info('✓ GROUP ACCESS AND PERMISSIONS section already expanded');
        }
      } else {
        this.logger.info('✓ GROUP ACCESS header not found - assuming section is already visible');
      }
    } catch (error) {
      this.logger.warn(`Could not open GROUP ACCESS section: ${error.message}`);
    }
  }

  /**
   * Expand user list section by dragging resize handler down
   * @param {number} pixels - Number of pixels to drag down (default: 200)
   * @returns {Promise<void>}
   */
  async expandUserListSection(pixels = 200) {
    this.logger.action(`Expanding user list section by dragging resize handler down ${pixels} pixels`);

    const resizeHandler = this.page.locator(LOCATORS.resizeHandler).first();
    const isResizeHandlerVisible = await resizeHandler.isVisible().catch(() => false);

    if (isResizeHandlerVisible) {
      const box = await resizeHandler.boundingBox();
      if (box) {
        // Drag down to expand the top section (user list)
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + box.width / 2, box.y + pixels);
        await this.page.mouse.up();
        // Wait for layout to settle after resize
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
        this.logger.info('✓ Dragged resize handler down to expand user list section');
      }
    } else {
      this.logger.info('Resize handler not visible, skipping');
    }
  }

  // ─── Site List Navigation ───────────────────────────────────────

  /**
   * Navigate to Sites → List in the Administration section
   * Clicks the ADMINISTRATION tab, then clicks the "List" action
   * within the Sites toolbar group.
   * @returns {Promise<void>}
   */
  async navigateToSitesList() {
    this.logger.action('Navigating to Sites → List');
    await this.click(LOCATORS.administrationTab);
    await this.page.waitForLoadState('networkidle');
    this.logger.info('✓ On ADMINISTRATION tab');
  }

  /**
   * Click the "List" button under the Sites toolbar group.
   * Locates the toolbar item group that contains the "Sites" label
   * and clicks the "List" child within it.
   * @returns {Promise<void>}
   */
  async clickSiteListButton() {
    this.logger.action('Clicking List button in Sites section');

    // The toolbar structure groups each section (Users, Sites, Points…)
    // as a parent element whose last child is the label text (e.g. "Sites").
    // Find the parent that has "Sites" as a direct child, then click "List"
    // within that same parent to avoid hitting Users > List.
    const sitesGroup = this.page.locator('text=Sites').first()
      .locator('..');
    const listButton = sitesGroup.locator('text=List').first();
    await listButton.waitFor({ state: 'visible', timeout: 10000 });
    await listButton.click();
    await this.page.waitForLoadState('networkidle');
    // Wait for site list grid to render
    await this.page.locator('.e-grid .e-row').first()
      .waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    this.logger.info('✓ Clicked List in Sites section');
  }

  /**
   * Filter the Site List grid by Site Name using the EJ2 Grid API.
   * Falls back to Excel filter UI if the API approach fails.
   * @param {string} siteName - Site name to filter by
   * @returns {Promise<void>}
   */
  async filterSiteGridByName(siteName) {
    this.logger.action(`Filtering Site List grid by name: ${siteName}`);

    // Ensure the SITE LIST heading is visible (page fully navigated)
    await this.page.locator('text=SITE LIST').first()
      .waitFor({ state: 'visible', timeout: 30000 });

    // Wait for the site list grid rows to be visible
    await this.page.locator('.e-grid .e-row').first()
      .waitFor({ state: 'visible', timeout: 30000 });
    // Wait for grid to be interactive after filter is ready
    await this.page.waitForLoadState('networkidle').catch(() => {});

    // Use EJ2 Grid API to filter the "Name" column directly.
    // This is more reliable than clicking the Excel filter icon.
    const filtered = await this.page.evaluate((name) => {
      const grids = document.querySelectorAll('.e-grid');
      for (const grid of grids) {
        const ej = grid.ej2_instances && grid.ej2_instances[0];
        if (ej && ej.columns) {
          const col = ej.columns.find(
            (c) => c.headerText === 'Name',
          );
          if (col) {
            ej.clearFiltering();
            ej.filterByColumn(col.field, 'equal', name);
            return true;
          }
        }
      }
      return false;
    }, siteName);

    if (!filtered) {
      throw new Error(
        'Could not filter Site List grid — "Name" column not found',
      );
    }

    await this.page.waitForLoadState('networkidle');
    // Wait for filtered row to appear in the grid
    await this.page.locator('.e-grid .e-row').first()
      .waitFor({ state: 'visible', timeout: 15000 });

    // Select the first filtered row via EJ2 Grid API to avoid
    // click-interception by the <app-sites> component wrapper.
    await this.page.evaluate(() => {
      const grid = document.querySelector('.e-grid');
      const ej = grid && grid.ej2_instances && grid.ej2_instances[0];
      if (ej) {
        ej.selectRow(0);
      }
    });
    await this.page.waitForLoadState('networkidle');
    // Wait for row selection to take effect
    await this.page.locator('.e-row.e-selectionbackground').first()
      .waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});

    this.logger.info(`✓ Filtered Site List by: ${siteName}`);
  }

  /**
   * Click the EDIT button in the SITE INFORMATION section.
   * The button text is uppercase "EDIT" on the site details panel.
   * @returns {Promise<void>}
   */
  async clickSiteRowEditButton() {
    this.logger.action('Clicking EDIT button on site information');
    // The site info EDIT button contains uppercase "EDIT" text.
    // The <app-sites> Angular wrapper may intercept pointer events,
    // so we use evaluate to dispatch a click directly on the button.
    const editButton = this.page
      .locator('button:has-text("EDIT")').first();
    await editButton.waitFor({ state: 'visible', timeout: 15000 });

    // Dispatch a native click event to bypass <app-sites> interception
    await editButton.evaluate((btn) => btn.click());
    await this.page.waitForLoadState('networkidle');
    // Wait for edit mode to activate by checking for Region dropdown
    await this.page.waitForFunction(() => {
      const dd = document.querySelector(
        'ejs-dropdownlist[data-qa="admin-site-regional-dd"]',
      );
      return dd && dd.ej2_instances && dd.ej2_instances[0];
    }, { timeout: 15000 }).catch(() => {});

    // Verify that the form actually entered edit mode by checking
    // that the Region dropdown's EJ2 instance exists and is enabled.
    const isEditMode = await this.page.evaluate(() => {
      const dd = document.querySelector(
        'ejs-dropdownlist[data-qa="admin-site-regional-dd"]',
      );
      return dd && dd.ej2_instances && dd.ej2_instances[0]
        ? true : false;
    });

    if (!isEditMode) {
      this.logger.info('Edit mode not detected — retrying click');
      await editButton.evaluate((btn) => btn.click());
      await this.page.waitForLoadState('networkidle');
      // Wait for edit mode on retry
      await this.page.waitForFunction(() => {
        const dd = document.querySelector(
          'ejs-dropdownlist[data-qa="admin-site-regional-dd"]',
        );
        return dd && dd.ej2_instances && dd.ej2_instances[0];
      }, { timeout: 15000 }).catch(() => {});
    }

    this.logger.info('✓ Clicked EDIT on site information');
  }

  /**
   * Change a site group dropdown value (e.g., Region, SCS Office, Client).
   * These are EJ2 DropDownList widgets with float labels inside the
   * SITE INFORMATION form. Region → SCS Office → Client are cascading
   * dropdowns, so each selection may reload the next dropdown.
   * @param {string} label - Dropdown label text ('Region', 'SCS Office', 'Client')
   * @param {string} value - Value to select from the dropdown
   * @returns {Promise<void>}
   */
  async changeSiteGroupDropdown(label, value) {
    this.logger.action(`Changing "${label}" dropdown to "${value}"`);

    // Map human-readable label names to EJ2 data-qa selectors.
    // Each dropdown is an <ejs-dropdownlist data-qa="..."> element.
    const DATA_QA_MAP = {
      'Region': 'admin-site-regional-dd',
      'SCS Office': 'admin-site-office-dd',
      'Client': 'admin-site-client-dd',
    };

    const dataQa = DATA_QA_MAP[label];
    if (!dataQa) {
      throw new Error(
        `Unknown dropdown label "${label}". ` +
        `Expected one of: ${Object.keys(DATA_QA_MAP).join(', ')}`,
      );
    }

    // Wait for any cascading dropdown reload from a prior change.
    await this.page.waitForLoadState('networkidle');
    // Wait for the target dropdown to be enabled (cascading loads may
    // temporarily disable dependent dropdowns).

    const selector = `ejs-dropdownlist[data-qa="${dataQa}"]`;

    // Wait for the dropdown to be enabled (cascading loads may
    // temporarily disable dependent dropdowns).
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const inst = el.ej2_instances && el.ej2_instances[0];
        return inst && inst.enabled !== false;
      },
      selector,
      { timeout: 15000 },
    );

    // Open the dropdown popup using EJ2 API — more reliable than
    // clicking the icon which may be obscured or not interactive.
    const opened = await this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const inst = el && el.ej2_instances && el.ej2_instances[0];
      if (inst) {
        inst.showPopup();
        return true;
      }
      return false;
    }, selector);

    if (!opened) {
      this.logger.info(
        `EJ2 showPopup() failed for "${label}", trying click fallback`,
      );
      const ddl = this.page.locator(selector);
      const icon = ddl.locator(
        'span.e-input-group-icon, span.e-ddl-icon',
      ).first();
      await icon.scrollIntoViewIfNeeded();
      await icon.click();
    }

    // Wait for the popup with list items to appear.
    const popup = this.page.locator('.e-popup.e-popup-open').last();
    await popup.waitFor({ state: 'visible', timeout: 10000 });

    // Select the matching option from the list.
    const option = popup.locator('.e-list-item')
      .filter({ hasText: value }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.scrollIntoViewIfNeeded();
    await option.click();

    // Allow cascade effect (dependent dropdowns reload).
    await this.page.waitForLoadState('networkidle');

    this.logger.info(`✓ Changed "${label}" to "${value}"`);
  }

  /**
   * Click the Save button on the site edit form.
   * Tries both "Save" and "SAVE" variants (the site details panel
   * may use uppercase button text).
   * @returns {Promise<void>}
   */
  async clickSiteSaveButton() {
    this.logger.action('Clicking Save button on site edit form');
    const saveButton = this.page
      .locator('button:has-text("Save"), button:has-text("SAVE")').first();
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });

    // The <app-sites> Angular wrapper may intercept pointer events,
    // so we use evaluate to dispatch a click directly on the button.
    await saveButton.evaluate((btn) => btn.click());
    await this.page.waitForLoadState('networkidle');
    // Wait for spinner to disappear after save
    await this.page.locator('.e-spinner-pane').waitFor(
      { state: 'hidden', timeout: 10000 },
    ).catch(() => {});
    this.logger.info('✓ Save button clicked on site form');
  }

  /**
   * Verify the Save button is still visible (e.g., after clicking No)
   * @returns {Promise<void>}
   */
  async verifySaveButtonIsVisible() {
    this.logger.action('Verifying Save button is still visible');
    const saveButton = this.page
      .locator('button:has-text("Save"), button:has-text("SAVE")').first();
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('✓ Save button is visible — user remains on edit screen');
  }

  /**
   * Verify the title of the currently visible confirmation popup
   * @param {string} expectedTitle - Expected popup title text
   * @returns {Promise<void>}
   */
  async verifyConfirmationPopupTitle(expectedTitle) {
    this.logger.action(`Verifying confirmation popup title: "${expectedTitle}"`);

    const dialog = this.page.locator('.e-dialog').filter({ hasText: expectedTitle }).first();
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

    const header = dialog.locator('.e-dlg-header-content, .e-dlg-header').first();
    const titleText = await header.textContent();

    if (!titleText.includes(expectedTitle)) {
      throw new Error(
        `Popup title mismatch. Expected: "${expectedTitle}", Actual: "${titleText.trim()}"`,
      );
    }

    this.logger.info(`✓ Popup title verified: "${titleText.trim()}"`);
  }

  /**
   * Wait for the site success message to appear
   * @param {string} expectedMessage - Expected success message text
   * @returns {Promise<void>}
   */
  async waitForSiteSuccessMessage(expectedMessage = 'Successfully saved.') {
    this.logger.info(`Waiting for site success message: "${expectedMessage}"`);
    await this.page.locator(`text=${expectedMessage}`).waitFor({
      state: 'visible',
      timeout: 30000,
    });
    await this.page.locator(`text=${expectedMessage}`).waitFor({
      state: 'hidden',
      timeout: 30000,
    });
    this.logger.info('✓ Site success message appeared and disappeared');
  }

  /**
   * Save site changes and verify that NO confirmation popup appears —
   * only the success toast should display. Used by EXP-49 / EXP-50
   * where the user has no group-level access for the site.
   * @param {string} expectedMessage - Expected success toast text
   * @returns {Promise<void>}
   */
  async saveSiteAndVerifyNoConfirmationPopup(
    expectedMessage = 'Successfully saved.',
  ) {
    this.logger.action(
      'Saving site and verifying no confirmation popup appears',
    );

    await this.clickSiteSaveButton();

    // Give the confirmation dialog a brief window to appear.
    // If it does, the test should fail.
    const dialog = this.page.locator('.e-dialog')
      .filter({ hasText: 'Confirmation' });
    const popupVisible = await dialog
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (popupVisible) {
      throw new Error(
        'Confirmation popup appeared unexpectedly — expected only ' +
        'the success message after saving.',
      );
    }

    this.logger.info('✓ No confirmation popup displayed');

    // Now verify the success message
    await this.waitForSiteSuccessMessage(expectedMessage);
  }
}

module.exports = UserNavigationOperations;
