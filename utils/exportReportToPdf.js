const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function exportReportToPdf() {
  const reportPath = path.join(__dirname, '..', 'beautiful-report', 'index.html');
  
  // Check if report exists
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Report not found. Please run tests first: npm test');
    process.exit(1);
  }

  console.log('📊 Converting Beautiful Report to PDF...');
  
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
  
  console.log(`✅ PDF report generated successfully: ${pdfPath}`);
}

exportReportToPdf().catch(console.error);
