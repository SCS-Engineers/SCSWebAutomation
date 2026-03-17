const BasePage = require('../../../basePage');

/**
 * Calendar Operations Module
 * Handles all calendar-related interactions for Access Expiration Date
 */
class CalendarOperations extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Open the expiration date calendar
   * @returns {Promise<void>}
   */
  async openExpirationDateCalendar() {
    this.logger.action('Opening calendar for Access Expiration Date');

    // Wait for any existing calendar to be closed first
    const existingCalendar = this.page.locator('.e-calendar, .e-datepicker.e-popup');
    const existingCount = await existingCalendar.count();
    if (existingCount > 0) {
      await existingCalendar.first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {
        this.logger.debug('Existing calendar still visible or state unclear');
      });
    }

    // Find the date picker icon in edit mode
    const calendarIcon = this.page.locator('.e-input-group-icon.e-date-icon, .e-icons.e-date-icon').first();
    await calendarIcon.waitFor({ state: 'visible', timeout: 10000 });
    await calendarIcon.click();

    // Wait for calendar to be visible and fully rendered
    const calendar = this.page.locator('.e-calendar, .e-datepicker.e-popup').first();
    await calendar.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for calendar content to be loaded (check for enabled date cells in current month)
    const dateCells = calendar.locator('.e-content td:not(.e-disabled):not(.e-other-month)');
    await dateCells.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
      this.logger.debug('Enabled date cells may be loading');
    });

    this.logger.info('✓ Calendar opened and ready');
  }

  /**
   * Get today's date from calendar
   * @returns {Promise<number>} Today's date number
   */
  async getTodayDateFromCalendar() {
    this.logger.action('Getting today\'s date from calendar');

    // Find today's date cell
    const todayCell = this.page.locator('.e-calendar .e-today, .e-datepicker .e-today').first();
    await todayCell.waitFor({ state: 'visible', timeout: 5000 });

    const todayText = await todayCell.textContent();
    const todayDate = parseInt(todayText.trim(), 10);

    this.logger.info(`✓ Today's date: ${todayDate}`);
    return todayDate;
  }

  /**
   * Click TODAY button in calendar
   * @returns {Promise<void>}
   */
  async clickTodayInCalendar() {
    this.logger.action('Clicking TODAY button in calendar');

    // Find and click TODAY button
    const todayButton = this.page.locator('.e-footer-container .e-today, button:has-text("Today")').first();
    await todayButton.waitFor({ state: 'visible', timeout: 5000 });
    await todayButton.click();

    // Wait for calendar to close after selecting date
    const calendar = this.page.locator('.e-calendar, .e-datepicker.e-popup').first();
    await calendar.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      this.logger.debug('Calendar may not have closed, continuing');
    });

    // Wait for date input to be updated
    const dateInput = this.page.locator('.e-input-group input.e-input, input[role="combobox"]').first();
    await dateInput.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

    this.logger.info('✓ TODAY button clicked and calendar closed');
  }

  /**
   * Click a specific date in the calendar (handles month navigation if needed)
   * @param {number} daysFromToday - Number of days from today (e.g., 29 for 29 days from now)
   * @returns {Promise<void>}
   */
  async clickDateInCalendar(daysFromToday) {
    this.logger.action(`Clicking date ${daysFromToday} days from today in calendar`);

    // Calculate target date
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysFromToday);

    const targetDay = targetDate.getDate();
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    this.logger.info(`Target date: ${targetMonth + 1}/${targetDay}/${targetYear} (${daysFromToday} days from today)`);

    // Get current calendar month/year from the header
    const getCurrentMonthYear = async () => {
      const headerText = await this.page.locator('.e-calendar .e-title, .e-header .e-title').first().textContent();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

      for (let i = 0; i < monthNames.length; i++) {
        if (headerText.includes(monthNames[i])) {
          const yearMatch = headerText.match(/\d{4}/);
          const year = yearMatch ? parseInt(yearMatch[0], 10) : today.getFullYear();
          return { month: i, year };
        }
      }
      return { month: today.getMonth(), year: today.getFullYear() };
    };

    // Navigate to the correct month if needed
    let attempts = 0;
    const maxAttempts = 12; // Maximum 12 months navigation

    while (attempts < maxAttempts) {
      const current = await getCurrentMonthYear();

      // Check if we're in the correct month and year
      if (current.month === targetMonth && current.year === targetYear) {
        this.logger.info(`✓ Calendar is showing target month: ${targetMonth + 1}/${targetYear}`);
        break;
      }

      // Calculate if target is in future or past
      const currentDate = new Date(current.year, current.month, 1);
      const targetDateFirst = new Date(targetYear, targetMonth, 1);

      if (targetDateFirst > currentDate) {
        // Need to go forward
        this.logger.info('Navigating to next month...');
        const nextButton = this.page.locator('.e-calendar .e-next, .e-icon-container.e-next, button.e-next').first();
        await nextButton.click();
        
        // Wait for calendar content to update
        await this.page.locator('.e-calendar .e-content td, .e-datepicker .e-content td').first().waitFor({ 
          state: 'visible', 
          timeout: 3000 
        });
      } else {
        // Need to go backward
        this.logger.info('Navigating to previous month...');
        const prevButton = this.page.locator('.e-calendar .e-prev, .e-icon-container.e-prev, button.e-prev').first();
        await prevButton.click();
        
        // Wait for calendar content to update
        await this.page.locator('.e-calendar .e-content td, .e-datepicker .e-content td').first().waitFor({ 
          state: 'visible', 
          timeout: 3000 
        });
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error(`Failed to navigate to target month after ${maxAttempts} attempts`);
    }

    // Wait for date cells to be ready and visible
    const dateCells = this.page.locator('.e-calendar .e-cell:not(.e-other-month):not(.e-disabled), .e-datepicker .e-cell:not(.e-other-month):not(.e-disabled)');
    await dateCells.first().waitFor({ state: 'visible', timeout: 5000 });
    
    const cellCount = await dateCells.count();

    let dateClicked = false;

    for (let i = 0; i < cellCount; i++) {
      const cell = dateCells.nth(i);
      const dateText = await cell.textContent();
      const dateNum = parseInt(dateText.trim(), 10);

      if (dateNum === targetDay) {
        await cell.click();
        dateClicked = true;

        // Wait for calendar to close after selecting date
        const calendar = this.page.locator('.e-calendar, .e-datepicker.e-popup').first();
        await calendar.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
          this.logger.debug('Calendar may not have closed immediately');
        });

        // Wait for date input to be updated
        const dateInput = this.page.locator('.e-input-group input.e-input, input[role="combobox"]').first();
        await dateInput.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});

        this.logger.info(`✓ Clicked on date: ${targetMonth + 1}/${targetDay}/${targetYear} and calendar closed`);
        break;
      }
    }

    if (!dateClicked) {
      throw new Error(`Could not find and click date: ${targetDay} in calendar`);
    }
  }

  /**
   * Get all disabled calendar dates before a specific date
   * @param {number} beforeDate - Date number to check before
   * @returns {Promise<Array>} Array of disabled date locators
   */
  async getDisabledCalendarDatesBefore(beforeDate) {
    this.logger.action(`Getting disabled calendar dates before ${beforeDate}`);

    // Get all date cells in the calendar
    const allDateCells = this.page.locator('.e-calendar .e-cell, .e-datepicker .e-cell, .e-content .e-cell');
    const cellCount = await allDateCells.count();

    this.logger.info(`Found ${cellCount} total calendar cells`);

    const disabledDates = [];

    for (let i = 0; i < cellCount; i++) {
      const cell = allDateCells.nth(i);
      const dateText = await cell.textContent();
      const dateNum = parseInt(dateText.trim(), 10);

      // Skip if not a valid number or from other month
      if (Number.isNaN(dateNum)) continue;

      const cellClass = await cell.getAttribute('class').catch(() => '');
      const isOtherMonth = cellClass.includes('e-other-month');

      // Skip other month dates
      if (isOtherMonth) continue;

      // Check if date is before the specified date
      if (dateNum >= beforeDate) continue;

      // Check multiple ways a date can be disabled
      const ariaDisabled = await cell.getAttribute('aria-disabled').catch(() => null);
      const hasDisabledClass = cellClass.includes('e-disabled') || cellClass.includes('e-disable');
      const isDisabled = ariaDisabled === 'true' || hasDisabledClass;

      if (isDisabled) {
        this.logger.info(`Found disabled date: ${dateNum} (aria-disabled: ${ariaDisabled}, class: ${cellClass})`);
        disabledDates.push(cell);
      }
    }

    this.logger.info(`✓ Found ${disabledDates.length} disabled dates before ${beforeDate}`);
    return disabledDates;
  }

  /**
   * Close expiration date calendar
   * @returns {Promise<void>}
   */
  async closeCalendar() {
    this.logger.action('Closing calendar');

    // Press Escape to close calendar
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);

    // Verify calendar is closed
    const isCalendarVisible = await this.page.locator('.e-calendar, .e-datepicker.e-popup').isVisible({ timeout: 2000 }).catch(() => false);

    if (!isCalendarVisible) {
      this.logger.info('✓ Calendar closed');
    } else {
      this.logger.warn('Calendar may still be visible');
    }
  }

  /**
   * Get current month and year displayed in calendar header
   * @returns {Promise<{month: number, year: number}>} Current month (0-11) and year
   */
  async getCurrentMonthYearFromCalendar() {
    this.logger.action('Getting current month and year from calendar');

    // Find the month/year title in calendar header
    const titleElement = this.page.locator('.e-calendar .e-title, .e-calendar .e-day .e-title, .e-header .e-title').first();
    await titleElement.waitFor({ state: 'visible', timeout: 5000 });

    const titleText = await titleElement.textContent();
    this.logger.info(`Calendar title: ${titleText}`);

    // Parse "February 2026" or similar format
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    let month = -1;
    let year = -1;

    for (let i = 0; i < monthNames.length; i++) {
      if (titleText.includes(monthNames[i])) {
        month = i;
        break;
      }
    }

    const yearMatch = titleText.match(/\d{4}/);
    if (yearMatch) {
      year = parseInt(yearMatch[0], 10);
    }

    if (month === -1 || year === -1) {
      throw new Error(`Unable to parse calendar title: ${titleText}`);
    }

    this.logger.info(`✓ Current calendar view: Month ${month} (${monthNames[month]}), Year ${year}`);
    return { month, year };
  }

  /**
   * Navigate calendar to a specific year
   * @param {number} targetYear - Year to navigate to
   * @returns {Promise<void>}
   */
  async navigateCalendarToYear(targetYear) {
    this.logger.action(`Navigating calendar to year ${targetYear}`);

    // Click on month/year title to go to year view
    const titleElement = this.page.locator('.e-calendar .e-title, .e-calendar .e-day .e-title, .e-header .e-title').first();
    await titleElement.waitFor({ state: 'visible', timeout: 5000 });
    await titleElement.click();
    await this.page.waitForTimeout(500);

    // Click again to go to decade view (multi-year view)
    await titleElement.click();
    await this.page.waitForTimeout(500);

    // Now we're in decade view, find and click the target year
    let yearFound = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!yearFound && attempts < maxAttempts) {
      attempts++;

      // Check if target year is visible in current decade view
      const yearCells = this.page.locator('.e-calendar .e-cell, .e-content .e-cell');
      const cellCount = await yearCells.count();

      for (let i = 0; i < cellCount; i++) {
        const cell = yearCells.nth(i);
        const cellText = await cell.textContent();
        const cellYear = parseInt(cellText.trim(), 10);

        if (cellYear === targetYear) {
          // Found the target year, click it
          await cell.click();
          await this.page.waitForTimeout(500);
          yearFound = true;
          this.logger.info(`✓ Navigated to year ${targetYear}`);
          break;
        }
      }

      if (!yearFound) {
        // Need to navigate to next or previous decade
        const currentView = await this.page.locator('.e-calendar .e-title, .e-header .e-title').first().textContent();
        const currentDecadeMatch = currentView.match(/(\d{4})\s*-\s*(\d{4})/);

        if (currentDecadeMatch) {
          const decadeStart = parseInt(currentDecadeMatch[1], 10);
          const decadeEnd = parseInt(currentDecadeMatch[2], 10);

          if (targetYear < decadeStart) {
            // Go to previous decade
            const prevButton = this.page.locator('.e-calendar .e-prev, .e-calendar .e-icon-container.e-prev, button.e-prev').first();
            await prevButton.click();
            await this.page.waitForTimeout(500);
          } else if (targetYear > decadeEnd) {
            // Go to next decade
            const nextButton = this.page.locator('.e-calendar .e-next, .e-calendar .e-icon-container.e-next, button.e-next').first();
            await nextButton.click();
            await this.page.waitForTimeout(500);
          }
        }
      }
    }

    if (!yearFound) {
      throw new Error(`Unable to navigate to year ${targetYear} after ${maxAttempts} attempts`);
    }
  }

  /**
   * Select a specific month in the calendar (assumes year view is open)
   * @param {number} monthIndex - Month index (0-11, where 0 = January)
   * @returns {Promise<void>}
   */
  async selectMonthInCalendar(monthIndex) {
    this.logger.action(`Selecting month ${monthIndex} in calendar`);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const targetMonthShort = monthNames[monthIndex];

    // Wait for month view to be visible
    await this.page.waitForTimeout(500);

    // Find and click the month cell
    const monthCells = this.page.locator('.e-calendar .e-cell, .e-content .e-cell');
    const cellCount = await monthCells.count();

    for (let i = 0; i < cellCount; i++) {
      const cell = monthCells.nth(i);
      const cellText = await cell.textContent();

      if (cellText.trim() === targetMonthShort) {
        await cell.click();
        await this.page.waitForTimeout(500);
        this.logger.info(`✓ Selected ${monthNames[monthIndex]}`);
        return;
      }
    }

    throw new Error(`Unable to find month ${targetMonthShort} in calendar`);
  }

  /**
   * Get all disabled calendar dates after a specific date
   * @param {number} afterDate - Date number to check after
   * @returns {Promise<Array>} Array of disabled date locators
   */
  async getDisabledCalendarDatesAfter(afterDate) {
    this.logger.action(`Getting disabled calendar dates after ${afterDate}`);

    // Get all date cells in the calendar
    const allDateCells = this.page.locator('.e-calendar .e-cell, .e-datepicker .e-cell, .e-content .e-cell');
    const cellCount = await allDateCells.count();

    this.logger.info(`Found ${cellCount} total calendar cells`);

    const disabledDates = [];

    for (let i = 0; i < cellCount; i++) {
      const cell = allDateCells.nth(i);
      const dateText = await cell.textContent();
      const dateNum = parseInt(dateText.trim(), 10);

      // Skip if not a valid number
      if (Number.isNaN(dateNum)) continue;

      const cellClass = await cell.getAttribute('class').catch(() => '');
      const isOtherMonth = cellClass.includes('e-other-month');

      // Skip other month dates
      if (isOtherMonth) continue;

      // Check if date is after the specified date
      if (dateNum <= afterDate) continue;

      // Check multiple ways a date can be disabled
      const ariaDisabled = await cell.getAttribute('aria-disabled').catch(() => null);
      const hasDisabledClass = cellClass.includes('e-disabled') || cellClass.includes('e-disable');
      const isDisabled = ariaDisabled === 'true' || hasDisabledClass;

      if (isDisabled) {
        this.logger.info(`Found disabled date: ${dateNum} (aria-disabled: ${ariaDisabled}, class: ${cellClass})`);
        disabledDates.push(cell);
      }
    }

    this.logger.info(`✓ Found ${disabledDates.length} disabled dates after ${afterDate}`);
    return disabledDates;
  }

  /**
   * Get maximum allowed date (5 years from today)
   * @returns {Promise<{day: number, month: number, year: number}>} Max allowed date
   */
  async getMaxAllowedExpirationDate() {
    this.logger.action('Calculating maximum allowed expiration date (Today + 5 years)');

    const today = new Date();
    const maxDate = new Date(today);

    // Add 5 years
    maxDate.setFullYear(today.getFullYear() + 5);

    // Subtract 1 day to get the last valid date (e.g., if today is Feb 13, 2026, max is Feb 12, 2031)
    maxDate.setDate(maxDate.getDate() - 1);

    const result = {
      day: maxDate.getDate(),
      month: maxDate.getMonth(),
      year: maxDate.getFullYear(),
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    this.logger.info(`✓ Max allowed date: ${monthNames[result.month]} ${result.day}, ${result.year}`);
    return result;
  }

  /**
   * Verify all date cells are disabled
   * @param {Array} dateCells - Array of date cell locators
   * @returns {Promise<void>}
   */
  async verifyAllDatesAreDisabled(dateCells) {
    this.logger.info(`Verifying ${dateCells.length} dates are disabled`);

    for (const dateCell of dateCells) {
      const ariaDisabled = await dateCell.getAttribute('aria-disabled');
      const cellClass = await dateCell.getAttribute('class');
      const isDisabled = ariaDisabled === 'true' || cellClass.includes('e-disabled') || cellClass.includes('e-disable');

      if (!isDisabled) {
        throw new Error('Expected date cell to be disabled but it was enabled');
      }
    }

    this.logger.info('✓ All dates are disabled');
  }
}

module.exports = CalendarOperations;
