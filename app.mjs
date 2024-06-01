import process from 'process';
import path from 'path';
import * as fs from 'node:fs';
import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import {keys, origin} from './lib/storage.mjs';
import pkg from './package.json' with {type: 'json'};
process.title = 'ki1r0ystore';   // So that we can find it in, e.g., ps

const port = new URL(origin).port; // Indirectly, through distributed-security, this is the origin that it will contact.
const app = express();
app.use(logger(':date[iso] :method :url :status :res[content-length] :response-time '));


app.use(cors()) // EDIT THIS TO SOMETHING MORE SPECIFIC for your needs.
app.use('/db', keys);  // This is What supports the default Storage built into distributed-security.

// There are a few places where @ki1r0y/distributed-security might be, depending on how things are installed.
[
  '../../../public/',                        // signed-cloud-server repo cloned under a server app's public directory, OR installed as a dependent package.
  'node_modules/'                            // distributed-security installed as our dependency
].some(relative => {
  try {
    let real = fs.realpathSync(relative);
    if (real) {
      console.log('Public files at', real);
      return app.use(express.static(real)); // { maxAge: '1h'}
    }
  } catch (_) { }
});


app.listen(port, () => console.log(`${pkg.name} ${pkg.version} listening on port ${port}`));


