// Load environment variables from .env file
require('dotenv').config();

// Load test data from JSON file
const testData = require('../data/testData.json');
const logger = require('./logger');

/**
 * Credentials Manager - Secure credential handling using environment variables
 * Falls back to testData.json for non-sensitive data and backward compatibility
 */

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string|null} fallback - Fallback value if env var not found
 * @param {boolean} shouldWarnIfMissing - Whether to log warning if missing (default: false)
 * @returns {string|null} Environment variable value or fallback
 */
const getEnvVar = (key, fallback = null, shouldWarnIfMissing = false) => {
  const value = process.env[key];

  if (value === undefined || value === '') {
    if (fallback !== null) return fallback;

    if (shouldWarnIfMissing) {
      logger.warn(`Environment variable ${key} is not set. Using fallback from testData.json if available.`);
    }
    return null;
  }

  return value;
};

/**
 * Build user credentials object from environment variables with fallback
 * @param {string} prefix - Environment variable prefix (e.g., 'VALID_USER')
 * @param {Object} fallback - Fallback user object from testData.json
 * @returns {Object} User credentials object
 */
const buildUserCredentials = (prefix, fallback = {}) => ({
  username: getEnvVar(`${prefix}_USERNAME`, fallback.username, true),
  password: getEnvVar(`${prefix}_PASSWORD`, fallback.password, true),
  firstName: getEnvVar(`${prefix}_FIRSTNAME`, fallback.firstName, false),
  lastName: getEnvVar(`${prefix}_LASTNAME`, fallback.lastName, false),
});

// Build users object with environment variables taking precedence
const users = {
  validUser: buildUserCredentials('VALID_USER', testData.users.validUser),
  nonApplicableUser: buildUserCredentials('NON_APPLICABLE_USER', testData.users.nonApplicableUser),
  noAccessUser: buildUserCredentials('NO_ACCESS_USER', testData.users.noAccessUser),
  invalidUsername: buildUserCredentials('INVALID_USERNAME', testData.users.invalidUsername),
  invalidPassword: buildUserCredentials('INVALID_PASSWORD', testData.users.invalidPassword),
  invalidBoth: buildUserCredentials('INVALID_BOTH', testData.users.invalidBoth),
  pwuser16: buildUserCredentials('PWUSER16', testData.users.pwuser16),
  pwuser17: buildUserCredentials('PWUSER17', testData.users.pwuser17),
  pwautomationu2: buildUserCredentials('PWAUTOMATIONU2', testData.users.pwautomationu2),
};

// Build URLs object with environment variables taking precedence
const testUrls = {
  loginPage: getEnvVar('LOGIN_PAGE_URL', testData.testUrls.loginPage, true),
  homePage: getEnvVar('HOME_PAGE_URL', testData.testUrls.homePage, true),
};

// Build test data with environment variables for sensitive data
const enhancedTestData = {
  ...testData.testData,
  changePassword: {
    initialPassword: getEnvVar('CHANGE_PASSWORD_INITIAL', testData.testData.changePassword?.initialPassword, true),
    newPassword: getEnvVar('CHANGE_PASSWORD_NEW', testData.testData.changePassword?.newPassword, true),
    invalidPassword: getEnvVar('CHANGE_PASSWORD_INVALID', testData.testData.changePassword?.invalidPassword, true),
  },
};

module.exports = {
  users,
  testUrls,
  testData: enhancedTestData,

  /**
   * Get user credentials by type
   * @param {string} userType - Type of user (validUser, invalidUsername, invalidPassword)
   * @returns {Object} User credentials
   */
  getUserCredentials(userType = 'validUser') {
    return this.users[userType];
  },

  /**
   * Get URL by type
   * @param {string} urlType - Type of URL (loginPage, homePage, etc.)
   * @returns {string} URL
   */
  getUrl(urlType) {
    return this.testUrls[urlType];
  },

  /**
   * Get specific test data
   * @param {string} key - Key for test data
   * @returns {any} Test data value
   */
  getTestData(key) {
    return this.testData[key];
  },

  /**
   * Get username for a specific user type
   * @param {string} userType - Type of user
   * @returns {string} Username
   */
  getUsername(userType = 'validUser') {
    return this.users[userType].username;
  },

  /**
   * Get password for a specific user type
   * @param {string} userType - Type of user
   * @returns {string} Password
   */
  getPassword(userType = 'validUser') {
    return this.users[userType].password;
  },
};
