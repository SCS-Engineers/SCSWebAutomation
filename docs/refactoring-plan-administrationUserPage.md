# Refactoring Plan: administrationUserPage.js

**Date:** March 10, 2026  
**File:** `pages/Administration/User/administrationUserPage.js`  
**Current Size:** 4,614 lines, 129 methods  
**Target:** Break into 10-12 smaller, focused modules (~300-500 lines each)

---

## Analysis Summary

### Current State
- **Total Methods:** 129
- **Lines of Code:** 4,614
- **Complexity:** Very High
- **Maintainability:** Low (single-responsibility principle violated)
- **Test Coverage:** Good (19 comprehensive test cases)

### Problems
1. **Massive file size** - Makes navigation and maintenance difficult
2. **Mixed concerns** - Navigation, filtering, grid operations, calendar ops, etc. all in one class
3. **Difficult to test** - Hard to isolate functionality for unit testing
4. **Code duplication** - Similar patterns repeated across methods
5. **Cognitive overhead** - Too many responsibilities in one class

---

## Proposed Module Structure

### Module 1: UserNavigationOperations (~250 lines)
**Responsibility:** Navigation, page verification, basic user list ops

**Methods (7):**
- `navigateToAdministrationTab()`
- `verifySiteListVisible()`
- `navigateToUsersList()`
- `navigateToNotifications()`
- `clickEditButton()`
- `expandUserListSection()`
- `openSiteAccessPermissions()`

---

### Module 2: UserFilterOperations (~500 lines)
**Responsibility:** All filtering operations on grids

**Methods (11):**
- `filterByFirstName(firstName)`
- `filterByFirstNameWithRetry(userName, maxAttempts = 3)`
- `filterBySiteName(siteName)`
- `filterByAccessibleSites(siteName)`
- `filterByGroupName(groupName)`
- `filterByEventType(eventType)`
- `filterColumnByText(columnName, searchText)`
- `clearColumnFilter(columnName)`
- `clickAccessStatusFilterIcon()`
- `clickColumnFilterIcon(columnName)`
- `selectAccessStatusFilter(filterOption)`

---

### Module 3: SiteAccessOperations (~400 lines)
**Responsibility:** Grant, remove, verify site access

**Methods (13):**
- `enableShowSitesWithNoAccess()`
- `enableShowSitesWithAccessGranted()`
- `ensureShowSitesWithAccessGrantedIsSelected()`
- `verifyShowSitesWithAccessSelected()`
- `grantAccessToSite(siteName)`
- `removeAccessForSite(siteName)`
- `clickSiteCell(siteName)`
- `grantAccessToMultipleSites(siteNames)`
- `selectMultipleSites(siteNames)`
- `bulkRemoveSelectedSites(firstSiteName)`
- `verifySitesHaveExpirationDates(siteNames)`
- `verifySitesVisibleInDropdown(expectedSites)`
- `verifyOnlySiteVisibleInDropdown(siteName)`

---

### Module 4: GroupAccessOperations (~350 lines)
**Responsibility:** Group access management

**Methods (6):**
- `enableShowGroupsWithNoAccess()`
- `enableShowGroupsWithAccessGranted()`
- `verifyShowGroupsWithAccessSelected()`
- `grantAccessToGroup(groupName)`
- `removeAccessForGroup(groupName)`
- `clickGroupCell(groupName)`

---

### Module 5: DatePickerOperations (~600 lines)
**Responsibility:** Calendar/datepicker interactions (COMPLEX)

**Methods (14):**
- `openExpirationDateCalendar()`
- `getTodayDateFromCalendar()`
- `clickTodayInCalendar()`
- `clickDateInCalendar(daysFromToday)`
- `closeCalendar()`
- `getCurrentMonthYearFromCalendar()`
- `navigateCalendarToYear(targetYear)`
- `selectMonthInCalendar(monthIndex)`
- `getDisabledCalendarDatesBefore(beforeDate)`
- `getDisabledCalendarDatesAfter(afterDate)`
- `getMaxAllowedExpirationDate()`
- `verifyAllDatesAreDisabled(dateCells)`
- `editAccessExpirationDateCell(siteName)` (triggers calendar)

