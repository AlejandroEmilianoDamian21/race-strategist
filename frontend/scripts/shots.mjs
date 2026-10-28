import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from '@playwright/test'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'out')
const url = process.argv[2] ?? 'http://localhost:5173'

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

try {
  await fetch(url)
} catch {
  console.error(`Dev server not reachable at ${url}. Start it with npm run dev.`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
try {
  for (const { name, width, height } of viewports) {
    const context = await browser.newContext({ viewport: { width, height } })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
    await page.screenshot({ path: join(outDir, `app-${name}.png`), fullPage: true })
    await context.close()
  }
} finally {
  await browser.close()
}
