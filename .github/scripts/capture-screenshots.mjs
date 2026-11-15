// Takes screenshots of every website page into docs/screenshots/web.
// Run: npm install --no-save puppeteer-core, then node .github/scripts/capture-screenshots.mjs [siteUrl]
// Reference: Google (2025) Puppeteer documentation - https://pptr.dev/
import { mkdirSync } from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Load puppeteer-core from the folder you run this in, so it never has to be installed in the repo.
const { default: puppeteer } = await import(
  pathToFileURL(createRequire(join(process.cwd(), "noop.js")).resolve("puppeteer-core")).href);

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(repo, "docs", "screenshots", "web");
mkdirSync(out, { recursive: true });

const site = (process.argv[2] || "http://127.0.0.1:5500").replace(/\/$/, "");
const browserPath = process.env.BROWSER_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const customer = [process.env.CUSTOMER_EMAIL || "customer1@example.com", process.env.CUSTOMER_PASSWORD || "Password123!"];
const admin = [process.env.ADMIN_EMAIL || "admin@example.com", process.env.ADMIN_PASSWORD || "Admin123!"];

// A throwaway profile, so an already-open Edge/Chrome window can't take over the session.
const profile = join(os.tmpdir(), `lsp-screens-${Date.now()}`);
const browser = await puppeteer.launch({
  executablePath: browserPath, headless: true, userDataDir: profile,
  args: ["--no-first-run", "--no-default-browser-check"],
  defaultViewport: { width: 1280, height: 860 },
});
const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(`${page.url()}: ${m.text()}`); });

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

/** Opens a page, waits for its API calls to settle, and saves a screenshot. */
async function shot(name, path, { fullPage = false, before } = {}) {
  await page.goto(site + "/" + path, { waitUntil: "networkidle0" });
  if (before) await before();
  await pause(400);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage });
  console.log("saved", name);
}

/** Signs in through the real login form. */
async function signIn([email, password]) {
  await page.goto(site + "/index.html", { waitUntil: "networkidle0" });
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(site + "/login.html", { waitUntil: "networkidle0" });
  await page.type("#email", email);
  await page.type("#password", password);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.click("#loginForm button[type=submit]")]);
}

// ---------- Public pages ----------
await page.goto(site + "/index.html");
await page.evaluate(() => sessionStorage.clear());
await shot("01-landing-index", "index.html");
await shot("02-login", "login.html");
await shot("14-session-expired", "login.html?reason=Your%20session%20has%20expired.%20Please%20sign%20in%20again.");
await shot("13-privacy", "privacy.html");

// ---------- Customer portal ----------
await signIn(customer);
const trackRef = process.argv[3] || await page.evaluate(async () => {
  const s = JSON.parse(sessionStorage.getItem("lsp.session"));
  const r = await fetch(window.LSP_CONFIG.apiBaseUrl + "/orders/mine", { headers: { Authorization: "Bearer " + s.token } });
  return (await r.json())[0]?.orderRef;
});
await shot("04-customer-dashboard", "customer_dashboard.html");
await shot("05-customers-order-place-order", "customers_order.html", {
  before: async () => {
    await page.type("#designRows .design-row input[type=text]", "Club banner - 3 m");
    await page.select("#designRows .design-row select", "5");
    await page.click("#addDesign");
    const rows = await page.$$("#designRows .design-row");
    const second = rows[1];
    await (await second.$("input[type=text]")).type("Sponsor stickers");
    await (await second.$("select")).select("7");
    await (await second.$("input[type=number]")).evaluate((input) => {
      input.value = "6";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  },
});
await shot("06-order-search-my-orders", "order_search.html", { fullPage: true });

// Public tracking while signed out (shows masked details).
await page.evaluate(() => sessionStorage.clear());
await shot("07-track-by-reference", `index.html?ref=${trackRef}#track`, {
  before: async () => { await page.waitForSelector(".timeline"); await page.$eval("#track", (el) => el.scrollIntoView()); },
});

// ---------- Staff portal ----------
await signIn(admin);
await shot("08-staff-dashboard", "dashboard.html");
await shot("09-staff-customers", "customers.html");
await shot("11-staff-orders-stage-update", "orders.html");
await shot("12-staff-inventory-low-stock", "inventory.html");

// Phone width.
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
await shot("15-phone-width-orders", "orders.html");

await browser.close();
console.log(errors.length ? "Console errors:\n" + errors.join("\n") : "No console errors on any page.");
