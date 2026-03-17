const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

/**
 * Logger utility for test automation using Winston
 */
class Logger {
  constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');

    // Custom format for console output (matches original logger format)
    const consoleFormat = winston.format.printf(({ level, message }) => message);

    // Custom format for file output (includes level and timestamp)
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`),
    );

    // Configure Winston logger
    this.winstonLogger = winston.createLogger({
      level: 'debug',
      transports: [
        // Console transport (matching original output format)
        new winston.transports.Console({
          format: consoleFormat,
          handleExceptions: true,
        }),
        // Daily rotating file transport for all logs
        new DailyRotateFile({
          dirname: logsDir,
          filename: 'test-execution-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: fileFormat,
        }),
        // Separate file for errors only
        new DailyRotateFile({
          dirname: logsDir,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: fileFormat,
        }),
      ],
    });
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   */
  info(message) {
    const formattedMessage = `[INFO] [${this.getTimestamp()}] ${message}`;
    this.winstonLogger.info(formattedMessage);
  }

  /**
   * Log error message
   * @param {string} message - Error message to log
   */
  error(message) {
    const formattedMessage = `[ERROR] [${this.getTimestamp()}] ${message}`;
    this.winstonLogger.error(formattedMessage);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message to log
   */
  warn(message) {
    const formattedMessage = `[WARN] [${this.getTimestamp()}] ${message}`;
    this.winstonLogger.warn(formattedMessage);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message to log
   */
  debug(message) {
    const formattedMessage = `[DEBUG] [${this.getTimestamp()}] ${message}`;
    this.winstonLogger.debug(formattedMessage);
  }

  /**
   * Log step message
   * @param {string} step - Step description
   */
  step(step) {
    const formattedMessage = `\n${'='.repeat(50)}\n[STEP] [${this.getTimestamp()}] ${step}\n${'='.repeat(50)}\n`;
    this.winstonLogger.info(formattedMessage);
  }

  /**
   * Log test start
   * @param {string} testName - Test name
   */
  testStart(testName) {
    const formattedMessage = `\n${'*'.repeat(60)}\n*** TEST STARTED: ${testName} ***\n*** Time: ${this.getTimestamp()} ***\n${'*'.repeat(60)}\n`;
    this.winstonLogger.info(formattedMessage);
  }

  /**
   * Log test end
   * @param {string} testName - Test name
   * @param {string} status - Test status (PASSED/FAILED)
   */
  testEnd(testName, status = 'COMPLETED') {
    const formattedMessage = `\n${'*'.repeat(60)}\n*** TEST ${status}: ${testName} ***\n*** Time: ${this.getTimestamp()} ***\n${'*'.repeat(60)}\n`;
    this.winstonLogger.info(formattedMessage);
  }

  /**
   * Log action
   * @param {string} action - Action description
   * @param {string} element - Element description (optional)
   */
  action(action, element = '') {
    const elementInfo = element ? ` on element: ${element}` : '';
    const formattedMessage = `[ACTION] [${this.getTimestamp()}] ${action}${elementInfo}`;
    this.winstonLogger.info(formattedMessage);
  }

  /**
   * Log verification
   * @param {string} verification - Verification description
   * @param {boolean} result - Verification result
   */
  verify(verification, result) {
    const status = result ? '✓ PASS' : '✗ FAIL';
    const formattedMessage = `[VERIFY] [${this.getTimestamp()}] ${status} - ${verification}`;
    this.winstonLogger.info(formattedMessage);
  }

  /**
   * Get current timestamp
   * @returns {string} Formatted timestamp (YYYY-MM-DD HH:mm:ss)
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Log divider
   */
  divider() {
    const formattedMessage = '-'.repeat(60);
    this.winstonLogger.info(formattedMessage);
  }
}

module.exports = new Logger();
