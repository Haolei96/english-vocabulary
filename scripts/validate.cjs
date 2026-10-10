// Validate the embedded vocabulary before every daily publication.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'Missing vocabulary script');
new vm.Script(script); // Check syntax of the entire application, not just DATA.
const expression = script.match(/const DATA = (\[[\s\S]*?\n\]);/)?.[1];
assert.ok(expression, 'Missing DATA array');
const data = vm.runInNewContext(expression, {}, {timeout: 1000});
assert.ok(Array.isArray(data) && data.length >= 330, 'History is incomplete');

// The user authorized adding usage tips to Day 1–32 on 2026-10-10.
// Keep the original history baseline: only omit those newly added fields.
const history = data.slice(0, 330).map(item => item.d <= 32
  ? Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'usage'))
  : item);
const digest = crypto.createHash('sha256').update(JSON.stringify(history)).digest('hex');
assert.equal(digest, '4cb80dff43bc581daae3597ea10ca55843e5d1f79831102cbc2e92387f44238f',
  'Day 1–33 history changed; review any intentional correction before updating the baseline');
const tipDigest = crypto.createHash('sha256')
  .update(JSON.stringify(data.slice(0, 320).map(item => item.usage))).digest('hex');
assert.equal(tipDigest, '70986fd59313ca3405b2d990554bdf05485b93c679c06868c59643607e46c130',
  'Day 1–32 usage tips changed; review any intentional correction before updating the baseline');

const byDay = new Map();
const seen = new Map();
const dates = new Map();
const normalize = word => word.normalize('NFKC').replace(/[’‘]/g, "'").toLowerCase().trim().replace(/\s+/g, ' ');
for (const item of data) {
  assert.ok(Number.isInteger(item.d) && item.d > 0, 'Invalid learning day');
  for (const key of ['w', 'pos', 'p', 'cn', 'usage', 'k', 'ex', 'tr']) {
    assert.ok(typeof item[key] === 'string' && item[key].trim(), `Day ${item.d}: missing ${key}`);
  }
  assert.ok(item.p.startsWith('/') && item.p.endsWith('/'), `${item.w}: invalid IPA format`);
  assert.ok(item.ex.toLowerCase().includes(item.k.toLowerCase()), `${item.w}: cloze text missing from example`);
  if (!byDay.has(item.d)) byDay.set(item.d, []);
  byDay.get(item.d).push(item);
  const word = normalize(item.w);
  if (seen.has(word)) {
    assert.ok(item.d <= 33, `New duplicate: ${item.w} (previous Day ${seen.get(word)})`);
  }
  seen.set(word, item.d);
  if (item.d >= 34) {
    assert.match(item.date || '', /^\d{4}-\d{2}-\d{2}$/, `${item.w}: missing publication date`);
    const date = new Date(item.date + 'T00:00:00Z');
    assert.ok(!Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === item.date, 'Invalid date');
    assert.ok(!dates.has(item.date) || dates.get(item.date) === item.d, 'Two learning days share a publication date');
    dates.set(item.date, item.d);
  }
}

const latestDay = Math.max(...byDay.keys());
for (let day = 1; day <= latestDay; day++) {
  const items = byDay.get(day) || [];
  assert.equal(items.length, 10, `Day ${day}: expected 10 items`);
  if (day >= 5) {
    assert.equal(items.filter(x => x.pos.startsWith('phr')).length, 4, `Day ${day}: expected 4 phrases`);
  }
  if (day >= 34) assert.equal(new Set(items.map(x => x.date)).size, 1, `Day ${day}: inconsistent dates`);
}
for (let day = 35; day <= latestDay; day++) {
  assert.ok(byDay.get(day)[0].date > byDay.get(day-1)[0].date, `Day ${day}: publication date did not advance`);
}
assert.equal(data.length, latestDay * 10, 'Total and learning days disagree');
const phrases = data.filter(x => x.pos.startsWith('phr')).length;
console.log(`Validated Day 1–${latestDay}: ${data.length} items (${data.length-phrases} words + ${phrases} phrases).`);
console.log('Day 1–33 original fields unchanged; Day 1–32 tips preserved; all items have usage tips.');
console.log(`Latest publication: ${byDay.get(latestDay)[0].date || 'historical date unknown'}.`);
