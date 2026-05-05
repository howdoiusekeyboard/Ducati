/* eslint-disable no-console */
/**
 * Phase 9 frontend-reskin BEFORE/AFTER browser smoke (node runner — bun + Playwright
 * stdio-pipe handshake fails on Windows; node works).
 * Run: PHASE=before node playwright/sweep.mjs
 *      PHASE=after  node playwright/sweep.mjs
 * Defaults to live URL https://ducati-tawny.vercel.app (Vercel-provisioned Firebase).
 */

import { chromium } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

dotenvConfig({ path: '.env.production.local' });

const PHASE = (process.env.PHASE || 'before').toLowerCase();
const BASE_URL = process.env.SWEEP_BASE_URL || 'https://ducati-tawny.vercel.app';
const OUT_DIR = path.join('docs', '.frontend-reskin', PHASE);
const MANIFEST = path.join(OUT_DIR, 'sweep-manifest.json');

const VIEWPORTS = [320, 768, 1440];

const ROUTES = [
  { path: '/', name: 'home', auth: false },
  { path: '/chat', name: 'chat', auth: false },
  { path: '/dashboard', name: 'dashboard', auth: true },
  { path: '/profile', name: 'profile', auth: true },
  { path: '/pro-mode', name: 'pro-mode', auth: true },
  { path: '/about', name: 'about', auth: false },
  { path: '/user-guide', name: 'user-guide', auth: false },
  { path: '/finance-feed', name: 'finance-feed', auth: false },
];

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function signInEmail(page) {
  const email = process.env.EMAIL_ID;
  const password = process.env.EMAIL_Password;
  if (!email || !password) {
    console.error('[auth] missing EMAIL_ID / EMAIL_Password in .env.production.local');
    return false;
  }

  console.log(`[auth] goto ${BASE_URL}/login`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 });

  console.log('[auth] waiting for firebaseui email-provider button');
  const emailBtn = page
    .locator('button[data-provider-id="password"], .firebaseui-idp-password')
    .first();
  try {
    await emailBtn.waitFor({ state: 'visible', timeout: 20000 });
    await emailBtn.click();
  } catch {
    console.log('[auth] email-provider button not visible, trying direct email-input');
  }

  const emailInput = page.locator('input[name="email"], .firebaseui-id-email').first();
  await emailInput.waitFor({ state: 'visible', timeout: 20000 });
  await emailInput.fill(email);
  await page.locator('.firebaseui-id-submit, button[type="submit"]').first().click();

  const passwordInput = page
    .locator('input[type="password"], input[name="password"], .firebaseui-id-password')
    .first();
  try {
    await passwordInput.waitFor({ state: 'visible', timeout: 20000 });
  } catch (e) {
    await page.screenshot({
      path: path.join(OUT_DIR, '_auth-debug-password-step.png'),
      fullPage: true,
    });
    const inputs = await page
      .locator('input')
      .evaluateAll((els) =>
        els.map((el) => ({
          type: el.type,
          name: el.name,
          placeholder: el.placeholder,
          autocomplete: el.autocomplete,
        })),
      );
    console.error('[auth] password step DOM inputs:', JSON.stringify(inputs));
    throw e;
  }
  await passwordInput.fill(password);
  await page.locator('.firebaseui-id-submit, button[type="submit"]').first().click();

  console.log('[auth] waiting for redirect off /login');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 45000 });
  console.log('[auth] signed in');
  return true;
}

async function captureRoute(context, route, viewport, authed) {
  const page = await context.newPage();
  await page.setViewportSize({ width: viewport, height: 800 });

  const consoleErrors = [];
  const networkErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 500));
  });
  page.on('requestfailed', (req) => {
    const fail = req.failure();
    networkErrors.push(`${req.method()} ${req.url()} :: ${fail?.errorText || 'unknown'}`);
  });

  const url = `${BASE_URL}${route.path}`;
  const start = Date.now();
  let finalUrl = url;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    finalUrl = page.url();
  } catch (e) {
    console.error(
      `[${route.name}@${viewport}] goto failed:`,
      e instanceof Error ? e.message : String(e),
    );
  }
  await page.waitForTimeout(1500);

  const screenshotName = `${route.name}-${viewport}.png`;
  const screenshotPath = path.join(OUT_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const timingMs = Date.now() - start;
  await page.close();

  console.log(
    `[${route.name}@${viewport}] ${timingMs}ms console=${consoleErrors.length} net=${networkErrors.length}`,
  );
  return {
    route: route.name,
    viewport,
    authed,
    url,
    finalUrl,
    screenshot: screenshotName,
    consoleErrors,
    networkErrors,
    timingMs,
  };
}

console.log(`[sweep] phase=${PHASE} base=${BASE_URL}`);
console.log(`[sweep] out=${OUT_DIR}`);
console.log(
  `[sweep] ${ROUTES.length} routes × ${VIEWPORTS.length} viewports = ${ROUTES.length * VIEWPORTS.length} captures`,
);

const browser = await chromium.launch({ headless: true });
const ctxOpts = {
  locale: 'en-US',
  timezoneId: 'Asia/Dubai',
  userAgent: 'Mozilla/5.0 (Phase9-reskin-sweep) Chrome/Playwright',
};
const anonContext = await browser.newContext(ctxOpts);
const authContext = await browser.newContext(ctxOpts);

let authOK = false;
try {
  const authBootstrap = await authContext.newPage();
  authOK = await signInEmail(authBootstrap);
  await authBootstrap.close();
} catch (e) {
  console.error('[auth] sign-in threw:', e instanceof Error ? e.message : String(e));
  authOK = false;
}
if (!authOK) {
  console.warn(
    '[auth] proceeding with anon-only; auth-required routes will land on /login redirect',
  );
}

const results = [];
for (const route of ROUTES) {
  const ctx = route.auth && authOK ? authContext : anonContext;
  const authed = route.auth && authOK;
  for (const vp of VIEWPORTS) {
    const r = await captureRoute(ctx, route, vp, authed);
    results.push(r);
  }
}

fs.writeFileSync(
  MANIFEST,
  JSON.stringify(
    {
      phase: PHASE,
      baseUrl: BASE_URL,
      timestamp: new Date().toISOString(),
      authedSignInOK: authOK,
      captures: results,
    },
    null,
    2,
  ),
);

await browser.close();
console.log(`[sweep] done. manifest=${MANIFEST}`);
