import assert from "node:assert/strict";

import { test } from "vitest";

import { documentRoutePath, withBase, withoutBase } from "../url.js";

test("keeps locale routes and links inside a deployment subpath", () => {
  assert.equal(documentRoutePath("en-US", "en-US", "guide/install"), "/guide/install/");
  assert.equal(documentRoutePath("zh-CN", "en-US", "guide/install"), "/zh-CN/guide/install/");
  assert.equal(withBase("/doctrine/", "/zh-CN/guide/install/"), "/doctrine/zh-CN/guide/install/");
  assert.equal(withoutBase("/doctrine/", "/doctrine/guide/install/"), "/guide/install/");
  assert.equal(withBase("/doctrine/", "https://example.com"), "https://example.com");
});
