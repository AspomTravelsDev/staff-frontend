import test from 'node:test';
import assert from 'node:assert/strict';
import { isForwardedMessage, getDisplayMessageBody } from './chat-message-state.ts';

test('WhatsApp formatting tokens and blocks parsing logic', async () => {
  const regex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|`[^`\n]+`|\*{1,2}[^\s*](?:[^*]*?[^\s*])?\*{1,2}|_{1,2}[^\s_](?:[^_]*?[^\s_])?_{1,2}|~{1,2}[^\s~](?:[^~]*?[^\s~])?~{1,2})/g;

  const sample = "Hello *world* and **bold heading** and _italic text_ and ~strike~ and `some code` and https://aspomportal.com";
  const parts = sample.split(regex);
  
  assert.ok(parts.includes("*world*"));
  assert.ok(parts.includes("**bold heading**"));
  assert.ok(parts.includes("_italic text_"));
  assert.ok(parts.includes("~strike~"));
  assert.ok(parts.includes("`some code`"));
  assert.ok(parts.includes("https://aspomportal.com"));

  // Check bullet list detection (with or without space)
  const bulletRegex = /^[-*•]\s*(.+)$/;
  assert.match("- First bullet item", bulletRegex);
  assert.match("* Star bullet item", bulletRegex);
  assert.match("-Schedule meeting", bulletRegex);
  assert.match("-unordered bullet", bulletRegex);
  assert.equal("- First bullet item".match(bulletRegex)[1], "First bullet item");
  assert.equal("-Schedule meeting".match(bulletRegex)[1], "Schedule meeting");
  assert.equal("-unordered bullet".match(bulletRegex)[1], "unordered bullet");

  // Check numbered list detection (with or without space)
  const numRegex = /^(\d+\.)\s*(.+)$/;
  assert.match("1. Step one", numRegex);
  assert.match("1.ordered", numRegex);
  assert.equal("1. Step one".match(numRegex)[2], "Step one");
  assert.equal("12. Step twelve".match(numRegex)[2], "Step twelve");
  assert.equal("1.ordered".match(numRegex)[2], "ordered");

  // Check blockquote detection
  assert.match("> Quote line", /^>\s?(.*)$/);
  assert.equal("> Quote line".match(/^>\s?(.*)$/)[1], "Quote line");

  // Check multi-line code block regex
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const codeSample = "Check this:\n```\nconst x = 1;\nconsole.log(x);\n```\nDone.";
  const codeMatches = [...codeSample.matchAll(codeBlockRegex)];
  assert.equal(codeMatches.length, 1);
  assert.ok(codeMatches[0][1].includes("const x = 1;"));
});

test('Forwarded message prefix detection with and without zero-width space', () => {
  // Test with [forwarded] directly (Image 3 case)
  const rawForwarded = "[forwarded]Good morning ma";
  assert.equal(isForwardedMessage({ body: rawForwarded }), true);
  assert.equal(getDisplayMessageBody(rawForwarded), "Good morning ma");

  // Test with space [forwarded]
  const spacedForwarded = "[forwarded] Good morning ma";
  assert.equal(isForwardedMessage({ body: spacedForwarded }), true);
  assert.equal(getDisplayMessageBody(spacedForwarded), "Good morning ma");

  // Test with zero-width spaces \u200B[forwarded]\u200B
  const hiddenForwarded = "\u200B[forwarded]\u200BGood morning ma";
  assert.equal(isForwardedMessage({ body: hiddenForwarded }), true);
  assert.equal(getDisplayMessageBody(hiddenForwarded), "Good morning ma");

  // Ordinary message should not be forwarded
  assert.equal(isForwardedMessage({ body: "Good morning ma" }), false);
  assert.equal(getDisplayMessageBody("Good morning ma"), "Good morning ma");
});
