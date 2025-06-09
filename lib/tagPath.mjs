import process from 'node:process';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import Security from '@ki1r0y/distributed-security';

const serverPath = process.env.KI1R0Y_STORAGE_ROOT || path.dirname(new URL(import.meta.url).pathname), // Does not include module filename.
      dbPath = path.resolve(serverPath, '..', 'Storage');

async function mkdir(pathname) { // Make pathname exist, including any missing directories.
  if (!await fs.mkdir(pathname, {recursive: true})) return;
  // Subtle: On some machines (e.g., my mac with file system encryption), mkdir does not flush,
  // and a subsequent read gets an error for missing directory.
  // We can't control what happens in express.static, so let's ensure here that reading works the way we think.
  let dummy = path.join(pathname, 'dummy');
  await fs.writeFile(dummy, '', {flush: true});
  await fs.unlink(dummy);
}
function tagPath(collectionName, tag) { // Absolute file system path to the tag file within collectionName.
  // Because we use express.static for reading, it must match uri of distributged-security Storage.
  return path.join(dbPath, Security.Storage.tagPath(collectionName, tag));
}
function pathTag(req, res, next) { // Middleware to invert tagPath - i.e., set the tag from the path components
  // let {collectionName, tag} = req.params;
  // req.params.tag = tag; // I.e., currently a no-op
  next();
}
export {tagPath, pathTag, dbPath, mkdir};
