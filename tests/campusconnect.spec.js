const { test, expect } = require('@playwright/test');

async function signIn(page, email) {
  await page.goto('/');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('demo1234');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test('student can see events and save a seat', async ({ page }) => {
  await signIn(page, 'student@campusconnect.demo');
  await expect(page.getByRole('heading', { name: /Good to see you/ })).toBeVisible();
  await expect(page.locator('.event-card').first()).toBeVisible();
  const reserve = page.getByRole('button', { name: 'Reserve seat' }).first();
  if (await reserve.count()) await reserve.click();
  await expect(page.getByText('My tickets')).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/student-dashboard.png', fullPage: true });
});

test('organizer can review the guest list', async ({ page }) => {
  await signIn(page, 'organizer@campusconnect.demo');
  await expect(page.getByRole('heading', { name: 'Organizer studio' })).toBeVisible();
  const guestList = page.getByRole('button', { name: 'View guest list' }).first();
  await expect(guestList).toBeVisible();
  await guestList.click();
  await expect(page.getByText('Aanya Sharma').first()).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/organizer-dashboard.png', fullPage: true });
});
