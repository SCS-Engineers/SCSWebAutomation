const { addYears, format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

/**
 * Helper utility functions for tests
 */
class Helper {
  /**
   * Generate random email
   * @returns {string} Random email address
   */
  generateRandomEmail() {
    const timestamp = Date.now();
    return `test_${timestamp}@example.com`;
  }

  /**
   * Generate random string
   * @param {number} length - Length of string
   * @returns {string} Random string
   */
  generateRandomString(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(
      { length },
      () => characters.charAt(Math.floor(Math.random() * characters.length)),
    ).join('');
  }

  /**
   * Wait for specified milliseconds
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  async wait(ms) {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Get current date in specified format
   * @param {string} formatString - Date format (default: 'YYYY-MM-DD')
   * @returns {string} Formatted date
   */
  getCurrentDate(formatString = 'YYYY-MM-DD') {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (formatString === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    } else if (formatString === 'DD/MM/YYYY') {
      return `${day}/${month}/${year}`;
    }
    return date.toISOString();
  }

  /**
   * Verify if date range text contains current month and year
   * @param {string} dateRangeText - Date range text to validate
   * @returns {boolean} True if contains current month and year
   */
  isCurrentMonthInDateRange(dateRangeText) {
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();
    const shortMonth = now.toLocaleString('default', { month: 'short' });

    // Check if date range contains current month/year
    const containsMonth = dateRangeText.includes(currentMonth)
                         || dateRangeText.includes(shortMonth)
                         || dateRangeText.includes(currentMonth.toLowerCase())
                         || dateRangeText.includes(shortMonth.toLowerCase());
    const containsYear = dateRangeText.includes(currentYear.toString());

    return containsMonth && containsYear;
  }

  /**
   * Get current month and year for logging
   * @returns {Object} Object with currentMonth, currentYear, and shortMonth
   */
  getCurrentMonthAndYear() {
    const now = new Date();
    return {
      currentMonth: now.toLocaleString('default', { month: 'long' }),
      currentYear: now.getFullYear(),
      shortMonth: now.toLocaleString('default', { month: 'short' }),
    };
  }

  /**
   * Parse MM-DD-YYYY date string to Date object
   * @param {string} dateStr - Date string in MM-DD-YYYY format
   * @returns {Date} Parsed date object
   */
  parseDateString(dateStr) {
    const [month, day, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Verify date range is within one year back from current date
   * @param {string} dateRangeText - Date range text in format "MM-DD-YYYY - MM-DD-YYYY"
   * @returns {Object} Object with isValid boolean and message string
   */
  verifyDateRangeWithinOneYear(dateRangeText) {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    // Extract dates from the range (format: MM-DD-YYYY - MM-DD-YYYY)
    const dateMatch = dateRangeText.match(/(\d{2}-\d{2}-\d{4})\s*-\s*(\d{2}-\d{2}-\d{4})/);

    if (dateMatch) {
      const startDate = this.parseDateString(dateMatch[1]);
      const endDate = this.parseDateString(dateMatch[2]);

      const isValid = startDate >= oneYearAgo && endDate <= now;
      return {
        isValid,
        message: isValid
          ? `Date range (${dateRangeText}) is within one year back from current date`
          : `Date range (${dateRangeText}) is NOT within one year back from current date`,
      };
    }

    // If format doesn't match, just verify the field has a value
    const hasValue = dateRangeText.trim().length > 0;
    return {
      isValid: hasValue,
      message: hasValue
        ? `Date range is set: ${dateRangeText}`
        : 'Date range is empty',
    };
  }

  /**
   * Get date plus one year from today in Pacific Time Zone
   * Returns date in MM/DD/YYYY format
   * @returns {string} Date in MM/DD/YYYY format
   */
  getDatePlusOneYearPacific() {
    const now = new Date();
    const pacificDate = toZonedTime(now, 'America/Los_Angeles');
    const futureDate = addYears(pacificDate, 1);
    return format(futureDate, 'MM/dd/yyyy');
  }
}

module.exports = new Helper();
