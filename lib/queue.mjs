import fs from 'node:fs/promises';
import path from 'node:path';
import {tagPath} from './tagPath.mjs';
import Security from '@ki1r0y/distributed-security';

// Having a single queue for all writes makes the behavior deterministic. A side-effect is that we don't
// need any mechanism to make writes atomic (e.g., fs.rename from a temp). However, to keep things consistent,
// any server-side writes should use the endpoint (like a microservice) rather than writing directly to
// the same directory.
var queue = Promise.resolve();


['Team', 'KeyRecovery', 'EncryptionKey'].forEach(collectionName => 
  queue = queue.then(() => Security.Storage.mkdir(tagPath(collectionName, ''))));




export function enqueueRequest(req, res, next) { // Middleware to adds the req to a common FIFO queue.
  // Some requests (such as storing data) might not need to respond with a particularly meaningful value,
  // and so those requests could return right away after enqueue work to be done later.
  // But it is much kinder and more orderly to not send back a response until the work has
  // been completed. That's what happens when you use this at the head of a route.
  queue = queue.then(next);
}

