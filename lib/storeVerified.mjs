import fs from 'node:fs/promises';
import path from 'node:path';
import {tagPath, mkdir} from './tagPath.mjs';

export async function storeVerifiedBody(req, res, next) {
  // Store verified body by either writing it to a file or removing the file (if there's no content).
  // Requires req.verified to be set.
  let {body} = req,
      {collectionName, tag} = req.params,
      pathname = tagPath(collectionName, tag),
      verifiedContent = req.verified.text;
  if (verifiedContent) {
    let directory = path.dirname(pathname)
    await mkdir(directory);
    await fs.writeFile(pathname, body, {flush: true});
  } else if (req.verified) { // Bogus data can't be used to delete things.
    // Subtle: If there's no verifiedContent, we delete the file. But some implementations of unlink resolve before
    // the file system has truly flushed the data. That can result in (await Security.destroy(); await Security.retrieve())
    // producing the old data! We handle this by moving the file out of the way and then deleting that.
    let alt = pathname + '.DEL';   // Because of request queueing, overlapping requests to the same tag will have "completed" unlink before next rename.
    await fs.rename(pathname, alt);
    await fs.unlink(alt);
  }
  next();
}
