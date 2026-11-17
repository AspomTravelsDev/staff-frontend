import test from 'node:test';
import assert from 'node:assert/strict';

function simpleHtmlToWhatsApp(html) {
  // Simple regex-based or string-based check for tests
  let text = html;
  // bold
  text = text.replace(/<(b|strong)[^>]*>(.*?)<\/\1>/gi, '*$2*');
  // italic
  text = text.replace(/<(i|em)[^>]*>(.*?)<\/\1>/gi, '_$2_');
  // strike
  text = text.replace(/<(s|strike|del)[^>]*>(.*?)<\/\1>/gi, '~$2~');
  // bullet items
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  // strip remaining tags
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n');
  text = text.replace(/<[^>]+>/g, '');
  return text.trim();
}

test('simpleHtmlToWhatsApp converts rich tags to WhatsApp markdown', () => {
  const html = '<p><b>Important Announcement</b></p><ul><li>First item</li><li>Second item with <i>italics</i></li></ul>';
  const result = simpleHtmlToWhatsApp(html);
  assert.ok(result.includes('*Important Announcement*'));
  assert.ok(result.includes('- First item'));
  assert.ok(result.includes('_italics_'));
});
