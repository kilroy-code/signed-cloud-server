import process from 'process';
import path from 'path';
import * as fs from 'node:fs';
import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import {keys, origin, ready} from './lib/storage.mjs';
process.title = 'ki1r0ystore';   // So that we can find it in, e.g., ps

const port = new URL(origin).port; // Indirectly, through distributed-security, this is the origin that it will contact.
const app = express();
app.use(logger(':date[iso] :method :url :status :res[content-length] :response-time '));

app.use(cors()); // EDIT THIS TO SOMETHING MORE SPECIFIC for your needs.
app.use('/Storage', keys);  // This is what supports the default Storage built into distributed-security.
const resolved = import.meta.resolve("@ki1r0y/distributed-security"); // Wherever it may be.
const ki1r0y = path.join(new URL(resolved).pathname, '../../..');
console.log(`@ki1r0y served from ${ki1r0y}.`);
app.use('/@ki1r0y', express.static(ki1r0y));
app.use(express.static(fs.realpathSync('public')));

app.listen(port, async () => {
  let {name, version} = await ready;
  console.log(`Listening on port ${port} with ${name} ${version}.`);
});


