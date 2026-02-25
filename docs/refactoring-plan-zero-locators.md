# Refactoring Plan: Zero Locators in Test Spec

## Goal
Remove ALL direct `page.locator()`, `page.getByRole()`, etc. from test files, following the pattern in ADMIN-USR-ACC-EXP-26.

## Current State
- 87 direct page interactions found in ADMIN-USR-ACC-EXP.spec.js
- All need to be wrapped in page object methods

## Required Page Object Methods (New/Missing)

### 1. Generic Wait Methods
```javascript
async waitForGridContent(timeout = 30000)
async waitForGridRows(timeout = 30000)  
async waitForGridRowsWithStabilization(stabilizeTimeout = 3000)
async wait(milliseconds)  // wrapper for page.waitForTimeout
```

### 2. Success Message Handling
```javascript
async waitForSaveSuccessMessageComplete(timeout = 30000)  
// Waits for both visible AND hidden states
```

### 3. Column/Header Waits
```javascript
async waitForAccessStatusColumnVisible(timeout = 30000)
async waitForPermissionColumnsVisible(timeout = 30000)
async waitForPermissionColumnsHidden(timeout = 30000)
```

### 4. Site/Group Cell Operations  
```javascript
async waitForSiteCellVisible(siteName, timeout = 30000)
async waitForGroupCellVisible(groupName, timeout = 30000)
async clickGroupCellAndWaitForSelection(groupName)
```

### 5. Excel Filter Operations
```javascript
async openExcelFilterDialog(columnName)
async clickSelectAllInExcelFilter()
async selectOptionInExcelFilter(optionName)
async deselectOptionInExcelFilter(optionName)
async clickOKInExcelFilter()
async searchInExcelFilter(searchText)
```

### 6. Keyboard Operations
```javascript
async pressEscape()
async pressEnter()
```

### 7. Grid Stabilization (Composite Methods)
```javascript
async waitForGridFullyStabilized()  
// Waits for gridcontent + rows + 3s stabilization
```

## Replacement Patterns

### Pattern 1: Success Message
**Before:**
```javascript
await page.locator('text=Successfully saved').waitFor({ state: 'visible', timeout: 30000 });
await page.locator('text=Successfully saved').waitFor({ state: 'hidden', timeout: 30000 });
logger.info('✓ Save successful');
```

**After:**
```javascript
await administrationUserPage.waitForSaveSuccessMessageComplete();
```

### Pattern 2: Grid Load
**Before:**
```javascript
await page.locator('.e-gridcontent').first().waitFor({ state: 'visible', timeout: 50000 });
logger.info('✓ User grid data loaded');
```

**After:**
```javascript
await administrationUserPage.waitForGridContent(50000);
```

### Pattern 3: Grid Rows + Stabilization
**Before:**
```javascript
await page.locator('.e-grid .e-row').first().waitFor({ state: 'visible', timeout: 30000 });
await page.waitForTimeout(3000);
logger.info('✓ Grid stabilized');
```

**After:**
```javascript
await administrationUserPage.waitForGridRowsWithStabilization();
```

### Pattern 4: Site Cell Wait
**Before:**
```javascript
await page.getByRole('gridcell', { name: siteName }).waitFor({ state: 'visible', timeout: 30000 });
logger.info('✓ Filtered site displayed');
```

**After:**
```javascript
await administrationUserPage.waitForSiteCellVisible(siteName);
```

### Pattern 5: Group Cell Click
**Before:**
```javascript
await page.getByRole('gridcell', { name: groupName }).click();
await page.locator('.e-row.e-selectionbackground').waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
logger.info(`✓ Clicked on group "${groupName}"`);
```

**After:**
```javascript
await administrationUserPage.clickGroupCellAndWaitForSelection(groupName);
```

### Pattern 6: Access Status Column Wait
**Before:**
```javascript
await page.locator('.e-gridheader').filter({ hasText: 'Access Status' }).waitFor({ state: 'visible', timeout: 30000 });
```

**After:**
```javascript
await administrationUserPage.waitForAccessStatusColumnVisible();
```

### Pattern 7: Excel Filter Dialog
**Before:**
```javascript
const excelFilterDialog = page.getByLabel('Excel filter');
await excelFilterDialog.waitFor({ state: 'visible', timeout: 10000 });
const selectAllOption = excelFilterDialog.getByText('Select All', { exact: true });
await selectAllOption.click();
logger.info('✓ Clicked Select All to deselect all items');
```

**After:**
```javascript
await administrationUserPage.clickSelectAllInExcelFilter();
```

## Implementation Order

1. ✅ Create all wrapper methods in administrationUserPage.js
2. ⏳ Replace Pattern 1 (Success Message) - 28 instances
3. ⏳ Replace Pattern 2 (Grid Content) - 15 instances
4. ⏳ Replace Pattern 3 (Grid Rows) - 20 instances
5. ⏳ Replace Pattern 4-7 (Remaining patterns)
6. ⏳ Run all tests to verify no breakage

## File Locations
- Test File: `test/Administration/User/ADMIN-USR-ACC-EXP.spec.js`
- Page Object: `pages/Administration/User/administrationUserPage.js`

## Success Criteria
- ZERO instances of `page.locator()`, `page.getByRole()`, `page.getByLabel()` in test file
- Only `page.waitForLoadState()` allowed (if necessary for Playwright internals)
- All tests pass after refactoring
