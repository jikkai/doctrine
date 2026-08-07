import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";

import { test } from "vitest";

const execFileAsync = promisify(execFile);

test("builds localized static pages and search below a GitHub Pages subpath", async () => {
  const root = process.cwd();
  const outDir = path.join(root, ".doctrine-test-dist");
  try {
    await execFileAsync(
      process.execPath,
      [
        path.join(root, "dist/cli.js"),
        "build",
        "docs",
        "--out-dir",
        ".doctrine-test-dist",
        "--site-url",
        "https://example.com/doctrine/",
      ],
      { cwd: root },
    );

    const home = await readFile(path.join(outDir, "index.html"), "utf8");
    const chinese = await readFile(path.join(outDir, "zh-CN/index.html"), "utf8");
    const notFound = await readFile(path.join(outDir, "404.html"), "utf8");
    assert.match(home, /href="\/doctrine\/assets\//);
    assert.match(home, /href="\/doctrine\/guide\/getting-started\/"/);
    assert.match(home, /https:\/\/example\.com\/doctrine\//);
    assert.match(home, /hreflang="zh-CN"/);
    assert.match(home, /doctrine-theme/);
    assert.match(chinese, /lang="zh-CN"/);
    assert.match(notFound, /src="\/doctrine\/assets\//);
    assert.ok(existsSync(path.join(outDir, "pagefind/pagefind.js")));
    assert.equal(existsSync(path.join(outDir, "doctrine/index.html")), false);
  } finally {
    await rm(outDir, { force: true, recursive: true });
  }
}, 60_000);
