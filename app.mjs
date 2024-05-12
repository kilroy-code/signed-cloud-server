import process from 'process';
import path from 'path';
import * as fs from 'node:fs/promises';
import express from 'express';
import logger from 'morgan';
import {keys, origin} from './lib/storage.mjs';
import pkg from './package.json' assert {type: 'json'};
process.title = 'ki1r0ystore';

const port = new URL(origin).port;
const app = express();
app.use(logger(':date[iso] :method :url :status :res[content-length] :response-time '));
app.use('/db', keys);

for (let relative of ['node_modules/@kilroy-code/kilroy/public', '../..', '../../../../public']) {
  let real = await fs.realpath(relative).catch(() => {});
  if (real) {
    console.log({relative, real});
    app.use(express.static(real)); // { maxAge: '1h'}
  }
}

app.listen(port, () => console.log(`${pkg.name} ${pkg.version} listening on port ${port}`));


