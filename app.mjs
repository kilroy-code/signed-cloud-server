import path from 'node:path';
import express from 'express';
import logger from 'morgan';
import pkg from './package.json' assert {type: 'json'};
const port = 8000;
const app = express();
app.use(logger(':date[iso] :method :url :status :res[content-length] :response-time '))

const serverPath = path.dirname(new URL(import.meta.url).pathname), // Does not include module filename.
      publicPath = path.join(serverPath, 'public'),
      dbPath = path.join(publicPath, 'db');
app.use(express.static(publicPath, { maxAge: '1h'}));
app.use(express.text({type: '*/*'}));

import fs from 'node:fs/promises';
import Security from '../distributed-security/lib/api.mjs';
function dbPathname(collectionName, tag) {
  return path.join(dbPath, collectionName, `${tag}.json`);
}
Security.Storage = { // Plug in a partial implemetation of Storage for Security to use.
  // When uploading data, we do a deep verification of the signature.
  // The basic cryptographic signatures check requires no external lookups,
  // but to check whether the signer is a member of the specified team, we
  // Security has to look at the membership roster. Doing so with signed-storage-client
  // would be circular, so here we just look directly in the file system.
  // This is not a general Storage: we don't ever need to store() at all, and
  // we only read when we are ABOUT to write (and have not started writing yet, so no conflict).
  // For our current purposes, this could be done with a 1-deep cache set by store(req, res)
  // before calling Security.verify(), or for a more general cloud storage, by a memcache.
  async retrieve(collectionName, tag) {
    let pathname = dbPathname(collectionName, tag),
        string = await fs.readFile(pathname, {encoding: 'utf8'}).catch(() => "");
    if (!string) return string;
    return JSON.parse(string);
  }
}

const keys = express.Router();
// Having a single queue for all writes makes the behavior deterministic. A side-effect is that we don't
// need any mechanism to make writes atomic (e.g., fs.rename from a temp). However, to keep things consistent,
// any server-side writes should use the endpoint (like a microservice) rather than writing directly to
// the same directory.
var queue = Promise.resolve();
['Team', 'KeyRecovery', 'EncryptionKey'].forEach(collectionName => 
  queue = queue.then(() => fs.mkdir(path.join(dbPath, collectionName), {recursive: true})));

async function store(req, res) {
  let {body} = req,
      {collectionName, tag} = req.params,
      payload = JSON.parse(body),
      pathname = dbPathname(collectionName, tag);
  let verified = await Security.verify(payload, {team: tag, notBefore: 'team', forceError: true}).catch(fail => undefined);
  if (!verified) return res.status(403).status('Signature is not valid');
  queue = queue.then(() => verified?.text ? fs.writeFile(pathname, body, {flush: true}) : fs.unlink(pathname));
  // It doesn't matter what we respond with, although of course we must respond with something.
  // Here we wait for our turn in the queue and for the write to complete, just in case the
  // client needs to know that the data is, in fact, now persisted.
  res.send(await queue);
}
keys.put('/:collectionName/:tag.json', store);

app.use('/db', keys);
app.listen(port, () => console.log(`${pkg.name} ${pkg.version} listening on port ${port}`));


