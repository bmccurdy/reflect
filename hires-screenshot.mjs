#!/usr/bin/env node
/**
 * Full-page hi-res PNG of a local HTML file or URL.
 *
 *   node hires-screenshot.mjs reflect-dashboard.html
 *   node hires-screenshot.mjs https://example.com -o shot.png --scale 4
 *
 * Uses Google Chrome at a high device scale (default 3×) so the PNG is
 * real extra pixels, not an upscale. First run: npm install
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function printHelp() {
  console.log(`Hi-res full-page screenshot

Usage:
  node hires-screenshot.mjs <file.html|URL> [options]

Options:
  -o, --out <path>       Output PNG (default: <name>-hires.png)
  -s, --scale <n>        Device scale factor, 1–6 (default: 3)
  -w, --width <px>       CSS viewport width (default: 1440)
      --height <px>      CSS viewport height before full-page capture (default: 900)
      --viewport-only    Capture the viewport instead of the full page
      --wait <ms>        Extra settle time after load (default: 400)
      --gate             Keep the password gate visible (off by default)
      --keep-feedback    Keep the #reflect-demo-feedback overlay
      --hide <selector>  Hide a selector before capture (repeatable)
      --chrome <path>    Chrome/Chromium executable
  -h, --help             Show this help

Examples:
  node hires-screenshot.mjs reflect-dashboard.html
  node hires-screenshot.mjs reflect-dashboard.html -o overview.png --scale 4
  node hires-screenshot.mjs https://example.com --width 1280 --viewport-only
`);
}

function parseArgs(argv) {
  const args = {
    scale: 3,
    width: 1440,
    height: 900,
    wait: 400,
    fullPage: true,
    gate: false,
    keepFeedback: false,
    hide: [],
    help: false,
    target: null,
    out: null,
    chrome: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v == null || v.startsWith("-")) throw new Error(`Missing value for ${a}`);
      return v;
    };
    switch (a) {
      case "-h":
      case "--help":
        args.help = true;
        break;
      case "-o":
      case "--out":
        args.out = next();
        break;
      case "-s":
      case "--scale":
        args.scale = Number(next());
        break;
      case "-w":
      case "--width":
        args.width = Number(next());
        break;
      case "--height":
        args.height = Number(next());
        break;
      case "--viewport-only":
        args.fullPage = false;
        break;
      case "--wait":
        args.wait = Number(next());
        break;
      case "--gate":
        args.gate = true;
        break;
      case "--keep-feedback":
        args.keepFeedback = true;
        break;
      case "--hide":
        args.hide.push(next());
        break;
      case "--chrome":
        args.chrome = next();
        break;
      default:
        if (a.startsWith("-")) throw new Error(`Unknown flag: ${a}`);
        if (args.target) throw new Error(`Unexpected extra argument: ${a}`);
        args.target = a;
    }
  }
  return args;
}

function isHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function defaultOutPath(target) {
  if (isHttpUrl(target)) {
    const host = new URL(target).hostname.replace(/[^\w.-]+/g, "-");
    return path.join(process.cwd(), `${host}-hires.png`);
  }
  const abs = path.resolve(target);
  const base = path.basename(abs, path.extname(abs));
  return path.join(path.dirname(abs), `${base}-hires.png`);
}

function startStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const filePath = path.normalize(path.join(rootDir, urlPath));
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    fs.stat(filePath, (err, st) => {
      if (err) {
        res.writeHead(404).end("Not found");
        return;
      }
      const serve = st.isDirectory() ? path.join(filePath, "index.html") : filePath;
      fs.readFile(serve, (readErr, buf) => {
        if (readErr) {
          res.writeHead(404).end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": MIME[path.extname(serve).toLowerCase()] || "application/octet-stream" });
        res.end(buf);
      });
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
    server.on("error", reject);
  });
}

function findChrome(explicit) {
  if (explicit) return explicit;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    path.join(os.homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

async function launchBrowser(chromePath) {
  const common = {
    headless: true,
    args: ["--hide-scrollbars", "--disable-lcd-text"],
  };
  if (chromePath) {
    return chromium.launch({ ...common, executablePath: chromePath });
  }
  try {
    return await chromium.launch({ ...common, channel: "chrome" });
  } catch {
    const found = findChrome();
    if (!found) {
      throw new Error(
        "Could not find Google Chrome. Install Chrome, or pass --chrome /path/to/chrome"
      );
    }
    return chromium.launch({ ...common, executablePath: found });
  }
}

async function preparePage(page, args) {
  await page.evaluate(
    ({ gate, keepFeedback, hide }) => {
      if (!gate) {
        if (typeof unlockGate === "function") unlockGate();
        else document.body.classList.remove("is-locked");
      }
      if (!keepFeedback) document.getElementById("reflect-demo-feedback")?.remove();
      for (const sel of hide) {
        document.querySelectorAll(sel).forEach((el) => {
          el.style.setProperty("display", "none", "important");
        });
      }
    },
    { gate: args.gate, keepFeedback: args.keepFeedback, hide: args.hide }
  );
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const imgs = [...document.images];
    await Promise.all(
      imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      })
    );
  });
  if (args.wait > 0) await new Promise((r) => setTimeout(r, args.wait));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.target) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }
  if (!Number.isFinite(args.scale) || args.scale < 1 || args.scale > 6) {
    throw new Error("--scale must be a number from 1 to 6");
  }
  if (!Number.isFinite(args.width) || args.width < 320) {
    throw new Error("--width must be at least 320");
  }

  let url;
  let server;
  if (isHttpUrl(args.target)) {
    url = args.target;
  } else {
    const abs = path.resolve(args.target);
    if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
    const st = fs.statSync(abs);
    const filePath = st.isDirectory() ? path.join(abs, "index.html") : abs;
    if (!fs.existsSync(filePath)) throw new Error(`No HTML file at ${filePath}`);
    const root = path.dirname(filePath);
    const started = await startStaticServer(root);
    server = started.server;
    url = `${started.origin}/${path.basename(filePath)}`;
  }

  const out = path.resolve(args.out || defaultOutPath(args.target));
  const browser = await launchBrowser(args.chrome);
  try {
    const page = await browser.newPage({
      viewport: { width: args.width, height: args.height },
      deviceScaleFactor: args.scale,
    });
    await page.emulateMedia({ media: "screen" });
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await preparePage(page, args);
    await page.screenshot({
      path: out,
      type: "png",
      fullPage: args.fullPage,
      animations: "disabled",
      caret: "hide",
    });
    const buf = fs.readFileSync(out);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    console.log(`Wrote ${out}`);
    console.log(`${width} × ${height} px  (${args.scale}× scale, ${args.fullPage ? "full page" : "viewport"})`);
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
