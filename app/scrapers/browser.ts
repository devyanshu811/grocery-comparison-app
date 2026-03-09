/**
 * Shared Puppeteer browser manager.
 * Keeps a single browser instance alive across requests (dev mode).
 * Applies manual stealth techniques to avoid bot detection.
 */

import type { Browser } from "puppeteer"

let _browser: Browser | null = null
let _launching = false

export async function getBrowser(): Promise<Browser> {
  // Use isConnected() — the deprecated .connected property is unreliable in v24+
  if (_browser && _browser.isConnected()) return _browser
  if (_launching) {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500))
      if (_browser && _browser.isConnected()) return _browser
    }
    // Timed out waiting for launch — reset and try fresh
    _launching = false
    _browser = null
  }

  _launching = true
  try {
    const puppeteer = (await import("puppeteer")).default
    _browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--window-size=1366,768",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
    })
    // Auto-reset when the browser crashes or is killed
    _browser.on("disconnected", () => {
      console.warn("[browser] Puppeteer disconnected — will restart on next request")
      _browser = null
      _launching = false
    })
    return _browser
  } catch (e) {
    _launching = false
    _browser = null
    throw e
  } finally {
    _launching = false
  }
}

const STEALTH_SCRIPT = `
  // Remove webdriver flag
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  // Mock plugins
  Object.defineProperty(navigator, 'plugins', {
    get: () => [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
    ],
  });
  // Mock languages
  Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en-US', 'en'] });
  // Mock permissions
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (params) =>
    params.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(params);
  // Chrome object
  window.chrome = { runtime: {} };
`

export async function newPage() {
  const browser = await getBrowser()
  const page = await browser.newPage()

  // Apply stealth before anything loads
  await page.evaluateOnNewDocument(STEALTH_SCRIPT)

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.112 Safari/537.36"
  )
  await page.setViewport({ width: 1366, height: 768 })
  await page.setExtraHTTPHeaders({
    "accept-language": "en-IN,en-US;q=0.9,en;q=0.8",
  })

  return page
}
