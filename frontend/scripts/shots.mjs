import { mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'out')
const previewsDir = resolve(here, '..', 'race-strategist-design', 'design', 'reference', 'previews')

const args = process.argv.slice(2)
const refIndex = args.indexOf('--ref')
const refName = refIndex === -1 ? null : args[refIndex + 1]
const flow = args.includes('--flow')
const url =
  args.find((arg, index) => !arg.startsWith('--') && index !== refIndex + 1) ??
  'http://localhost:5173'

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

async function settle(page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
}

async function shootReference(browser, name) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()
  await page.goto(pathToFileURL(join(previewsDir, `${name}.html`)).href, { waitUntil: 'load' })
  await settle(page)
  await page.screenshot({ path: join(outDir, `ref-${name}.png`), fullPage: true })
  await context.close()
}

async function shootDefault(browser) {
  for (const { name, width, height } of viewports) {
    const context = await browser.newContext({ viewport: { width, height } })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'load' })
    await settle(page)
    await page.screenshot({ path: join(outDir, `app-${name}.png`), fullPage: true })
    await context.close()
  }
}

async function shootFlow(browser) {
  for (const { name, width, height } of viewports) {
    const context = await browser.newContext({ viewport: { width, height } })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'load' })
    await settle(page)
    await page
      .locator('#step-race-title')
      .locator('xpath=ancestor::section')
      .locator('button')
      .first()
      .click()
    await page.locator('#step-info-title').waitFor()
    await settle(page)
    await page
      .locator('#step-info-title')
      .locator('xpath=ancestor::section')
      .locator('button[aria-pressed]')
      .first()
      .click()
    await page.locator('#step-strategy-title').waitFor()
    await settle(page)
    await page.screenshot({ path: join(outDir, `app-flow-${name}.png`), fullPage: true })
    await context.close()
  }
}

if (!refName) {
  try {
    await fetch(url)
  } catch {
    console.error(`Dev server not reachable at ${url}. Start it with npm run dev.`)
    process.exit(1)
  }
}

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
try {
  if (refName) await shootReference(browser, refName)
  else if (flow) await shootFlow(browser)
  else await shootDefault(browser)
} finally {
  await browser.close()
}
