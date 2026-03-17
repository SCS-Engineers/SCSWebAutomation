/**
 * Timeout constants for test automation
 * All values in milliseconds
 */
const TIMEOUTS = {
  // Element interaction timeouts
  ELEMENT_VISIBLE: 30000, // 30 seconds
  ELEMENT_SHORT: 10000, // 10 seconds
  ELEMENT_LONG: 60000, // 1 minute

  // Navigation timeouts
  NAVIGATION: 120000, // 2 minutes
  NETWORK_IDLE: 60000, // 1 minute
  NETWORK_IDLE_SHORT: 30000, // 30 seconds
  DOM_CONTENT_LOADED: 30000, // 30 seconds

  // Test execution timeouts
  TEST_TIMEOUT: 300000, // 5 minutes
  EXPECT_TIMEOUT: 30000, // 30 seconds

  // Retry and wait timeouts
  RETRY_INTERVAL: 2000, // 2 seconds
  SHORT_WAIT: 5000, // 5 seconds
  MEDIUM_WAIT: 30000, // 30 seconds
  LONG_WAIT: 60000, // 1 minute
  SCROLL_WAIT: 60000, // 1 minute (for scrolling operations)

  // Health & Safety modal timeout
  MODAL_TIMEOUT: 10000, // 10 seconds

  // Tab switching timeout
  TAB_SWITCH_TIMEOUT: 45000, // 45 seconds

  // Retry configuration
  MAX_RETRIES: 3, // Maximum retry attempts for operations
};

module.exports = TIMEOUTS;
