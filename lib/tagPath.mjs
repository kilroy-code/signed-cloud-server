import process from 'node:process';
import path from 'node:path';

const serverPath = process.env.KI1R0Y_STORAGE_ROOT || path.dirname(new URL(import.meta.url).pathname), // Does not include module filename.
      dbPath = path.resolve(serverPath, '..', 'db');

function tagPath(collectionName, tag) { // Absolute file system path to the tag file within collectionName.
  // Because we use express.static for reading, it must match uri of signed-cloud-client (but not worth trying to share a dependent module).
  return path.join(dbPath, collectionName, `${tag}.json`);
}
export {tagPath, dbPath};
