// Test-only D1 statement shim. No network or remote database.
import {DatabaseSync} from 'node:sqlite';
export function openSQLiteD1(path = ':memory:') {
  const sqlite = new DatabaseSync(path);
  sqlite.exec('PRAGMA busy_timeout=10000;');
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return {bind(...values) { return {async first() { return statement.get(...values) ?? null; }}; }};
    },
    close() { sqlite.close(); },
  };
}