---

### Module 6: AccessExpirationOperations (~500 lines)
**Responsibility:** Access expiration date management (non-calendar)

**Methods (12):**
- `setAccessExpirationDateToToday(siteName)`
- `setAccessExpirationDateToYesterday(siteName)`
- `setAccessExpirationDate(siteName, daysFromToday)`
- `clearAccessExpirationDate(siteName)`
- `clearAccessExpirationDateWithRetry(siteName, maxRetries = 3)`
- `getAccessExpirationDate(siteName)`
- `verifyAccessExpirationDateIsOneYearFromToday(siteName)`
- `verifyAccessExpirationDateIsToday(siteName)`
- `verifyAccessExpirationDateIsEmpty(siteName)`
- `verifyAccessExpirationDateExists(siteName, expectedDate)`
- `verifyExpirationDateIsNotBeforeToday(siteName, todayDate)`
- `verifyExpirationDateRemainsAfterModuleChange(siteName, iterations = 3)`

---

### Module 7: AccessStatusOperations (~650 lines)
**Responsibility:** Access status verification and display

**Methods (8):**
- `getAccessStatus(siteName)`
- `verifyAccessStatusIsActive(siteName)`
- `verifyAccessStatusIsActiveWithColor(siteName)`
- `verifyAccessStatusIsExpired(siteName)`
- `verifyAccessStatusIsExpiringSoon(siteName)`
- `verifyAccessStatusIsEmpty(siteName)`
- `verifyAccessStatusFilterOptions()`

---

### Module 8: PermissionColumnOperations (~400 lines)
**Responsibility:** Permission column visibility and module changes

**Methods (7):**
- `verifyShowPermissionColumnsChecked()`
- `enableShowPermissionColumns()`
- `disableShowPermissionColumns()`
- `disableShowPermissionColumnsWithRetry()`
- `verifyPermissionColumnsExpanded()`
- `verifyPermissionColumnsCollapsed()`
- `changePermissionModuleToRandom()`

---

### Module 9: GridOperations (~600 lines)
**Responsibility:** Grid loading, waits, display verification

**Methods (20):**
- `wait(milliseconds)`
- `waitForPageReady(timeout = 30000)`
- `waitForUserGridToLoad()`
- `waitForUserGridFilterReady()`
- `waitForSiteAccessGridToLoad()`
- `waitForSitesInGrid(siteNames, timeout = 15000)`
- `waitForGridContent(timeout = 30000)`
- `waitForGridRows(timeout = 30000)`
- `waitForSiteCellVisible(siteName, timeout = 30000)`
- `waitForGroupCellVisible(groupName, timeout = 30000)`
- `waitForAccessStatusColumn(timeout = 30000)`
- `waitForGridRowsWithStabilization(initialWait, stabilizationWait)`
- `waitForGridStabilization(timeout = 30000)`
- `waitForDOMContentLoaded()`
- `waitForPermissionColumnHeaders()`
- `waitForPermissionColumnsHidden()`
- `pressEscape(waitAfter = 1000)`
- `getSiteAccessGridHeaders()`
- `getExcelFilterDialog()`
- `getVisibleRowCount()`
- `getClearFilterOption()`
- `getFirstSiteNameFromGrid()`
- `captureFirstRowSiteName()`
- `verifyFilteredSites(expectedSites, filterName)`
- `verifyNoRecordsToDisplay()`
- `verifyNoAccessMessageVisible()`

---

### Module 10: SaveOperations (~200 lines)
**Responsibility:** Save actions and success/error verification

**Methods (4):**
- `clickSaveButton()`
- `waitForSuccessMessage(timeout = 30000)`
- `verifySaveSuccessMessage()`
- `verifyErrorDialogWithMessage(expectedMessage, timeout = 30000)`

---

### Module 11: NotificationOperations (~250 lines)
**Responsibility:** Notification grid and file viewer operations

**Methods (4):**
- `waitForNotificationsGridToLoad()`
- `clickFileViewerIcon()`
- `validateNotificationContent(siteName)`

---

