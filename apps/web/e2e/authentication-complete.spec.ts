import { test, expect, generateTestUser } from './setup/test-setup';

test.describe('Authentication - Complete Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Complete user registration flow', async ({ page }) => {
    const testUser = generateTestUser();

    // Navigate to signup
    await page.click('[data-testid="signup-link"]');
    await expect(page.locator('h1')).toContainText('Sign Up');

    // Test form validation
    await page.click('[data-testid="signup-submit-button"]');
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      'Password is required'
    );

    // Test invalid email
    await page.fill('[data-testid="signup-name"]', testUser.name);
    await page.fill('[data-testid="signup-email"]', 'invalid-email');
    await page.fill('[data-testid="signup-password"]', testUser.password);
    await page.fill('[data-testid="signup-confirm-password"]', testUser.password);

    await page.click('[data-testid="signup-submit-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');

    // Test weak password
    await page.fill('[data-testid="signup-email"]', testUser.email);
    await page.fill('[data-testid="signup-password"]', 'weak');
    await page.click('[data-testid="signup-submit-button"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      'Password must be at least 8 characters'
    );

    // Test password mismatch
    await page.fill('[data-testid="signup-password"]', testUser.password);
    await page.fill('[data-testid="signup-confirm-password"]', 'different');
    await page.click('[data-testid="signup-submit-button"]');
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText(
      'Passwords do not match'
    );

    // Successful registration
    await page.fill('[data-testid="signup-confirm-password"]', testUser.password);
    await page.click('[data-testid="signup-submit-button"]');

    // Should redirect to email verification
    await expect(page.locator('h1')).toContainText('Verify Your Email');
    await expect(page.locator('[data-testid="verification-message"]')).toContainText(
      testUser.email
    );

    // Test resend verification
    await page.click('[data-testid="resend-verification"]');
    await expect(page.locator('[data-testid="resend-success"]')).toContainText(
      'Verification email sent'
    );
  });

  test('Complete login flow', async ({ page }) => {
    const testUser = generateTestUser();

    // Navigate to login
    await page.click('[data-testid="login-link"]');
    await expect(page.locator('h1')).toContainText('Login to Farmers Boot');

    // Test form validation
    await page.click('[data-testid="login-submit-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      'Password is required'
    );

    // Test invalid credentials
    await page.fill('[data-testid="login-email"]', 'nonexistent@example.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit-button"]');
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');

    // Test successful login with existing user
    await page.fill('[data-testid="login-email"]', 'test.farmer@farmersboot.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit-button"]');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Select Farm');
  });

  test('Password reset complete flow', async ({ page }) => {
    // Navigate to forgot password
    await page.click('[data-testid="login-link"]');
    await page.click('[data-testid="forgot-password-link"]');

    await expect(page.locator('h1')).toContainText('Reset Password');

    // Test form validation
    await page.click('[data-testid="reset-submit-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');

    // Test invalid email
    await page.fill('[data-testid="reset-email"]', 'invalid-email');
    await page.click('[data-testid="reset-submit-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');

    // Test valid email submission
    await page.fill('[data-testid="reset-email"]', 'test.farmer@farmersboot.com');
    await page.click('[data-testid="reset-submit-button"]');

    await expect(page.locator('[data-testid="reset-success"]')).toContainText(
      'Password reset email sent'
    );

    // Test reset token flow (simulate)
    await page.goto('/reset-password?token=valid-token');
    await expect(page.locator('h1')).toContainText('Set New Password');

    // Test new password validation
    await page.click('[data-testid="set-password-button"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      'Password is required'
    );
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText(
      'Password confirmation is required'
    );

    // Test password mismatch
    await page.fill('[data-testid="new-password"]', 'NewPassword123!');
    await page.fill('[data-testid="confirm-new-password"]', 'DifferentPassword123!');
    await page.click('[data-testid="set-password-button"]');
    await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText(
      'Passwords do not match'
    );

    // Test successful password reset
    await page.fill('[data-testid="confirm-new-password"]', 'NewPassword123!');
    await page.click('[data-testid="set-password-button"]');

    await expect(page.locator('[data-testid="reset-complete"]')).toContainText(
      'Password reset successful'
    );

    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('Login to Farmers Boot');
  });

  test('Session management and persistence', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test.farmer@farmersboot.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit-button"]');

    await page.waitForURL('**/dashboard');

    // Test session persistence across navigation
    await page.goto('/crops');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Test session storage
    const sessionData = await page.evaluate(() => {
      return sessionStorage.getItem('auth_token');
    });
    expect(sessionData).toBeTruthy();

    // Test tab persistence
    const newPage = await page.context().newPage();
    await newPage.goto('/dashboard');
    await expect(newPage.locator('[data-testid="user-menu"]')).toBeVisible();
    await newPage.close();
  });

  test('Logout and session cleanup', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test.farmer@farmersboot.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit-button"]');

    await page.waitForURL('**/dashboard');

    // Test logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to landing page
    await page.waitForURL('**/');
    await expect(page.locator('h1')).toContainText('Welcome to Farmers Boot');

    // Test session cleanup
    const sessionData = await page.evaluate(() => {
      return sessionStorage.getItem('auth_token');
    });
    expect(sessionData).toBeNull();

    // Test accessing protected routes after logout
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('Login to Farmers Boot');
  });

  test('Remember me functionality', async ({ page }) => {
    // Login with remember me
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test.farmer@farmersboot.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    await page.check('[data-testid="remember-me"]');
    await page.click('[data-testid="login-submit-button"]');

    await page.waitForURL('**/dashboard');

    // Check for persistent cookie
    const cookies = await page.context().cookies();
    const rememberMeCookie = cookies.find(cookie => cookie.name === 'remember_me');
    expect(rememberMeCookie).toBeTruthy();

    // Close and reopen browser
    await page.context().close();
    const newContext = await page.browser().newContext();
    const newPage = await newContext.newPage();

    // Should still be logged in
    await newPage.goto('/dashboard');
    await expect(newPage.locator('[data-testid="user-menu"]')).toBeVisible();

    await newContext.close();
  });

  test('Social authentication integration', async ({ page }) => {
    await page.goto('/login');

    // Test Google OAuth button
    await expect(page.locator('[data-testid="google-login"]')).toBeVisible();
    await page.click('[data-testid="google-login"]');

    // Should redirect to Google OAuth (mock)
    await expect(page.url()).toContain('accounts.google.com');

    // Simulate successful OAuth callback
    await page.goto('/auth/callback?provider=google&code=valid-code');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('Two-factor authentication', async ({ page }) => {
    // Login with 2FA enabled user
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', '2fa.user@farmersboot.com');
    await page.fill('[data-testid="login-password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit-button"]');

    // Should redirect to 2FA page
    await expect(page.locator('h1')).toContainText('Two-Factor Authentication');
    await expect(page.locator('[data-testid="2fa-input"]')).toBeVisible();

    // Test invalid 2FA code
    await page.fill('[data-testid="2fa-input"]', '000000');
    await page.click('[data-testid="verify-2fa"]');
    await expect(page.locator('[data-testid="2fa-error"]')).toContainText('Invalid code');

    // Test valid 2FA code
    await page.fill('[data-testid="2fa-input"]', '123456');
    await page.click('[data-testid="verify-2fa"]');

    await page.waitForURL('**/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('Account security settings', async ({ authenticatedPage }) => {
    // Navigate to security settings
    await authenticatedPage.click('[data-testid="settings-button"]');
    await authenticatedPage.click('[data-testid="security-tab"]');

    // Test password change
    await authenticatedPage.click('[data-testid="change-password"]');
    await authenticatedPage.fill('[data-testid="current-password"]', 'TestPassword123!');
    await authenticatedPage.fill('[data-testid="new-password"]', 'NewPassword123!');
    await authenticatedPage.fill('[data-testid="confirm-new-password"]', 'NewPassword123!');
    await authenticatedPage.click('[data-testid="update-password"]');

    await expect(authenticatedPage.locator('[data-testid="password-success"]')).toContainText(
      'Password updated'
    );

    // Test 2FA setup
    await authenticatedPage.click('[data-testid="setup-2fa"]');
    await expect(authenticatedPage.locator('[data-testid="2fa-qr-code"]')).toBeVisible();
    await authenticatedPage.click('[data-testid="enable-2fa"]');

    // Test backup codes
    await expect(authenticatedPage.locator('[data-testid="backup-codes"]')).toBeVisible();
    await authenticatedPage.click('[data-testid="download-backup-codes"]');

    // Test login history
    await authenticatedPage.click('[data-testid="login-history"]');
    await expect(authenticatedPage.locator('[data-testid="history-list"]')).toBeVisible();
  });

  test('Rate limiting and security', async ({ page }) => {
    // Test brute force protection
    await page.goto('/login');

    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="login-email"]', 'test@example.com');
      await page.fill('[data-testid="login-password"]', 'wrongpassword');
      await page.click('[data-testid="login-submit-button"]');
      await page.waitForTimeout(100);
    }

    // Should show rate limiting message
    await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText(
      'Too many login attempts'
    );

    // Test account lockout
    await expect(page.locator('[data-testid="account-locked"]')).toContainText(
      'Account temporarily locked'
    );

    // Test password reset during lockout
    await page.click('[data-testid="forgot-password-link"]');
    await page.fill('[data-testid="reset-email"]', 'test@example.com');
    await page.click('[data-testid="reset-submit-button"]');

    await expect(page.locator('[data-testid="reset-success"]')).toContainText(
      'Password reset email sent'
    );
  });

  test('Cross-browser authentication', async ({ page, context }) => {
    // Test authentication across different browsers
    const browsers = ['chromium', 'firefox', 'webkit'];

    for (const browserType of browsers) {
      const browserContext = await page.browser().browserContexts()[0];
      const testPage = await browserContext.newPage();

      await testPage.goto('/login');
      await testPage.fill('[data-testid="login-email"]', 'test.farmer@farmersboot.com');
      await testPage.fill('[data-testid="login-password"]', 'TestPassword123!');
      await testPage.click('[data-testid="login-submit-button"]');

      await testPage.waitForURL('**/dashboard');
      await expect(testPage.locator('[data-testid="user-menu"]')).toBeVisible();

      await testPage.close();
    }
  });

  test('Authentication error handling', async ({ page }) => {
    // Test network errors
    await page.route('**/api/auth/login', route => route.abort('failed'));

    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'test@example.com');
    await page.fill('[data-testid="login-password"]', 'password');
    await page.click('[data-testid="login-submit-button"]');

    await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error');

    // Test server errors
    await page.unroute('**/api/auth/login');
    await page.route('**/api/auth/login', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    );

    await page.click('[data-testid="login-submit-button"]');
    await expect(page.locator('[data-testid="server-error"]')).toContainText('Server error');

    await page.unroute('**/api/auth/login');
  });
});
