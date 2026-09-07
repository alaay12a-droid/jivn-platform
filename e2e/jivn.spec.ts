import { expect, test, type Page, type Route } from '@playwright/test';

const content = {
  heroTitle: 'تطبيق مطعمك، في جيب عميلك',
  heroDescription: 'نصمم ونطوّر تطبيقات مطاعم تحمل هويتك.',
  primaryCta: 'ابدأ مشروعك',
  secondaryCta: 'شاهد أعمالنا',
  featuresTitle: 'كل ما يحتاجه مطعمك',
  howTitle: 'من الفكرة إلى أول طلب',
  workTitle: 'مطاعم تثق بنا',
  pricingTitle: 'استثمار واضح لنمو مطعمك',
  whyTitle: 'نحن لا نسلّمك تطبيقاً فقط',
  finalCta: 'جاهز أن تجعل مطعمك أقرب؟',
  finalCtaButton: 'تحدث مع فريق چڤن',
};

const contact = {
  whatsapp: '966500000001',
  email: 'hello@example.com',
  instagram: '@jivn',
  twitter: '',
  tiktok: '',
};

const plan = {
  id: 10,
  name: 'البداية',
  price: 299,
  currency: 'ر.س',
  billingPeriod: 'شهرياً',
  description: 'للمطاعم التي تريد حضوراً رقمياً قوياً.',
  features: ['تطبيق يحمل هويتك', 'قائمة رقمية'],
  recommended: false,
  active: true,
  sortOrder: 1,
};

const restaurant = {
  id: 20,
  name: 'مطعم الاختبار',
  logoPath: '',
  active: true,
  sortOrder: 1,
};

const marketingCounter = {
  id: 1,
  currentValue: 12500,
  displayedValue: 12512,
  minDailyIncrease: 8,
  maxDailyIncrease: 24,
  dailyIncrease: 16,
  enabled: true,
  cycleStartedAt: '2026-09-06T08:00:00.000Z',
  updatedAt: '2026-09-06T08:00:00.000Z',
};

const lead = {
  id: 30,
  restaurantName: 'مطعم النخبة',
  customerName: 'سارة أحمد',
  phone: '966511111111',
  whatsapp: '966511111111',
  email: 'sara@example.com',
  city: 'الرياض',
  branches: 2,
  businessType: 'مطعم',
  packageName: 'البداية',
  notes: 'نحتاج تطبيقاً سريعاً.',
  status: 'New',
  createdAt: '2026-09-06T08:00:00.000Z',
};

type Call = { method: string; path: string; body: Record<string, unknown> | null };

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockPublicApi(page: Page) {
  await page.route('**/api/public/site', (route) =>
    json(route, {
      content,
      features: [],
      contact,
      marketingOrderCounter: {
        displayedValue: marketingCounter.displayedValue,
        enabled: marketingCounter.enabled,
      },
    }),
  );
  await page.route('**/api/public/pricing', (route) => json(route, [plan]));
  await page.route('**/api/public/restaurants', (route) =>
    json(route, [restaurant]),
  );
}

