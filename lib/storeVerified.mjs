import fs from 'node:fs/promises';
import {tagPath} from './tagPath.mjs';

export async function storeVerifiedBody(req, res, next) {
  // Store verified body by either writing it to a file or removing the file (if there's no content).
  // Requires req.verified to be set.
  let {body} = req,
      {collectionName, tag} = req.params,
      pathname = tagPath(collectionName, tag),
      verifiedContent = req.verified.text;
  await verifiedContent ? fs.writeFile(pathname, body, {flush: true}) : fs.unlink(pathname)
  next();
}
