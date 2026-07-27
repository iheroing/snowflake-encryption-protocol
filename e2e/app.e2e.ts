import { expect, test } from '@playwright/test';

function durationToMilliseconds(value: string): number {
  if (value.endsWith('ms')) return Number.parseFloat(value);
  if (value.endsWith('s')) return Number.parseFloat(value) * 1_000;
  return Number.POSITIVE_INFINITY;
}

test('keyboard flow reaches a sealed snow letter and audio uses the mounted path', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle('雪花密语 | Snowflake Whisper');
  await expect(page.getByRole('heading', { name: '写一封 只为一人盛开的雪信' })).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '雪花标本馆' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '切换为英文' })).toBeFocused();
  await page.keyboard.press('Tab');
  const soundButton = page.getByRole('button', { name: '开启环境音' });
  await expect(soundButton).toBeFocused();

  const ambienceResponse = page.waitForResponse((response) => (
    response.url().endsWith('/snowflake/ambience.mp3') && response.status() < 400
  ));
  await page.keyboard.press('Enter');
  await ambienceResponse;

  await page.keyboard.press('Tab');
  const sealButton = page.getByRole('button', { name: '轻触封印，让心语开始凝结' });
  await expect(sealButton).toBeFocused();
  await page.keyboard.press('Enter');

  const message = page.getByRole('textbox', { name: '雪信正文' });
  await expect(message).toBeFocused();
  await message.fill('一条由浏览器回归创建的雪信');

  const submit = page.getByRole('button', { name: '凝成一封雪信' });
  await submit.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '你的雪信，正在等一个人。' })).toBeVisible();
  await expect(page.getByLabel('交给收信人的链接')).toHaveValue(/\/snowflake\/s\//);
});

test('mobile and reduced-motion modes remain usable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');

  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= window.innerWidth
  ))).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ))).toBe(true);

  const motionDurations = await page.locator('.landing-seal').evaluate((element) => {
    const style = getComputedStyle(element);
    return { animation: style.animationDuration, transition: style.transitionDuration };
  });
  expect(durationToMilliseconds(motionDurations.animation)).toBeLessThanOrEqual(0.001);
  expect(durationToMilliseconds(motionDurations.transition)).toBeLessThanOrEqual(0.001);

  const sealButton = page.getByRole('button', { name: '轻触封印，让心语开始凝结' });
  await sealButton.focus();
  await page.keyboard.press('Enter');
  const message = page.getByRole('textbox', { name: '雪信正文' });
  await expect(message).toBeVisible();
  await expect(message).toBeInViewport();
  await message.fill('移动端可访问性回归');
  const submit = page.getByRole('button', { name: '凝成一封雪信' });
  await submit.focus();
  await expect(submit).toBeInViewport();
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth <= window.innerWidth
  ))).toBe(true);
});
