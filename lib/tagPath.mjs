import process from 'node:process';
import path from 'node:path';
import Security from '@ki1r0y/distributed-security'

const serverPath = process.env.KI1R0Y_STORAGE_ROOT || path.dirname(new URL(import.meta.url).pathname), // Does not include module filename.
      dbPath = path.resolve(serverPath, '..', 'db'),
      mkdir = Security.Storage.mkdir;

function tagPath(collectionName, tag) { // Absolute file system path to the tag file within collectionName.
  // Because we use express.static for reading, it must match uri of distributged-security Storage.
  return path.join(dbPath, Security.Storage.tagPath(collectionName, tag));
}
function pathTag(req, res, next) { // Middleware to invert tagPath - i.e., set the tag from the path components
  let {collectionName, a, b, c, rest} = req.params;
  req.params.tag = a+b+c+rest;
  next();
}
export {tagPath, pathTag, dbPath, mkdir};