async function mockAdminApi(page: Page) {
  let currentContent = { ...content };
  let currentContact = { ...contact };
  let plans = [{ ...plan }];
  let restaurants = [{ ...restaurant }];
  let leads = [{ ...lead }];
  let counter = { ...marketingCounter };
  let nextPlanId = 11;
  let nextRestaurantId = 21;
  const calls: Call[] = [];

  await page.route('**/api/admin/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const body = request.postDataJSON?.() ?? null;
    calls.push({ method: request.method(), path, body });

    if (request.method() === 'GET') {
      if (path.endsWith('/overview')) {
        return json(route, {
          total: leads.length,
          new: leads.filter((item) => item.status === 'New').length,
          contacted: leads.filter((item) => item.status === 'Contacted').length,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
        });
      }
      if (path.endsWith('/content')) return json(route, currentContent);
      if (path.endsWith('/contact')) return json(route, currentContact);
      if (path.endsWith('/order-counter')) return json(route, counter);
      if (path.endsWith('/plans')) return json(route, plans);
      if (path.endsWith('/restaurants')) return json(route, restaurants);
      if (path.endsWith('/leads')) return json(route, leads);
    }

    if (request.method() === 'PATCH') {
      if (path.endsWith('/content')) {
        currentContent = { ...currentContent, ...body };
        return json(route, currentContent);
      }
      if (path.endsWith('/contact')) {
        currentContact = { ...currentContact, ...body };
        return json(route, currentContact);
      }
      if (path.endsWith('/order-counter')) {
        const updateBody = body as Partial<typeof counter> & { resetDailyCycle?: boolean };
        counter = {
          ...counter,
          ...updateBody,
          displayedValue: updateBody.currentValue ?? counter.displayedValue,
          dailyIncrease: 15,
          cycleStartedAt: updateBody.resetDailyCycle
            ? '2026-09-06T12:00:00.000Z'
            : counter.cycleStartedAt,
          updatedAt: '2026-09-06T12:00:00.000Z',
        };
        return json(route, counter);
      }
      const planId = path.match(/\/plans\/(\d+)$/)?.[1];
      if (planId) {
        plans = plans.map((item) =>
          item.id === Number(planId) ? { ...item, ...body } : item,
        );
        return json(route, plans.find((item) => item.id === Number(planId)));
      }
      const restaurantId = path.match(/\/restaurants\/(\d+)$/)?.[1];
      if (restaurantId) {
        restaurants = restaurants.map((item) =>
          item.id === Number(restaurantId) ? { ...item, ...body } : item,
        );
        return json(
          route,
          restaurants.find((item) => item.id === Number(restaurantId)),
        );
      }
      const leadId = path.match(/\/leads\/(\d+)$/)?.[1];
      if (leadId) {
        leads = leads.map((item) =>
          item.id === Number(leadId) ? { ...item, ...body } : item,
        );
        return json(route, leads.find((item) => item.id === Number(leadId)));
      }
    }

    if (request.method() === 'POST' && path.endsWith('/plans')) {
      const created = { ...body, id: nextPlanId++ };
      plans.push(created as typeof plan);
      return json(route, created, 201);
    }
    if (request.method() === 'POST' && path.endsWith('/restaurants')) {
      const created = { ...body, id: nextRestaurantId++ };
      restaurants.push(created as typeof restaurant);
      return json(route, created, 201);
    }

    if (request.method() === 'DELETE') {
      const planId = path.match(/\/plans\/(\d+)$/)?.[1];
      if (planId) plans = plans.filter((item) => item.id !== Number(planId));
      const restaurantId = path.match(/\/restaurants\/(\d+)$/)?.[1];
      if (restaurantId) {
        restaurants = restaurants.filter(
          (item) => item.id !== Number(restaurantId),
        );
      }
      return route.fulfill({ status: 204 });
    }

    return json(route, { error: `Unhandled mocked admin request: ${path}` }, 500);
  });

  await page.route('**/api/storage/uploads/request-url', (route) =>
    json(route, {
      uploadURL: 'https://e2e-upload.test/logo.png',
      objectPath: '/e2e/logo.png',
    }),
  );
  await page.route('https://e2e-upload.test/logo.png', (route) =>
    route.fulfill({ status: 200 }),
  );
  await page.route('**/api/storage/e2e/logo.png', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('') }),
  );

  return calls;
}

function field(page: Page, label: string) {
  return page.locator('label').filter({ hasText: label }).last().locator('input, textarea');
}

