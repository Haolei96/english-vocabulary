// Exercise example enrichment, prompt cleanup, reading imports and daily limits.
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
fs.copyFileSync(path.join(__dirname, 'prompt-migrations.json'), path.join(fixture, 'scripts', 'prompt-migrations.json'));

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
  check('missing extra examples rejected', items => { delete items[0].extraExamples; }, false, /expected two extra examples/);
  check('one extra example rejected', items => { items[0].extraExamples.pop(); }, false, /expected two extra examples/);
  check('blank English example rejected', items => { items[0].extraExamples[0].ex = ' '; }, false, /missing extra English example/);
  check('blank translation rejected', items => { items[0].extraExamples[0].tr = ' '; }, false, /missing extra Chinese translation/);
  check('repeated extra example rejected', items => { items[0].extraExamples[1].ex = items[0].extraExamples[0].ex; }, false, /repeated example sentence/);
  check('primary example reused as extra rejected', items => { items[0].extraExamples[0].ex = items[0].ex; }, false, /repeated example sentence/);
  check('English hint in Chinese prompt rejected', items => { items[380].cn += '（soothe）'; }, false, /Chinese prompt contains English/);
  check('cleaned prompt cannot regress', items => { items[100].cn = '证明、证实（attest to sth）'; }, false, /Approved Chinese prompt changed/);
  check('moved hint cannot disappear', items => { items[121].usage = items[121].usage.replace(/ 语域提示：.*$/, ''); }, false, /Moved usage hint missing/);
  check('original usage cannot disappear', items => { items[0].usage = '新提示替代旧提示。'; }, false, /usage tips changed/);
  check('original primary example protected', items => { items[0].ex += ' This is changed.'; }, false, /history changed/);
  console.log('Passed 21 validation regression checks: examples, prompt cleanup, original history, reading imports and daily publication limits.');
} finally {
  fs.rmSync(fixture, {recursive:true, force:true});
}
