import { expect } from '@playwright/test';
import { createBdd, test as base } from 'playwright-bdd';
import { attachJson } from '../support/evidence.js';

export const test = base.extend({
  selectedPhone: async ({}, use) => {
    await use({});
  },
});

const { Given, When, Then } = createBdd(test);

Given('the smartphone catalog is open', async ({ page, baseURL }) => {
  if (!baseURL) {
    throw new Error('Set E2E_BASE_URL to the storefront test environment.');
  }
  await page.goto('/list', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: 'Smartphones', exact: true })).toBeVisible();
});

When('I open a listed smartphone', async ({ page, selectedPhone, $testInfo }) => {
  const card = page.locator('app-store-phone-card[data-product-id]').first();
  await expect(card, 'At least one smartphone in the test catalog').toBeVisible({ timeout: 45_000 });
  const name = card.getByRole('heading', { level: 3 });
  const price = card.locator('.price');
  await expect(name).toHaveText(/\S/);
  await expect(price).toHaveText(/\S/);

  selectedPhone.id = await card.getAttribute('data-product-id');
  expect(selectedPhone.id).toBeTruthy();
  selectedPhone.name = (await name.innerText()).trim();
  selectedPhone.price = (await price.innerText()).trim();
  await attachJson($testInfo, 'catalog selection.json', selectedPhone);
  await card.getByRole('link', { name: `View details for ${selectedPhone.name}`, exact: true }).click();
});

Then('the details match the selected smartphone', async ({ page, selectedPhone, $testInfo }) => {
  await expect(page).toHaveURL(url => url.pathname === `/details/${encodeURIComponent(selectedPhone.id)}`);
  const purchasePanel = page.getByRole('region', { name: selectedPhone.name, exact: true });
  const name = purchasePanel.getByRole('heading', { level: 1 });
  const price = purchasePanel.locator('.product-price');
  await expect(name).toHaveText(selectedPhone.name);
  await expect(price).toHaveText(selectedPhone.price);
  await attachJson($testInfo, 'phone details.json', {
    path: new URL(page.url()).pathname,
    name: (await name.innerText()).trim(),
    price: (await price.innerText()).trim(),
  });
});

Then('I can see its specifications', async ({ page }) => {
  const specifications = page.getByRole('region', { name: 'Specifications', exact: true });
  await expect(specifications).toBeVisible();
  await expect(specifications.locator('dd').first()).toHaveText(/\S/);
});