test.describe('چڤن enquiry and admin workspace', () => {
  test('submits the Arabic enquiry form to the real API', async ({ page }) => {
    await mockPublicApi(page);
    await page.goto('/');
    await page.getByTestId('button-hero-primary').click();

    await field(page, 'اسم المطعم').fill('مطعم تجربة API');
    await field(page, 'اسمك الكريم').fill('عميل الاختبار');
    await field(page, 'رقم الجوال').fill('966522222222');
    await field(page, 'رقم الواتساب').fill('966522222222');
    await field(page, 'البريد الإلكتروني').fill('api-test@example.com');
    await field(page, 'المدينة').fill('جدة');
    await field(page, 'عدد الفروع').fill('2');
    await page.getByTestId('input-notes').fill('اختبار وصول الطلب إلى API');

    const leadResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/leads') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('button-submit-enquiry').click();
    const response = await leadResponse;
    expect(response.status()).toBe(201);
    await expect(page.getByText('وصل طلبك بنجاح')).toBeVisible();

    const savedLead = await response.json();
    expect(savedLead).toMatchObject({
      restaurantName: 'مطعم تجربة API',
      customerName: 'عميل الاختبار',
      city: 'جدة',
      branches: 2,
      notes: 'اختبار وصول الطلب إلى API',
      status: 'New',
    });
  });

  test('covers authenticated content, contact, pricing, logo, and lead actions', async ({
    page,
  }) => {
    const calls = await mockAdminApi(page);
    await page.goto('/admin?e2e-auth=1&tab=content');

    await expect(page.getByRole('heading', { name: 'صوت چڤن على الموقع' })).toBeVisible();
    await field(page, 'عنوان الواجهة').fill('عنوان اختبار محفوظ');
    await page.getByTestId('button-save-content').click();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/content') && call.method === 'PATCH'))
      .toMatchObject({ body: expect.objectContaining({ heroTitle: 'عنوان اختبار محفوظ' }) });

    await page.goto('/admin?e2e-auth=1&tab=settings');
    await expect(page.getByRole('heading', { name: 'قنوات التواصل' })).toBeVisible();
    await field(page, 'واتساب').fill('966533333333');
    await field(page, 'البريد الإلكتروني').fill('updated@example.com');
    await page.getByTestId('button-save-contact').click();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/contact') && call.method === 'PATCH'))
      .toMatchObject({
        body: expect.objectContaining({
          whatsapp: '966533333333',
          email: 'updated@example.com',
        }),
      });

    await page.goto('/admin?e2e-auth=1&tab=plans');
    await page.getByTestId('button-add-plan').click();
    await field(page, 'اسم الباقة').fill('باقة اختبار');
    await field(page, 'السعر').fill('799');
    await field(page, 'الوصف').fill('باقة منشأة من اختبار المتصفح');
    await field(page, 'المزايا، كل ميزة في سطر').fill('ميزة أولى\nميزة ثانية');
    await page.getByTestId('button-save-plan').click();
    await expect(page.getByText('باقة اختبار')).toBeVisible();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/plans') && call.method === 'POST'))
      .toMatchObject({
        body: expect.objectContaining({
          name: 'باقة اختبار',
          price: 799,
          features: ['ميزة أولى', 'ميزة ثانية'],
        }),
      });

    await page.getByTestId('button-edit-plan-11').click();
    await field(page, 'اسم الباقة').fill('باقة اختبار محدثة');
    await page.getByTestId('button-save-plan').click();
    await expect(page.getByText('باقة اختبار محدثة')).toBeVisible();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/plans/11') && call.method === 'PATCH'))
      .toMatchObject({ body: expect.objectContaining({ name: 'باقة اختبار محدثة' }) });

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId('button-delete-plan-11').click();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/plans/11') && call.method === 'DELETE'))
      .toBeTruthy();

    await page.goto('/admin?e2e-auth=1&tab=restaurants');
    await page.getByTestId('button-add-restaurant').click();
    await field(page, 'اسم المطعم').fill('شعار اختبار');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('logo'),
    });
    await expect(page.getByText('تم رفع الشعار')).toBeVisible();
    await page.getByTestId('button-save-restaurant').click();
    await expect(page.getByText('شعار اختبار')).toBeVisible();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/restaurants') && call.method === 'POST'))
      .toMatchObject({
        body: expect.objectContaining({
          name: 'شعار اختبار',
          logoPath: '/e2e/logo.png',
        }),
      });

    await page.getByTestId('button-edit-restaurant-21').click();
    await field(page, 'اسم المطعم').fill('شعار اختبار محدث');
    await page.getByTestId('button-save-restaurant').click();
    await expect(page.getByText('شعار اختبار محدث')).toBeVisible();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/restaurants/21') && call.method === 'PATCH'))
      .toMatchObject({ body: expect.objectContaining({ name: 'شعار اختبار محدث' }) });

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId('button-delete-restaurant-21').click();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/restaurants/21') && call.method === 'DELETE'))
      .toBeTruthy();

    await page.goto('/admin?e2e-auth=1&tab=leads');
    await expect(page.getByText('مطعم النخبة')).toBeVisible();
    await page.getByTestId('select-status-30').selectOption('Contacted');
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/leads/30') && call.method === 'PATCH'))
      .toMatchObject({ body: { status: 'Contacted' } });
    await expect(page.getByTestId('select-status-30')).toHaveValue('Contacted');
  });

  test('navigates between admin tabs from the mobile menu', async ({ page }) => {
    await mockAdminApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin?e2e-auth=1');

    await expect(page.getByTestId('button-admin-menu')).toBeVisible();
    await page.getByTestId('button-admin-menu').click();
    await expect(page.getByTestId('link-admin-content')).toBeVisible();

    await page.getByTestId('link-admin-content').click();
    await expect(page).toHaveURL(/\/admin\?tab=content$/);
    await expect(page.getByRole('heading', { name: 'صوت چڤن على الموقع' })).toBeVisible();
  });

  test('redirects signed-out visitors away from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('returns unauthorized for an admin API request without Clerk session', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/overview');
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  test('keeps the public counter contract limited to its display fields', async ({
    request,
  }) => {
    const response = await request.get('/api/public/site');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Object.keys(body.marketingOrderCounter).sort()).toEqual([
      'displayedValue',
      'enabled',
    ]);
    expect(body.marketingOrderCounter).toEqual({
      displayedValue: expect.any(Number),
      enabled: expect.any(Boolean),
    });
  });

  test('persists marketing counter edits and starts its public animation in view', async ({
    page,
  }) => {
    const calls = await mockAdminApi(page);
    await mockPublicApi(page);

    await page.goto('/admin?e2e-auth=1&tab=counter');
    await expect(page.getByRole('heading', { name: 'عداد الطلبات' })).toBeVisible();

    await field(page, 'إجمالي الرقم الظاهر').fill('13750');
    await field(page, 'الحد الأدنى للزيادة اليومية').fill('10');
    await field(page, 'الحد الأعلى للزيادة اليومية').fill('20');
    await page.getByText('مفعّل', { exact: true }).locator('..').getByRole('checkbox').uncheck();
    await page.getByRole('button', { name: 'حفظ التغييرات' }).click();

    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/order-counter') && call.method === 'PATCH'))
      .toMatchObject({
        body: {
          currentValue: 13750,
          minDailyIncrease: 10,
          maxDailyIncrease: 20,
          enabled: false,
          resetDailyCycle: false,
        },
      });
    await expect(field(page, 'إجمالي الرقم الظاهر')).toHaveValue('13750');
    await expect(field(page, 'الحد الأدنى للزيادة اليومية')).toHaveValue('10');
    await expect(field(page, 'الحد الأعلى للزيادة اليومية')).toHaveValue('20');
    await expect(page.getByText('مفعّل', { exact: true }).locator('..').getByRole('checkbox')).not.toBeChecked();

    await page.getByRole('button', { name: 'إعادة ضبط الدورة' }).click();
    await expect
      .poll(() => calls.find((call) => call.path.endsWith('/order-counter') && call.method === 'PATCH' && call.body?.resetDailyCycle === true))
      .toMatchObject({
        body: {
          currentValue: 13750,
          minDailyIncrease: 10,
          maxDailyIncrease: 20,
          enabled: false,
          resetDailyCycle: true,
        },
      });

    await page.reload();
    await expect(field(page, 'إجمالي الرقم الظاهر')).toHaveValue('13750');
    await expect(field(page, 'الحد الأدنى للزيادة اليومية')).toHaveValue('10');
    await expect(field(page, 'الحد الأعلى للزيادة اليومية')).toHaveValue('20');
    await expect(page.getByText('مفعّل', { exact: true }).locator('..').getByRole('checkbox')).not.toBeChecked();

    await page.goto('/');
    const counterSection = page.getByRole('region', { name: 'إحصائية تسويقية عن تطبيقات چڤن' });
    await expect(counterSection).toBeVisible();
    await expect(counterSection).toContainText('إنجاز يتزايد مع الوقت');
    await expect(counterSection).toContainText('رقم تسويقي تراكمي');
    await expect(counterSection).not.toContainText('طلبات حية');
    await counterSection.scrollIntoViewIfNeeded();
    await expect(counterSection.locator('div[dir="ltr"]')).toHaveText('+12,512');
  });
});