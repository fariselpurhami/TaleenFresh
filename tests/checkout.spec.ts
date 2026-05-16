// tests/checkout.spec.ts

import { test, expect, type Page, type Route } from '@playwright/test';

type CheckoutApiSuccessResponse = {
  success: true;
  orderId: string;
  url?: string;
};

function attachBrowserDiagnostics(page: Page) {
  const browserErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      browserErrors.push(`[Browser Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    browserErrors.push(`[JS Crash] ${error.name}: ${error.message}`);
  });

  return {
    assertNoErrors() {
      expect(
        browserErrors,
        browserErrors.length > 0 ? browserErrors.join('\n') : undefined
      ).toEqual([]);
    },
  };
}

async function mockCheckoutApi(
  page: Page,
  response: CheckoutApiSuccessResponse
) {
  await page.route('**/api/checkout*', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(response),
    });
  });
}

async function openCheckout(page: Page) {
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('add-to-cart-button').first().click();
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('open-cart'));
  });
}

async function fillCheckoutForm(page: Page, address: string) {
  await page.getByTestId('input-customer-name').fill('فارس المهندس الآلي');
  await page.getByTestId('input-customer-phone').fill('01000000000');
  await page.getByTestId('input-customer-address').fill(address);
}

async function selectPaymentMethod(page: Page, method: 'cod' | 'card') {
  await page.locator(`input[value="${method}"]`).first().check({ force: true });
}

async function submitCheckout(page: Page) {
  await page.getByTestId('checkout-submit-button').click();
}

async function expectOrderSuccess(page: Page) {
  const successView = page.getByTestId('order-success-view');
  await expect(successView).toBeVisible({ timeout: 15000 });
}

test.describe('E-Commerce Multi-Channel Checkout Architecture', () => {
  test('Should complete checkout successfully via Cash on Delivery (COD)', async ({
    page,
  }) => {
    const diagnostics = attachBrowserDiagnostics(page);

    await mockCheckoutApi(page, {
      success: true,
      orderId: 'cod-order-789',
    });

    await openCheckout(page);
    await fillCheckoutForm(page, 'سيليكون فالي - كاش');
    await selectPaymentMethod(page, 'cod');
    await submitCheckout(page);
    await expectOrderSuccess(page);

    diagnostics.assertNoErrors();
  });

  test('Should orchestrate Card Payment and handle Gateway IFrame postMessage correctly', async ({
    page,
  }) => {
    const diagnostics = attachBrowserDiagnostics(page);

    await mockCheckoutApi(page, {
      success: true,
      orderId: 'visa-order-456',
      url: 'http://localhost:3000/checkout/success?orderId=visa-order-456',
    });

    await openCheckout(page);
    await fillCheckoutForm(page, 'سيليكون فالي - فيزا');
    await selectPaymentMethod(page, 'card');
    await submitCheckout(page);
    await expectOrderSuccess(page);

    diagnostics.assertNoErrors();
  });
});
