const BasePage = require('../../../basePage');

/**
 * NotificationOperations module for Administration User Page
 * Handles notification navigation, grid operations, and content validation
 */
class NotificationOperations extends BasePage {
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
      this.page.locator('.toolbar-item .text:has-text("List")').last(),
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

    // Wait for data rows (or gracefully continue if grid is empty)
    await this.page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {
      this.logger.warn('No data rows found in notifications grid - grid may be empty');
    });

    // Wait for spinner to disappear
    await this.page.locator('.e-spinner-pane').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      this.logger.info('No spinner found or already hidden');
    });

    this.logger.info('✓ Notifications grid fully loaded');
  }

  /**
   * Filter notification grid by Event Type
   * @param {string} eventType - Event type to filter (e.g., "Access Expiry Notification")
   * @returns {Promise<void>}
   */
  async filterByEventType(eventType) {
    this.logger.action(`Filtering by Event Type: ${eventType}`);

    // Click on Event Type column header filter icon
    const eventTypeHeader = this.page.locator('.e-headercell:has-text("Event Type")').first();
    await eventTypeHeader.waitFor({ state: 'visible', timeout: 10000 });

    const filterIcon = eventTypeHeader.locator('.e-filtermenudiv').first();
    await filterIcon.waitFor({ state: 'visible', timeout: 10000 });
    await filterIcon.click();
    this.logger.info('✓ Clicked filter icon for Event Type');

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
      this.logger.warn('Notification header format may not match expected pattern');
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
}

module.exports = NotificationOperations;
