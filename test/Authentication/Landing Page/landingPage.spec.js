const { test, expect } = require('@playwright/test');
const TestSetup = require('../../../utils/testSetup');
const credentials = require('../../../utils/credentials');
const logger = require('../../../utils/logger');

test.describe('SCS Landing Page Tests', () => {
  let testSetup;
  let loginPage;
  let landingPage;

  test.beforeEach(async ({ page }) => {
    testSetup = new TestSetup();
    await testSetup.initialize(page);
    loginPage = testSetup.getLoginPage();
    landingPage = testSetup.getLandingPage();
  });

  test('LAND-PG-01 - Verify navigation to https://scsrmc.com/', async ({ page, context }) => {
    logger.testStart('LAND-PG-01 - Verify navigation to SCSRMC.COM');
    
    logger.step('Clicking on SCSRMC.COM link');
    const newPage = await landingPage.clickScsRmcLink(context);
    
    logger.step('Verifying navigation to https://scsrmc.com/');
    const isCorrectUrl = await landingPage.verifyScsRmcUrl(newPage);
    logger.verify('Navigated to SCSRMC.COM', isCorrectUrl);
    expect(isCorrectUrl).toBeTruthy();
    
    logger.step('Verifying page elements on SCSRMC.COM');
    
    const hasSignInText = await landingPage.isSignInTextVisible(newPage);
    logger.info(`"Sign in to your account" text visible: ${hasSignInText}`);
    logger.verify('"Sign in to your account" text is visible', hasSignInText);
    expect(hasSignInText).toBeTruthy();
    
    const hasNeedHelpText = await landingPage.isNeedHelpTextVisible(newPage);
    logger.info(`"Need Help?" text visible: ${hasNeedHelpText}`);
    logger.verify('"Need Help?" text is visible', hasNeedHelpText);
    expect(hasNeedHelpText).toBeTruthy();
    
    // Close the new tab
    logger.info('Closing the new tab');
    await newPage.close();
    
    logger.testEnd('LAND-PG-01 - Verify navigation to SCSRMC.COM', 'PASSED');
  });

  test('LAND-PG-02 - Verify Forgot Password or Username functionality', async ({ page }) => {
    logger.testStart('LAND-PG-02 - Verify Forgot Password or Username functionality');
    
    logger.step('Clicking on Forgot username or password link');
    await landingPage.clickForgotPasswordLink();
    
    logger.step('Verifying Forgot Password popup elements');
    
    const hasSupportTitle = await landingPage.isSupportTitleVisible();
    logger.info(`"SCSeTools Customer Support" title visible: ${hasSupportTitle}`);
    logger.verify('"SCSeTools Customer Support" title is visible', hasSupportTitle);
    expect(hasSupportTitle).toBeTruthy();
    
    const hasInstructionText = await landingPage.isInstructionTextVisible();
    logger.info(`Instruction text visible: ${hasInstructionText}`);
    logger.verify('Instruction text is visible', hasInstructionText);
    expect(hasInstructionText).toBeTruthy();
    
    logger.testEnd('LAND-PG-02 - Verify Forgot Password or Username functionality', 'PASSED');
  });
});
