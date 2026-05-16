// tests/checkout.spec.ts

import { test, expect, type Route } from '@playwright/test';

test.describe('E-Commerce Critical Flow: Checkout', () => {
  test('Should add a product to cart and complete checkout successfully', async ({ page }) => {
    await page.route('**/api/checkout*', async (route: Route) => {
      const request = route.request();

      if (request.method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          orderId: 'mock-order-123',
        }),
      });
    });

    await page.goto('http://localhost:3000/');

    const firstProductCard = page.getByTestId('add-to-cart-button').first();
    await firstProductCard.waitFor({ state: 'visible' });
    await firstProductCard.click();

    await expect(page.getByTestId('added-to-cart-icon').first()).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-cart')));

    await expect(page.getByTestId('cart-container')).toBeVisible();

    await page.getByTestId('input-customer-name').fill('فارس المهندس الآلي');
    await page.getByTestId('input-customer-phone').fill('01000000000');
    await page.getByTestId('input-customer-address').fill('سيليكون فالي، كاليفورنيا - اختبار آلي');

    const submitButton = page.getByTestId('checkout-submit-button');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByTestId('order-success-view')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('order-success-message')).toContainText('فارس');
  });
});
