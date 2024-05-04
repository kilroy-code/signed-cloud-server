import fs from 'node:fs/promises';
import {tagPath} from './tagPath.mjs';

export async function storeVerifiedBody(req, res, next) {
  // Store verified body by either writing it to a file or removing the file (if there's no content).
  // Requires req.verified to be set.
  let {body} = req,
      {collectionName, tag} = req.params,
      pathname = tagPath(collectionName, tag),
      verifiedContent = req.verified.text;
  // Subtle: If there's no verifiedContent, we delete the file. But some implementations of unlink resolve before
  // the file system has truly flushed the data. That can result in (await Security.destroy(); await Security.retrieve())
  // producing the old data! Since our definition of Storage.retrieve returns an empty string if the content is empty AND
  // on 404. We delete by first writing and flushing empty content, and THEN unlinking.
  if (!verifiedContent) body = '';
  await fs.writeFile(pathname, body, {flush: true});
  if (!verifiedContent) await fs.unlink(pathname);
  next();
}
