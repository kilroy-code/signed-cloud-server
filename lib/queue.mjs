import fs from 'node:fs/promises';
import path from 'node:path';
import {tagPath} from './tagPath.mjs';

// Having a single queue for all writes makes the behavior deterministic. A side-effect is that we don't
// need any mechanism to make writes atomic (e.g., fs.rename from a temp). However, to keep things consistent,
// any server-side writes should use the endpoint (like a microservice) rather than writing directly to
// the same directory.
var queue = Promise.resolve();

async function mkdir(pathname) {
  await fs.mkdir(pathname, {recursive: true});
  // Subtle: On some machines (e.g., my mac with file system encryption), mkdir does not flush,
  // and a subsequent read gets an error for missing directory.
  // We can't control what happens in express.static, so let's ensure here that reading works the way we think.
  let dummy = path.join(pathname, 'dummy');
  await fs.writeFile(dummy, '', {flush: true});
  await fs.unlink(dummy)
}


['Team', 'KeyRecovery', 'EncryptionKey'].forEach(collectionName => 
  queue = queue.then(() => mkdir(tagPath(collectionName, ''))));




export function enqueueRequest(req, res, next) { // Middleware to adds the req to a common FIFO queue.
  // Some requests (such as storing data) might not need to respond with a particularly meaningful value,
  // and so those requests could return right away after enqueue work to be done later.
  // But it is much kinder and more orderly to not send back a response until the work has
  // been completed. That's what happens when you use this at the head of a route.
  queue = queue.then(next);
}

