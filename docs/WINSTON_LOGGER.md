# Winston Logger Integration

## Overview

Winston logger has been integrated into the SCS Web Automation project for centralized, production-grade logging capabilities.

## Features

### Logging Levels
- **debug**: Detailed debugging information
- **info**: General information messages
- **warn**: Warning messages
- **error**: Error messages

### Transport Configuration

#### 1. Console Transport
- Outputs to console with the same format as the original logger
- Maintains backward compatibility with existing console output
- No formatting changes to preserve test readability

#### 2. Daily Rotating File Transport - All Logs
- **Location**: `logs/test-execution-YYYY-MM-DD.log`
- **Rotation**: Daily
- **Max File Size**: 20MB
- **Retention**: 14 days
- **Format**: `YYYY-MM-DD HH:mm:ss [LEVEL] message`

#### 3. Daily Rotating File Transport - Errors Only
- **Location**: `logs/error-YYYY-MM-DD.log`
- **Rotation**: Daily
- **Max File Size**: 20MB
- **Retention**: 30 days
- **Format**: `YYYY-MM-DD HH:mm:ss [LEVEL] message`

## API Reference

The logger maintains the same API as before. No code changes required in existing tests.

### Methods

```javascript
const logger = require('./utils/logger');

// Log levels
logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');
logger.debug('Debug message');

// Test lifecycle
logger.testStart('Test name');
logger.testEnd('Test name', 'PASSED'); // or 'FAILED'

// Test steps
logger.step('Step description');

// Actions
logger.action('Action description');
logger.action('Action description', 'element selector');

// Verification
logger.verify('Verification description', true); // ✓ PASS
logger.verify('Verification description', false); // ✗ FAIL

// Utility
logger.divider(); // Prints separator line
logger.getTimestamp(); // Returns current timestamp
```

## Log File Examples

### Console Output (unchanged)
```
[INFO] [2026-02-06 06:11:18] Setting up test - Initializing page objects
[ACTION] [2026-02-06 06:11:18] Navigating to URL: https://ajs.scsetools.com/login
```

### File Output
```
2026-02-06 11:41:23 [INFO] [INFO] [2026-02-06 06:11:23] Setting up test - Initializing page objects
2026-02-06 11:41:23 [INFO] [ACTION] [2026-02-06 06:11:23] Navigating to URL: https://ajs.scsetools.com/login
```

## Benefits

1. **Centralized Logging**: All logs are stored in timestamped files for historical analysis
2. **Automatic Rotation**: Log files rotate daily, preventing disk space issues
3. **Error Isolation**: Separate error log for quick issue identification
4. **Retention Policy**: Automatic cleanup of old logs (14 days for general, 30 days for errors)
5. **No Code Changes**: Existing tests continue to work without modification
6. **Performance**: Minimal overhead, asynchronous file writing
7. **Production-Ready**: Industry-standard logging solution

## Configuration

Winston configuration is in `utils/logger.js`. Key settings:

```javascript
// Log directory
const logsDir = path.join(process.cwd(), 'logs');

// Log levels
level: 'debug'

// File rotation
datePattern: 'YYYY-MM-DD'
maxSize: '20m'
maxFiles: '14d' // or '30d' for errors
```

## Git Configuration

The `logs/` directory is added to `.gitignore` to prevent log files from being committed to version control.

## Verification

All existing tests pass without modification:
- ✅ LAND-PG-02 (Landing Page test)
- ✅ DS-SITE-STATUS-54 (Surface Emissions test)
- ✅ All other tests maintain backward compatibility

## Dependencies

```json
{
  "winston": "^3.x.x",
  "winston-daily-rotate-file": "^5.x.x"
}
```

## Troubleshooting

### Log files not created
- Ensure the application has write permissions to the project directory
- Check that Winston packages are installed: `npm install`

### Console output changed
- The console format should remain identical to the original logger
- If you see differences, check the `consoleFormat` in `utils/logger.js`

### Performance issues
- Winston uses asynchronous file writing, so performance impact should be minimal
- If concerned, you can disable file logging by removing the file transports

## Future Enhancements

Possible improvements:
- JSON format for structured logging
- Log level filtering per transport
- Remote logging (e.g., to logging service)
- Custom log formats per test suite
- Integration with Allure reporter
