import {app} from 'electron';
import {join} from 'path';

export function getDbPath() {
  let dbPath;

  try {
    if (app.isPackaged) {
      dbPath = join(app.getPath('userData'), 'db.sqlite3');
    } else {
      dbPath = join(app.getPath('userData'), 'dev-db.sqlite3'); // Your original database location
    }
  } catch {
    // Default development database location, or other location you choose
    dbPath = join(__dirname, 'dev-db.sqlite3');
  }

  return dbPath;
}
