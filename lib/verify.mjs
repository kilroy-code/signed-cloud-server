import fs from 'node:fs/promises';
import Security from '../../distributed-security/lib/api.mjs';
import {tagPath} from './tagPath.mjs';

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
  }
}

export async function deepVerify(req, res, next) {
  // Middleware to add req.verified based on the signature in req.body, and whether it is signed by a current member of the tag.
  // If it fails, the request is forbidden.
  let {body} = req,
      {tag} = req.params,
      signatureObject = JSON.parse(body),
      verified = req.verified = await Security.verify(signatureObject, {team: tag, notBefore: 'team'}).catch(fail => undefined);
  if (verified) return next();
  res.status(403).status('Signature is not valid');
}
