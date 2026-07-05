// Prerender SSG script
// Serves the built dist/ via `vite preview`, uses Playwright to render each
// indexable route, and writes the fully-rendered HTML back to disk so crawlers
// get static markup. Client hydration continues to work because main.tsx uses
// createRoot (not hydrateRoot), which replaces existing DOM without mismatch.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const ROUTES = [
  "/",
  "/baixar-reels-instagram",
  "/baixar-igtv-instagram",
  "/baixar-stories-instagram",
  "/baixar-fotos-instagram",
  "/downloads",
  "/configuracoes",
];

const PORT = 4321;
const BASE = `http://localhost:${PORT}`;
const DIST = resolve(process.cwd(), "dist");

if (!existsSync(DIST)) {
  console.error("[prerender] dist/ not found. Run `vite build` first.");
  process.exit(1);
}

console.log("[prerender] starting vite preview on port", PORT);
const server = spawn(
  process.execPath,
  [resolve("node_modules/vite/bin/vite.js"), "preview", "--port", String(PORT), "--strictPort"],
  { stdio: ["ignore", "inherit", "inherit"] },
);

async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(BASE + "/");
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("[prerender] preview server did not become ready");
}

let exitCode = 0;
try {
  await waitReady();
  console.log("[prerender] server ready, launching browser");
  // Prefer system chromium if available (sandbox); otherwise use Playwright's bundled one (CI).
  const sysChromium = existsSync("/bin/chromium") ? "/bin/chromium" : undefined;
  const browser = await chromium.launch(sysChromium ? { executablePath: sysChromium } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const url = BASE + route;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    } catch (e) {
      console.warn("[prerender] networkidle timeout on", route, "- continuing");
    }
    // Let react-helmet-async apply head mutations
    await page.waitForTimeout(300);
    const html = await page.content();
    const outPath =
      route === "/" ? resolve(DIST, "index.html") : resolve(DIST, route.replace(/^\//, ""), "index.html");
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, "utf8");
    console.log("[prerender] wrote", outPath.replace(process.cwd() + "/", ""));
    await page.close();
  }

  await browser.close();
} catch (e) {
  console.error("[prerender] failed:", e);
  exitCode = 1;
} finally {
  server.kill("SIGTERM");
  // give it a moment to shut down
  await new Promise((r) => setTimeout(r, 200));
  process.exit(exitCode);
}
