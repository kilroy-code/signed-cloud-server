import process from 'process';
import path from 'path';
import * as fs from 'node:fs/promises';
import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import {keys, origin} from './lib/storage.mjs';
import pkg from './package.json' assert {type: 'json'};
process.title = 'ki1r0ystore';   // So that we can find it in, e.g., ps

const port = new URL(origin).port; // Indirectly, through distributed-security, this is the origin that it will contact.
const app = express();
app.use(logger(':date[iso] :method :url :status :res[content-length] :response-time '));



app.use(cors({origin: 'https://ki1r0y.com'})) // EDIT THIS TO WHEREVER THE APPLICATION IS SERVED. (No need for localhost.)

app.use('/db', keys);  // This is What supports the default Storage built into distributed-security.



// There are three places where ki1r0y stuff might be, depending on how things are installed.
for (let relative of [
  'node_modules/@kilroy-code/kilroy/public', // ki1r0y package installed as a dev dependency of signed-cloud-server, for GitHub actions.
  '../..',                                   // signed-cloud-server repo cloned under a server app's public directory.
  '../../../public'                          // signed-cloud-server package installed as a dependency of a server app.
]) {
  let real = await fs.realpath(relative).catch(() => {});
  if (real) {
    app.use(express.static(real)); // { maxAge: '1h'}
  }
}

app.listen(port, () => console.log(`${pkg.name} ${pkg.version} listening on port ${port}`));