### Module 12: UserStatusReportOperations (~650 lines)
**Responsibility:** User status report page operations

**Methods (17 + 9 private helpers):**
- `verifySiteInDropdown(siteName, dropdownId = null)`
- `clickAdminToolbar()`
- `clickUserStatus()`
- `verifyUsersTextVisible()`
- `clickCreateReport()`
- `verifyUserStatusReportPage()`
- `verifyAccessExpirationColumn()`
- `verifyAccessExpirationAfterLastLogonDate()`
- `getAccessExpirationDateValue()`
- `verifyDateFormatMatches(dateValue)`
- `_verifyTreeItemEnabled(treeItem)` [PRIVATE]
- `_waitForPageLoad()` [PRIVATE]
- `_scrollToRightMost()` [PRIVATE]
- `_verifyColumnHeaderText(headerText)` [PRIVATE]
- `_findColumnPositions()` [PRIVATE]
- `_getNex tDivText(allDivs, currentIndex)` [PRIVATE]
- `_findAccessExpirationHeader()` [PRIVATE]
- `_findDateValuesAfterIndex(startIndex, maxScan)` [PRIVATE]
- `_findReferenceDates()` [PRIVATE]
- `_findDateForColumn(headerText, maxScan)` [PRIVATE]
- `_findDateForSplitColumn(firstLine, secondLine, maxScan)` [PRIVATE]

---

## Implementation Strategy

### Phase 1: Extract Modules (5 modules at a time)
**Goal:** Create separate module files while maintaining main class

**Approach:**
1. Create module files in `pages/Administration/User/modules/`
2. Each module extends BasePage (for logger, page access)
3. Main class delegates to modules via composition
4. Maintain backward compatibility

**File Structure:**
```
pages/Administration/User/
├── administrationUserPage.js (main facade, ~300 lines)
├── modules/
│   ├── UserNavigationOperations.js
│   ├── UserFilterOperations.js
│   ├── SiteAccessOperations.js
│   ├── GroupAccessOperations.js
│   ├── DatePickerOperations.js
│   ├── AccessExpirationOperations.js
│   ├── AccessStatusOperations.js
│   ├── PermissionColumnOperations.js
│   ├── GridOperations.js
│   ├── SaveOperations.js
│   ├── NotificationOperations.js
│   └── UserStatusReportOperations.js
```

### Phase 2: Test Validation
**After each module extraction:**
1. Run tests that use extracted methods
2. Verify 100% pass rate
3. Fix any issues immediately
4. Document extraction

### Phase 3: Optimize & Document
**After all modules extracted:**
1. Identify and remove code duplication
2. Optimize shared operations
3. Update JSDoc comments
4. Create module usage guide

---

## Facade Pattern Implementation

### Main Class (administrationUserPage.js)
```javascript
const BasePage = require('../../basePage');
const UserNavigationOperations = require('./modules/UserNavigationOperations');
const UserFilterOperations = require('./modules/UserFilterOperations');
// ... other modules

class AdministrationUserPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Initialize modules
    this.navigation = new UserNavigationOperations(page);
    this.filter = new UserFilterOperations(page);
    this.siteAccess = new SiteAccessOperations(page);
    // ... other modules
  }
  
  // Delegate methods (maintain backward compatibility)
  async navigateToAdministrationTab() {
    return this.navigation.navigateToAdministrationTab();
  }
  
  async filterByFirstName(firstName) {
    return this.filter.filterByFirstName(firstName);
  }
  
  // ... 127 other delegate methods
}

module.exports = AdministrationUserPage;
```

### Module Example (UserNavigationOperations.js)
```javascript
const BasePage = require('../../../basePageconst LOCATORS = require('../../../constants/administrationUserPage.constants');

class UserNavigationOperations extends BasePage {
  async navigateToAdministrationTab() {
    this.logger.action('Navigating to ADMINISTRATION tab');
    await this.click(LOCATORS.administrationTab);
    await this.page.waitForLoadState('networkidle');
    this.logger.info('✓ Navigated to ADMINISTRATION tab');
  }
  
  // ... other navigation methods
}

module.exports = UserNavigationOperations;
```

