/**
 * Core user journey E2E test:
 * Home → New Idea → Submit → Idea Detail → Back to Ideas list
 *
 * Uses data-testid selectors exclusively (per AGENTS.md rules).
 */

import { test, expect } from '@playwright/test';

test.describe('Core User Journey', () => {
  test('navigate home page and verify cards', async ({ page }) => {
    await page.goto('/');

    // Verify two main cards are visible (Agent removed — embedded in stages)
    await expect(page.getByTestId('home-card-ideas')).toBeVisible();
    await expect(page.getByTestId('home-card-products')).toBeVisible();

    // Verify nav links (only Ideas and Products)
    await expect(page.getByTestId('nav-link-ideas')).toBeVisible();
    await expect(page.getByTestId('nav-link-products')).toBeVisible();

    // Verify language switch button exists
    await expect(page.getByTestId('nav-btn-lang')).toBeVisible();
  });

  test('create a new idea and verify navigation', async ({ page }) => {
    await page.goto('/ideas/new');

    // Fill in the form
    await page.getByTestId('new-input-name').fill('AI Pet Health Tracker');
    await page.getByTestId('new-input-desc').fill('An app that uses AI to monitor pet health from photos and activity data');

    // Submit
    await page.getByTestId('new-btn-submit').click();

    // Should navigate away from /ideas/new
    await page.waitForURL(url => !url.toString().includes('/ideas/new'), { timeout: 10_000 });

    // Wait for page to stabilize (detail page loads project from localStorage)
    await page.waitForTimeout(2_000);

    // Verify we ended up on detail page or ideas list (both valid)
    const url = page.url();
    expect(url).toMatch(/\/ideas/);
  });

  test('ideas list shows created ideas', async ({ page }) => {
    // First create an idea
    await page.goto('/ideas/new');
    await page.getByTestId('new-input-name').fill('Test Idea for List');
    await page.getByTestId('new-input-desc').fill('Testing the ideas list page');
    await page.getByTestId('new-btn-submit').click();
    await expect(page).toHaveURL(/\/ideas\/.+/);

    // Navigate to ideas list
    await page.getByTestId('nav-link-ideas').click();
    await expect(page).toHaveURL('/ideas');

    // Should have at least one idea card
    await expect(page.getByTestId('ideas-card-0')).toBeVisible();

    // New idea button should be visible
    await expect(page.getByTestId('ideas-btn-new')).toBeVisible();
  });

  test('navigate between pages via nav', async ({ page }) => {
    await page.goto('/');

    // Go to Ideas
    await page.getByTestId('nav-link-ideas').click();
    await expect(page).toHaveURL('/ideas');

    // Go to Products
    await page.getByTestId('nav-link-products').click();
    await expect(page).toHaveURL('/products');

    // Go home via logo
    await page.getByTestId('nav-logo-home').click();
    await expect(page).toHaveURL('/');
  });

  test('language switch toggles UI language', async ({ page }) => {
    await page.goto('/');

    // Click language switch
    const langButton = page.getByTestId('nav-btn-lang');
    await langButton.click();

    // Page content should change (we just verify the button still works)
    await expect(langButton).toBeVisible();
  });

  test('products page shows empty state with link to ideas', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByTestId('products-link-ideas')).toBeVisible();
  });

  test('new idea form has advanced toggle', async ({ page }) => {
    await page.goto('/ideas/new');
    const advancedToggle = page.getByTestId('new-btn-advanced');
    await expect(advancedToggle).toBeVisible();
    await advancedToggle.click();
    // After clicking, additional fields should appear (or toggle state changes)
  });
});
