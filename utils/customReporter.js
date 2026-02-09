const fs = require('fs');
const path = require('path');

class CustomHTMLReporter {
  constructor(options = {}) {
    this.outputFolder = options.outputFolder || 'custom-report';
    this.results = [];
  }

  onBegin(config, suite) {
    this.startTime = Date.now();
    this.config = config;
  }

  onTestEnd(test, result) {
    this.results.push({
      title: test.title,
      file: path.relative(process.cwd(), test.location.file),
      line: test.location.line,
      status: result.status,
      duration: result.duration,
      error: result.error,
      attachments: result.attachments,
      steps: result.steps,
      retries: result.retry,
      annotations: test.annotations
    });
  }

  async onEnd(result) {
    const duration = Date.now() - this.startTime;
    const stats = this.calculateStats();
    
    const html = this.generateHTML(stats, duration);
    
    if (!fs.existsSync(this.outputFolder)) {
      fs.mkdirSync(this.outputFolder, { recursive: true });
    }
    
    const reportPath = path.join(this.outputFolder, 'index.html');
    fs.writeFileSync(reportPath, html);
    
    console.log(`\n📊 Custom HTML Report generated: ${reportPath}`);
  }

  calculateStats() {
    const stats = {
      total: this.results.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0
    };

    this.results.forEach(test => {
      if (test.status === 'passed') stats.passed++;
      else if (test.status === 'failed') stats.failed++;
      else if (test.status === 'skipped') stats.skipped++;
      if (test.retries > 0 && test.status === 'passed') stats.flaky++;
    });

    return stats;
  }

  generateHTML(stats, duration) {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Execution Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 { 
            font-size: 2.5em; 
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p { 
            font-size: 1.1em; 
            opacity: 0.9;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .passed { color: #10b981; }
        .failed { color: #ef4444; }
        .skipped { color: #f59e0b; }
        .total { color: #667eea; }
        .tests {
            padding: 30px;
        }
        .test-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
            transition: all 0.3s;
        }
        .test-item:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .test-header {
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            background: #fafafa;
        }
        .test-title {
            font-size: 1.1em;
            font-weight: 600;
            flex: 1;
        }
        .test-status {
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 15px;
        }
        .status-passed {
            background: #d1fae5;
            color: #065f46;
        }
        .status-failed {
            background: #fee2e2;
            color: #991b1b;
        }
        .status-skipped {
            background: #fef3c7;
            color: #92400e;
        }
        .test-duration {
            color: #666;
            font-size: 0.9em;
            margin-left: 15px;
        }
        .test-details {
            padding: 20px;
            border-top: 1px solid #e5e7eb;
            background: white;
            display: none;
        }
        .test-item.expanded .test-details {
            display: block;
        }
        .test-file {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
            font-family: 'Courier New', monospace;
        }
        .error-box {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
        }
        .error-message {
            color: #991b1b;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
        }
        .steps {
            margin-top: 15px;
        }
        .step {
            padding: 10px;
            margin-bottom: 8px;
            background: #f9fafb;
            border-radius: 4px;
            border-left: 3px solid #667eea;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9em;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin: 20px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #059669 100%);
            transition: width 0.3s;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Playwright Test Report</h1>
            <p>Execution completed in ${(duration / 1000).toFixed(2)}s</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${passRate}%"></div>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number total">${stats.total}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number passed">${stats.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${stats.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number skipped">${stats.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat-card">
                <div class="stat-number total">${passRate}%</div>
                <div class="stat-label">Pass Rate</div>
            </div>
        </div>

        <div class="tests">
            <h2 style="margin-bottom: 20px; color: #333;">Test Results</h2>
            ${this.results.map((test, index) => `
                <div class="test-item" onclick="this.classList.toggle('expanded')">
                    <div class="test-header">
                        <div class="test-title">${this.escapeHtml(test.title)}</div>
                        <div style="display: flex; align-items: center;">
                            <span class="test-duration">${(test.duration / 1000).toFixed(2)}s</span>
                            <span class="test-status status-${test.status}">${test.status}</span>
                        </div>
                    </div>
                    <div class="test-details">
                        <div class="test-file">📄 ${this.escapeHtml(test.file)}:${test.line}</div>
                        ${test.error ? `
                            <div class="error-box">
                                <strong>❌ Error:</strong>
                                <div class="error-message">${this.escapeHtml(test.error.message || JSON.stringify(test.error, null, 2))}</div>
                            </div>
                        ` : ''}
                        ${test.steps && test.steps.length > 0 ? `
                            <div class="steps">
                                <strong>📋 Steps:</strong>
                                ${test.steps.map(step => `
                                    <div class="step">
                                        ${this.escapeHtml(step.title)} 
                                        <span style="color: #666; font-size: 0.85em;">(${(step.duration / 1000).toFixed(2)}s)</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | Powered by Playwright</p>
        </div>
    </div>

    <script>
        // Optional: Add any interactive features here
        console.log('Test Report loaded successfully');
    </script>
</body>
</html>`;
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

module.exports = CustomHTMLReporter;
