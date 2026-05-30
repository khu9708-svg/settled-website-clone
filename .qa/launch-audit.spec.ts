import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:3025';

test.describe('SETTLED launch readiness smoke', () => {
  test('email login reaches the authenticated dashboard', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();

    await page.getByPlaceholder('your@email.com').fill('qa@settled.support');
    await page.getByRole('button', { name: 'Existing User Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Your dispute command center.' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Focus Mode:/ })).toBeVisible();
  });

  test('pricing select opens the checkout destination', async ({ page }) => {
    await page.route('**/api/checkout', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ url: `${baseURL}/dashboard?checkout=mocked` }),
      });
    });

    await page.goto(`${baseURL}/pricing`);
    await page.getByRole('button', { name: 'Select' }).first().click();
    await expect(page).toHaveURL(/\/login\?callbackUrl=\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  });

  test('upload control blocks non-PDF files before ingest', async ({ page }) => {
    const filePath = path.join(os.tmpdir(), `settled-non-pdf-${Date.now()}.txt`);
    await fs.writeFile(filePath, 'not a pdf');

    await page.goto(`${baseURL}/disputes`);
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await expect(page.getByText('Please upload a PDF file.')).toBeVisible();
  });

  test('mobile menu exposes every primary destination', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const header = page.locator('header');

    await expect(header.getByRole('link', { name: 'Student Loans', exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Credit', exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Business', exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Pricing', exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Log In', exact: true })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Get Started', exact: true })).toBeVisible();
  });
});
