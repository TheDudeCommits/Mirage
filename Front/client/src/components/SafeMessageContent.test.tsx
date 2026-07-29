import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SafeMessageContent from "./SafeMessageContent.js";

test("renders untrusted markup as escaped text", () => {
  const html = renderToStaticMarkup(
    <SafeMessageContent text={'<img src=x onerror="alert(1)">'} />,
  );

  assert.doesNotMatch(html, /<img/i);
  assert.match(html, /&lt;img/);
});

test("supports limited emphasis and list formatting without HTML injection", () => {
  const html = renderToStaticMarkup(
    <SafeMessageContent
      text={'1. **safe** <script>alert(1)</script>\n- *item*'}
    />,
  );

  assert.match(html, /<strong/);
  assert.match(html, /<em/);
  assert.doesNotMatch(html, /<script>/i);
  assert.match(html, /&lt;script&gt;/);
});