---

## Benefits

1. **Maintainability:** Each module ~300-500 lines (vs 4,614)
2. **Single Responsibility:** Each module has one clear purpose
3. **Testability:** Can test modules independently
4. **Backward Compatibility:** Existing tests work without changes
5. **Code Clarity:** Easier to find and modify specific functionality
6. **Reduced Cognitive Load:** Work on one module at a time
7. **Better Collaboration:** Multiple devs can work on different modules

---

## Risks & Mitigation

### Risk 1: Test Failures
**Mitigation:** Extract and test modules one at a time, run full test suite after each

### Risk 2: Import/Dependency Issues
**Mitigation:** Each module requires BasePage and LOCATORS, test imports immediately

### Risk 3: Shared State
**Mitigation:** Modules should be stateless, only use page and logger from BasePage

### Risk 4: Performance Overhead
**Mitigation:** Minimal - method delegation is negligible overhead in Node.js

---

## Execution Plan

### Batch 1 (Low Risk - Simple modules)
1. SaveOperations (4 methods, ~200 lines)
2. UserNavigationOperations (7 methods, ~250 lines)
3. NotificationOperations (4 methods, ~250 lines)

**Test After Batch 1:** Run ADMIN-USR-ACC-EXP-01, 10, 32

---

### Batch 2 (Medium Risk - Filter operations)
4. UserFilterOperations (11 methods, ~500 lines)
5. GroupAccessOperations (6 methods, ~350 lines)

**Test After Batch 2:** Run ADMIN-USR-ACC-EXP-12 (filters), 14, 15

---

### Batch 3 (Medium-High Risk - Site access)
6. SiteAccessOperations (13 methods, ~400 lines)
7. PermissionColumnOperations (7 methods, ~400 lines)

**Test After Batch 3:** Run ADMIN-USR-ACC-EXP-01, 13, 16

---

### Batch 4 (High Risk - Complex operations)
8. DatePickerOperations (14 methods, ~600 lines)
9. AccessExpirationOperations (12 methods, ~500 lines)
10. AccessStatusOperations (8 methods, ~650 lines)

**Test After Batch 4:** Run ADMIN-USR-ACC-EXP-03, 05, 06, 07, 08

---

### Batch 5 (Medium Risk - Remaining)
11. GridOperations (26 methods, ~600 lines)
12. UserStatusReportOperations (26 methods, ~650 lines)

**Test After Batch 5:** Run ADMIN-USR-ACC-EXP-11, 34, full test suite

---

## Timeline Estimate

- **Batch 1:** 30-45 minutes (3 simple modules + testing)
- **Batch 2:** 45-60 minutes (2 medium modules + testing)
- **Batch 3:** 45-60 minutes (2 medium modules + testing)
- **Batch 4:** 60-90 minutes (3 complex modules + extensive testing)
- **Batch 5:** 60-75 minutes (2 large modules + full test suite)
- **Total:** 4-5 hours

---

## Success Criteria

✅ All 129 methods extracted to appropriate modules  
✅ 100% test pass rate maintained throughout  
✅ Main class acts as facade, delegates to modules  
✅ Each module < 650 lines  
✅ No code duplication within modules  
✅ All modules extend BasePage  
✅ Backward compatibility maintained (existing test code unchanged)  
✅ Documentation updated

---

## Alternative: Incremental Refactoring

If full refactoring is too risky, consider extracting ONE high-value module:

**Option A: DatePickerOperations** (14 methods, ~600 lines)
- Most complex calendar logic
- Self-contained functionality
- High reusability potential

**Option B: UserFilterOperations** (11 methods, ~500 lines)
- Used by most tests
- Clear boundaries
- Medium complexity

---

## Recommendation

**Start with Batch 1** (SaveOperations, UserNavigationOperations, NotificationOperations):
- Low risk, simple modules
- Quick win to validate approach
- Builds confidence for more complex extractions
- Can stop after Batch 1 if needed (12% reduction already)

**User Preference:** Ultra-conservative with zero test failure tolerance  
**Best Approach:** One module at a time, test immediately, rollback if any failure
