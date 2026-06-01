import path from "node:path";

import { validateIndieHackersUrl } from "./snapshot.mjs";

export async function snapshotPostComments(options) {
  validateIndieHackersUrl(options.url);
  return withPage(options, async (page) => {
    await page.goto(options.url, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForSelector('a[href*="commentId="]', { timeout: 15000 });

    const comments = await page.evaluate(() => {
      const seen = new Set();
      const comments = [];
      const timestampLinks = Array.from(document.querySelectorAll('a[href*="commentId="]'));

      function compact(value) {
        return String(value || "").replace(/\s+/g, " ").trim();
      }

      function commentIdFromHref(href) {
        try {
          return new URL(href, location.href).searchParams.get("commentId");
        } catch {
          return null;
        }
      }

      function findContainer(link) {
        let current = link.parentElement;
        let best = current;
        for (let depth = 0; current && depth < 8; depth += 1) {
          const text = compact(current.innerText);
          if (text.includes("REPLY") && text.length > 40) {
            best = current;
          }
          current = current.parentElement;
        }
        return best;
      }

      function authorFrom(container, link) {
        const anchors = Array.from(container.querySelectorAll("a[href]"));
        const linkIndex = anchors.indexOf(link);
        const before = anchors.slice(0, linkIndex < 0 ? anchors.length : linkIndex).reverse();
        for (const anchor of before) {
          const href = anchor.href || "";
          if (!href.includes("indiehackers.com/") || href.includes("/post/")) continue;
          const url = new URL(href, location.href);
          const handle = url.pathname.split("/").filter(Boolean)[0];
          const text = compact(anchor.innerText);
          if (handle) return text || handle;
        }
        return "unknown";
      }

      function ownReplyPresent(container) {
        return /\bEDIT\b/.test(container.innerText) && /\bDELETE\b/.test(container.innerText);
      }

      function commentText(container, author) {
        const clone = container.cloneNode(true);
        for (const selector of ["button", "textarea", "input"]) {
          for (const node of clone.querySelectorAll(selector)) node.remove();
        }
        let text = compact(clone.innerText);
        const cleanup = [
          author,
          "REPLY",
          "EDIT",
          "DELETE",
          "[–]",
          "a few seconds ago",
        ];
        for (const token of cleanup) {
          text = text.replaceAll(token, " ");
        }
        text = text.replace(/\b\d+\s+(seconds?|minutes?|hours?|days?)\s+ago\b/gi, " ");
        text = text.replace(/\s+/g, " ").trim();
        return text;
      }

      for (const link of timestampLinks) {
        const id = commentIdFromHref(link.href);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const container = findContainer(link);
        const author = authorFrom(container, link);
        const text = commentText(container, author);
        if (text.length < 12) continue;
        comments.push({
          id,
          author,
          text,
          permalink: new URL(link.getAttribute("href"), location.href).href,
          replyCount: Math.max(0, container.querySelectorAll('a[href*="commentId="]').length - 1),
          hasOwnReply: ownReplyPresent(container),
        });
      }

      return comments;
    });

    if (comments.length === 0) {
      throw new Error("No visible Indie Hackers comments were found.");
    }

    return {
      source: "indiehackers",
      url: options.url,
      capturedAt: new Date().toISOString(),
      comments,
    };
  });
}

export async function fillReply(options) {
  validateIndieHackersUrl(options.url);
  return withPage(options, async (page) => {
    await page.goto(commentUrl(options.url, options.commentId), { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    const target = page.locator(`a[href*="commentId=${cssAttr(options.commentId)}"]`).first();
    await target.waitFor({ timeout: 15000 });

    const commentRoot = target.locator("xpath=ancestor::*[contains(., 'REPLY')][1]");
    const replyTrigger = commentRoot.getByText("REPLY", { exact: true }).last();
    await replyTrigger.click();

    const editor = commentRoot.locator("textarea, [contenteditable='true']").last();
    await editor.waitFor({ timeout: 10000 });
    const tag = await editor.evaluate((node) => node.tagName.toLowerCase());
    if (tag === "textarea") {
      await editor.fill(options.reply);
    } else {
      await editor.click();
      await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
      await page.keyboard.type(options.reply);
    }

    const submit = commentRoot.getByRole("button", { name: /post comment/i }).last();
    await submit.waitFor({ timeout: 10000 });
    if (await submit.isDisabled()) {
      throw new Error("The POST COMMENT button is disabled after filling the reply. Login may be required.");
    }

    return { filled: true, commentId: options.commentId };
  });
}

export async function postReply(options) {
  validateIndieHackersUrl(options.url);
  return withPage(options, async (page) => {
    await page.goto(commentUrl(options.url, options.commentId), { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    const target = page.locator(`a[href*="commentId=${cssAttr(options.commentId)}"]`).first();
    await target.waitFor({ timeout: 15000 });

    const commentRoot = target.locator("xpath=ancestor::*[contains(., 'REPLY')][1]");
    const replyTrigger = commentRoot.getByText("REPLY", { exact: true }).last();
    await replyTrigger.click();

    const editor = commentRoot.locator("textarea, [contenteditable='true']").last();
    await editor.waitFor({ timeout: 10000 });
    const tag = await editor.evaluate((node) => node.tagName.toLowerCase());
    if (tag === "textarea") {
      await editor.fill(options.reply);
    } else {
      await editor.click();
      await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
      await page.keyboard.type(options.reply);
    }

    const submit = commentRoot.getByRole("button", { name: /post comment/i }).last();
    await submit.waitFor({ timeout: 10000 });
    if (await submit.isDisabled()) {
      throw new Error("The POST COMMENT button is disabled after filling the reply. Login may be required.");
    }
    await submit.click();

    const snippet = options.reply.replace(/\s+/g, " ").trim().slice(0, 80);
    await page.getByText(snippet, { exact: false }).first().waitFor({ timeout: 15000 });
    return { posted: true, commentId: options.commentId };
  });
}

async function withPage(options, callback) {
  const { chromium } = await loadPlaywright();
  const profileDir = options.profileDir ? path.resolve(options.profileDir) : null;
  let browser;
  let context;

  if (profileDir) {
    context = await chromium.launchPersistentContext(profileDir, {
      headless: Boolean(options.headless),
      viewport: { width: 1280, height: 900 },
    });
  } else {
    browser = await chromium.launch({
      headless: Boolean(options.headless),
    });
    context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  }

  try {
    const page = context.pages()[0] ?? await context.newPage();
    return await callback(page);
  } finally {
    await context?.close();
    await browser?.close();
  }
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") {
      throw new Error("Playwright is not installed. Run `npm install` in tools/indie-hackers-reply before browser commands.");
    }
    throw error;
  }
}

function commentUrl(url, commentId) {
  const next = new URL(url);
  next.searchParams.set("commentId", commentId);
  return next.href;
}

function cssAttr(value) {
  return String(value).replace(/["\\]/g, "\\$&");
}
