import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Worker, isMainThread, parentPort, workerData} from 'node:worker_threads';
import {createD1Quota} from '../server/quota.mjs';
import {openSQLiteD1} from './sqlite-d1.mjs';
// Exercise the generated deployment DDL, not the standalone recovery draft.
const migration = readFileSync(new URL('../drizzle/0000_robust_richard_fisk.sql', import.meta.url), 'utf8');
const req = n => `request-${String(n).padStart(16, '0')}`;

if (!isMainThread) {
  const db = openSQLiteD1(workerData.path);
  const quota = createD1Quota({db, budgetMicros: workerData.budget, now: () => 123456, attemptLimit: 3});
  parentPort.postMessage('ready');
  parentPort.once('message', async () => {
    try { parentPort.postMessage({allowed: await quota[workerData.method](workerData.args)}); }
    catch (e) { parentPort.postMessage({error: e.message}); }
    finally { db.close(); }
  });
} else {
  function fixture(t, config = {}) {
    const db = openSQLiteD1(); db.sqlite.exec(migration); t.after(() => db.close());
    let time = 100000;
    const quota = createD1Quota({db, budgetMicros: 100, now: () => time, ...config});
    return {db, quota, setTime: n => time = n};
  }
  async function race(t, cases, budget = 100) {
    const dir = mkdtempSync(join(tmpdir(), 'nurse-recovered-quota-')); const path = join(dir, 'ledger.sqlite');
    const setup = openSQLiteD1(path); setup.sqlite.exec('PRAGMA journal_mode=WAL;'); setup.sqlite.exec(migration); setup.close();
    const workers = cases.map(c => new Worker(new URL(import.meta.url), {workerData: {path, budget, ...c}}));
    t.after(async () => { await Promise.all(workers.map(w => w.terminate())); rmSync(dir, {recursive: true, force: true}); });
    await Promise.all(workers.map(w => new Promise((resolve, reject) => {w.once('message', resolve); w.once('error', reject);})));
    const answers = workers.map(w => new Promise((resolve, reject) => {w.once('message', resolve); w.once('error', reject);}));
    workers.forEach(w => w.postMessage('go'));
    const results = await Promise.all(answers);
    for (const result of results) assert.equal(result.error, undefined, result.error);
    const db = openSQLiteD1(path); const rows = db.sqlite.prepare('SELECT * FROM api_cost_reservations').all(); db.close();
    return {results, rows};
  }
  test('configuration and malformed request values fail closed', async t => {
    for (const budgetMicros of [undefined, -1, 0, 1.1, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => createD1Quota({db: {prepare() {}}, budgetMicros}), /CONFIGURATION/);
    const {quota} = fixture(t, {siteId: 'site-a'});
    assert.equal(await quota.checkAttempt({siteId: 'site-b', userId: 'u'}), false);
    assert.equal(await quota.reserve({userId: 'u', requestId: req(1), maxCostMicros: 101}), false);
    assert.equal(await quota.reserve({userId: 'u', requestId: 'bad', maxCostMicros: 1}), false);
    assert.equal(await quota.checkAttempt({userId: 'u', requestsPerMinute: 0}), false);
  });
  test('attempt windows isolate users/sites and obey server ceiling and reset', async t => {
    const {quota, setTime} = fixture(t);
    const a = {siteId: 's1', userId: 'u1', requestsPerMinute: 999};
    for (let i = 0; i < 3; i++) assert.equal(await quota.checkAttempt(a), true);
    assert.equal(await quota.checkAttempt(a), false);
    assert.equal(await quota.checkAttempt({...a, userId: 'u2'}), true);
    assert.equal(await quota.checkAttempt({...a, siteId: 's2'}), true);
    setTime(120000); assert.equal(await quota.checkAttempt(a), true);
  });
  test('budget and idempotency persist across periods; failed upstream reservation has no refund', async t => {
    const {quota, setTime, db} = fixture(t, {budgetPeriodMs: 1000});
    const a = {siteId: 's', userId: 'u', requestId: req(1), maxCostMicros: 60};
    assert.equal(await quota.reserve(a), true); assert.equal(await quota.reserve(a), false);
    assert.equal(await quota.reserve({...a, requestId: req(2)}), false);
    assert.equal(await quota.reserve({...a, requestId: req(2), maxCostMicros: 40}), true);
    setTime(101000); assert.equal(await quota.reserve(a), false);
    assert.equal(await quota.reserve({...a, requestId: req(3), maxCostMicros: 100}), true);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM api_cost_reservations').get().n, 3);
    assert.deepEqual(Object.keys(quota).sort(), ['checkAttempt', 'reserve']);
  });
  test('same request ID is independent across users and sites', async t => {
    const {quota} = fixture(t); const base = {siteId: 's', userId: 'u', requestId: req(1), maxCostMicros: 100};
    assert.equal(await quota.reserve(base), true); assert.equal(await quota.reserve({...base, userId: 'v'}), true); assert.equal(await quota.reserve({...base, siteId: 't'}), true);
  });
  test('12 concurrent connections cannot overspend final budget', async t => {
    const {results, rows} = await race(t, Array.from({length: 12}, (_, i) => ({method: 'reserve', args: {siteId: 's', userId: 'u', requestId: req(i), maxCostMicros: 30}})));
    assert.equal(results.filter(r => r.allowed).length, 3); assert.equal(rows.reduce((n, r) => n + r.max_cost_micros, 0), 90);
  });
  test('12 concurrent identical request IDs authorize upstream only once', async t => {
    const {results, rows} = await race(t, Array.from({length: 12}, () => ({method: 'reserve', args: {siteId: 's', userId: 'u', requestId: req(1), maxCostMicros: 1}})));
    assert.equal(results.filter(r => r.allowed).length, 1); assert.equal(rows.length, 1);
  });
  test('12 concurrent attempt checks enforce exact per-window ceiling', async t => {
    const {results} = await race(t, Array.from({length: 12}, () => ({method: 'checkAttempt', args: {siteId: 's', userId: 'u', requestsPerMinute: 3}})));
    assert.equal(results.filter(r => r.allowed).length, 3);
  });
  test('concurrent identical IDs retain separate site/user budgets', async t => {
    const scopes = [{siteId: 's1', userId: 'u1'}, {siteId: 's1', userId: 'u2'}, {siteId: 's2', userId: 'u1'}, {siteId: 's2', userId: 'u2'}];
    const cases = scopes.flatMap(scope => Array.from({length: 3}, () => ({method: 'reserve', args: {...scope, requestId: req(1), maxCostMicros: 100}})));
    const {results, rows} = await race(t, cases); assert.equal(results.filter(r => r.allowed).length, 4); assert.equal(rows.length, 4); assert.equal(new Set(rows.map(r => r.site_id + '/' + r.user_id)).size, 4);
  });
  test('database or clock failures never authorize attempts or spend', async () => {
    const db = {prepare() { throw Error('database-unavailable'); }}; const quota = createD1Quota({db, budgetMicros: 100});
    await assert.rejects(quota.checkAttempt({siteId: 's', userId: 'u'}), /database-unavailable/);
    await assert.rejects(quota.reserve({siteId: 's', userId: 'u', requestId: req(1), maxCostMicros: 1}), /database-unavailable/);
    const badClock = createD1Quota({db, budgetMicros: 100, now: () => NaN}); await assert.rejects(badClock.checkAttempt({siteId: 's', userId: 'u'}), /INVALID_QUOTA_CLOCK/);
  });
  test('schema stores quota metadata only', async t => {
    const {db} = fixture(t); const cols = ['api_attempt_windows', 'api_cost_reservations'].flatMap(name => db.sqlite.prepare(`PRAGMA table_info(${name})`).all().map(row => row.name));
    assert.deepEqual([...new Set(cols)].sort(), ['attempts', 'budget_period_start_ms', 'created_at_ms', 'max_cost_micros', 'request_id', 'site_id', 'user_id', 'window_start_ms']);
  });
}
