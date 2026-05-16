// tests/checkout.spec.ts

import { test, expect } from '@playwright/test';

test.describe('E-Commerce Critical Flow: Checkout', () => {
  test('Should add a product to cart and complete checkout successfully', async ({ page }) => {
     await page.route('**/api/checkout*', async (route: Route) => {
    const request = route.request();

    if (request.method() !== 'POST') {
      return route.continue();
    }

    if (validatePayload) {
      try {
        const payload = request.postDataJSON();
        if (!validatePayload(payload)) {
          return route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Invalid Payload' }),
          });
        }
      } catch {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Malformed JSON' }),
        });
      }
    }

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    try {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseBody),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Target page, context or browser has been closed')
      ) {
        return;
      }
      throw error;
    }
  });
}

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
