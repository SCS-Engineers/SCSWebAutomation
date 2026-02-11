const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

/**
 * Export Beautiful Report to PDF
 * @returns {Promise<void>}
 */
const exportReportToPdf = async () => {
  const reportPath = path.join(__dirname, '..', 'beautiful-report', 'index.html');
  
  // Check if report exists
  if (!fs.existsSync(reportPath)) {
    logger.error('❌ Report not found. Please run tests first: npm test');
    process.exit(1);
  }

  logger.info('📊 Converting Beautiful Report to PDF...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to the report
  await page.goto(`file:///${reportPath.replace(/\\/g, '/')}`);
  
  // Wait for the report to load
  await page.waitForLoadState('networkidle');
  
  // Generate PDF
  const pdfPath = path.join(__dirname, '..', 'beautiful-report', 'test-report.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10px',
      right: '10px',
      bottom: '10px',
      left: '10px'
    }
  });
  
  await browser.close();
  
  logger.info(`✅ PDF report generated successfully: ${pdfPath}`);
};

exportReportToPdf().catch((error) => {
  logger.error(`Failed to export PDF report: ${error.message}`);
  process.exit(1);
});
