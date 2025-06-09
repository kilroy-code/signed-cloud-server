import fs from 'node:fs/promises';
import Security from '@ki1r0y/distributed-security';
import {tagPath, mkdir} from './tagPath.mjs';

export const origin = Security.Storage.origin; // Prior to installing our own Storage on the following line.
export const ready = Security.ready;

Security.Storage = { // Plug in a partial implemetation of Storage for Security to use.
  // When uploading data, we do a deep verification of the signature.
  // The basic cryptographic signatures check requires no external lookups,
  // but to check whether the signer is a member of the specified team,
  // Security has to look at the membership roster. Doing so with signed-storage-client
  // would be circular, so here we just look directly in the file system.
  // This implementation is not a general Storage: we don't ever create or modify at all, and
  // we only read when we are ABOUT to write (and have not started writing yet, so no conflict).
  // For our current purposes, this could be done with a 1-deep cache, set by store(req, res)
  // before calling Security.verify(), or for a more general cloud storage, by a memcache.
  async retrieve(collectionName, tag) {
    let pathname = tagPath(collectionName, tag),
        string = await fs.readFile(pathname, {encoding: 'utf8'}).catch(() => "");
    if (!string) return string;
    return JSON.parse(string);
  },
  mkdir: mkdir,
  tagPath: Security.Storage.tagPath  // We do need the original mkdir and tagPath.
}

export async function deepVerify(req, res, next) {
  // Middleware to add req.verified based on the signature in req.body, and whether it is signed by a current member of the tag.
  // If it fails, the request is forbidden.

  if (req.headers['content-type'] !== 'application/json') return res.status(415).send('Requires JSON'); // Be nice for common mistake.

  let {body} = req,
      {tag} = req.params,
      signatureObject;
  try {
    signatureObject = JSON.parse(body);
    req.verified = await Security.verify(signatureObject, {team: tag, notBefore: 'team'}).catch(fail => undefined);
    if (req.verified) return next();
  } catch (e) {
    return res.status(415).send(e.message); // Unsupported Media Type
  }
  res.status(403).send('Signature is not valid'); // Forbidden
}
