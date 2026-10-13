// Exercise the reading-import exception without weakening daily publication limits.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const expression = html.match(/const DATA = (\[[\s\S]*?\n\]);/)[1];
const baseline = JSON.parse(JSON.stringify(vm.runInNewContext(expression)));
const latestDate = baseline.reduce((latest,item) => item.date > latest ? item.date : latest, '');
const next = new Date(latestDate + 'T00:00:00Z');
next.setUTCDate(next.getUTCDate() + 1);
const nextDate = next.toISOString().slice(0,10);
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'vocabulary-validation-'));
fs.mkdirSync(path.join(fixture, 'scripts'));
fs.copyFileSync(path.join(__dirname, 'validate.cjs'), path.join(fixture, 'scripts', 'validate.cjs'));

function check(name, mutate, expectedSuccess, expectedError) {
  const items = JSON.parse(JSON.stringify(baseline));
  mutate(items);
  fs.writeFileSync(path.join(fixture, 'index.html'), html.replace(expression, JSON.stringify(items).slice(0,-1) + '\n]'));
  const result = spawnSync(process.execPath, [path.join(fixture, 'scripts', 'validate.cjs')], {encoding:'utf8'});
  assert.equal(result.status === 0, expectedSuccess, name + '\n' + result.stderr);
  if (expectedError) assert.match(result.stderr, expectedError, name);
}

function appendDaily(items, date) {
  const day = Math.max(...items.map(x=>x.d)) + 1;
  const last = items.filter(x=>x.d === day - 1);
  items.push(...last.map((item,index) => {
    const copy = {...item, d:day, date, w:'validation-example-' + day + '-' + index};
    delete copy.kind;
    delete copy.source;
    return copy;
  }));
}

try {
  check('current reading imports accepted', () => {}, true);
  check('next ordinary daily update accepted', items => appendDaily(items, nextDate), true);
  check('same-date daily update rejected', items => appendDaily(items, latestDate), false, /Two daily learning days/);
  check('missing source page rejected', items => { delete items.find(x=>x.kind==='reading').source.page; }, false, /missing reading source page/);
  check('fabricated source form rejected', items => { items.find(x=>x.kind==='reading').source.form = 'not-in-the-book'; }, false, /source form missing/);
  check('mixed batch rejected', items => { delete items.find(x=>x.kind==='reading').kind; }, false, /Two daily learning days|mixed daily and reading/);
  check('reading history duplicate rejected', items => { items.find(x=>x.kind==='reading').w = 'triage'; }, false, /New duplicate/);
  check('six plus four required', items => { items.find(x=>x.kind==='reading' && x.pos==='phr.').pos = 'n.'; }, false, /expected 4 phrases/);
  check('original history preserved', items => { items[0].cn = 'changed'; }, false, /history changed/);
  check('backdated daily update rejected', items => { items.filter(x=>x.d===38).forEach(x=>x.date='2026-10-12'); }, false, /Two daily learning days|date did not advance/);
  console.log('Passed 10 validation regression checks, including next-day publication and same-date rejection.');
} finally {
  fs.rmSync(fixture, {recursive:true, force:true});
}
