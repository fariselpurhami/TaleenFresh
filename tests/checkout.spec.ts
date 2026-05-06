// tests/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E-Commerce Critical Flow: Checkout', () => {
  
  test('Should add a product to cart and complete checkout successfully', async ({ page }) => {
    // 1. اعتراض طلب Supabase (Mocking) لحماية قاعدة البيانات الحقيقية
    // نراقب أي طلب POST يذهب لجدول orders في Supabase ونرد بنجاح وهمي
    await page.route('**/rest/v1/orders*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 'mock-order-123', status: 'pending' }]),
        });
      } else {
        await route.continue();
      }
    });

    // 2. الدخول للصفحة الرئيسية
    await page.goto('http://localhost:3000/');

    // 3. انتظار ظهور المنتجات
    // نبحث عن أول كارت منتج (الذي يحتوي على زر الإضافة للسلة)
    const firstProductCard = page.locator('button:has(svg.lucide-shopping-cart)').first();
    await firstProductCard.waitFor({ state: 'visible' });

    // 4. إضافة المنتج للسلة
    await firstProductCard.click();

    // التأكد من ظهور علامة (صح) كدليل على تفاعل الـ UI
    await expect(page.locator('button:has(svg.lucide-check)').first()).toBeVisible();

    // 5. فتح السلة باستخدام الـ Custom Event الدقيق الخاص بك
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('open-cart')));

    // انتظار ظهور السلة (شاشة الخلفية المعتمة)
    await expect(page.locator('text=سلة المشتريات').first()).toBeVisible();

    // 6. تعبئة بيانات العميل بناءً على حقول الإدخال الحقيقية في نموذجك
    // نستخدم الـ placeholder أو نوع الحقل كمحدد صلب
        // نستخدم الـ placeholder كمحدد دقيق لا يخطئ
    await page.getByPlaceholder('الاسم الثلاثي').fill('فارس المهندس الآلي');
    await page.getByPlaceholder('رقم الهاتف').fill('01000000000');
    // إذا لم يكن هناك placeholder محدد للعنوان، يمكنك تحديد الـ textarea الموجودة داخل الفورم تحديداً
    await page.locator('form textarea, #delivery-form textarea').first().fill('سيليكون فالي، كاليفورنيا - اختبار آلي');
    // 7. تأكيد الطلب
    const submitButton = page.locator('button:has-text("تأكيد الطلب")');
    await expect(submitButton).toBeEnabled(); // التأكد أن الزر فعال وليس Disabled
    await submitButton.click();

    // 8. التحقق النهائي من شاشة النجاح
    await expect(page.locator('text=تم استلام طلبك!')).toBeVisible({ timeout: 5000 });
    
    // التأكد من ظهور اسم العميل في شاشة النجاح
    await expect(page.locator('text=جاري التجهيز الآن يا فارس')).toBeVisible();
  });

});
