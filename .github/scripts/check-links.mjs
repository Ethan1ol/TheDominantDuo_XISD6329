// Fails the build if a page links to a local file that doesn't exist.
import { readFileSync, readdirSync, existsSync } from "node:fs";

const pages = readdirSync(".").filter((f) => f.endsWith(".html"));
const missing = [];

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(url)) continue;
    const path = url.split(/[?#]/)[0];
    if (path && !existsSync(path)) missing.push(`${page}: ${url}`);
  }
}

// Links built in JavaScript (navigation in js/layout.js) are checked too.
const layout = readFileSync("js/layout.js", "utf8");
for (const [, url] of layout.matchAll(/"([a-z_-]+\.html)/g)) {
  if (!existsSync(url)) missing.push(`js/layout.js: ${url}`);
}

if (missing.length) {
  console.error("Broken local links:\n" + missing.join("\n"));
  process.exit(1);
}
console.log(`Checked ${pages.length} pages: all local links and assets exist.`);
